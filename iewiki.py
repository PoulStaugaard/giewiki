# this:  iewiki.py
# by:    Poul Staugaard [poul(dot)staugaard(at)gmail...]
# URL:   http://code.google.com/p/giewiki
# ver.:  1.18.3

import cgi
import codecs
import datetime
import difflib
import glob
import hashlib
import logging
import os
import re
import urllib
import urlparse
import uuid
import xml.dom.minidom

from new import instance, classobj
from os import path

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.api import mail
from google.appengine.api import namespace_manager
from google.appengine.api import search
from google.appengine.api import app_identity

from google.appengine.runtime import apiproxy_errors

from giewikidb import Tiddler,TagLink,SiteInfo,ShadowTiddler,EditLock,Page,MCPage,PageTemplate,DeletionLog,Comment,Include,Note,Message,Group,GroupMember,UrlImport,UploadedFile,UserProfile,PenName,SubDomain,LogEntry,CronJob,SearchHistory,IndexQueue
from giewikidb import truncateModel, truncateAllData, HasGroupAccess, ReadAccessToPage, AccessToPage, IsSoleOwner, Upgrade, CopyIntoNamespace, dropCronJob, noSuchTiddlers

from javascripts import javascriptDict

giewikiVersion = '1.18.3'
TWComp = 'twcomp.html'

_INDEX_NAME = 'tiddlers'

# status codes, COM style:
S_OK = 0
S_FALSE = 1
E_FAIL = -1

HttpMethods = '\
createPage\n\
moveThisPage\n\
editTiddler\n\
unlockTiddler\n\
lockTiddler\n\
saveTiddler\n\
dropTiddlerEdit\n\
addTags\n\
changeTags\n\
deleteFile\n\
deleteTiddler\n\
revertTiddler\n\
deleteVersions\n\
tiddlerHistory\n\
tiddlerVersion\n\
tiddlerDiff\n\
getLoginUrl\n\
pageProperties\n\
clipboard\n\
userProfile\n\
getUserInfo\n\
addProject\n\
deletePage\n\
getNewAddress\n\
submitComment\n\
deleteComment\n\
alterComment\n\
getComments\n\
getNotes\n\
getMessages\n\
getTiddler\n\
getTiddlers\n\
listTiddlersTagged\n\
searchText\n\
searchHistory\n\
buildIndex\n\
listIndex\n\
fileList\n\
replaceExistingFile\n\
recycleBin\n\
getRecentChanges\n\
getRecentComments\n\
siteMap\n\
getGroups\n\
createGroup\n\
getGroupMembers\n\
addGroupMember\n\
removeGroupMember\n\
evaluate\n\
tiddlersFromUrl\n\
openLibrary\n\
listScripts\n\
smugFeed\n\
urlFetch\n\
updateTemplate\n\
getTemplates'

jsProlog = '\
// This file is auto-generated\n\
var giewikiVersion = { title: "giewiki", major: 1, minor: 18, revision: 3, date: new Date("May 28, 2013"), extensions: {} };\n\
http = {\n\
  _methods: [],\n\
  _addMethod: function(m) { this[m] = new Function("a","return HttpGet(a,\'" + m + "\')"); }\n\
}\n\
\n\
http._init = function(ms) { for (var i=0; i < ms.length; i++) http._addMethod(ms[i]); }\n\
var lazyLoadTags = {};\n\
var lazyLoadSpecial = [];\n\
var lazyLoadAll = {};\n'

jsConfig ='\
var config = {\n\
	animDuration: 400,\n\
	appId: "<appid>",\n\
	autoSaveAfter: 20,\n\
	cascadeFast: 20,\n\
	cascadeSlow: 60,\n\
	cascadeDepth: 5,\n\
	locale: "en",\n\
	admin: <isAdmin>,\n\
	loginName: <loginName>,\n\
	owner: <pageOwner>,\n\
	access: "<access>",\n\
	anonAccess: "<anonAccess>",\n\
	authAccess: "<authAccess>",\n\
	groupAccess: "<groupAccess>",\n\
	groups: <userGroups>,\n\
	project: "<project>",\n\
	sitetitle: <sitetitle>,\n\
	subtitle: <subtitle>,\n\
	locked: <isLocked>,\n\
	tiddlerTags: <tiddlerTags>,\n\
	viewButton: <viewButton>,\n\
	viewPrior: <viewPrior>,\n\
	showByline: <showByline>,\n\
	foldIndex: <foldIndex>,\n\
	serverType: "<servertype>",\n\
	clientip: "<clientIP>",\n\
	timeStamp: "<timestamp>",\n\
	warnings: <allWarnings>,\n\
	pages: [ <siblingPages> ],\n\
	deprecatedCount: <deprecatedCount>,\n\
	noSuchTiddlers: <noSuchTiddlers>,\n\
	pageAttributes: { <pageAttributes> },\n\
	options: {\n\
		' # the rest is built dynamically

reserved_page_attrs = ('','path','sub','owner','ownername','anonAccess','authAccess','groupAccess',
	'titleModified','subtitleModified','systemInclude','gwversion','redirect','updateaccess','systeminclude','method','success',
	'title','subtitle','tags','tiddlertags','locked','anonymous','authenticated','group','groups','scripts',
	'viewbutton','viewprior','foldindex','showbyline','template')

def isNameAnOption(name):
	return name.startswith('txt') or name.startswith('chk')

def AttrValueOrBlank(o,a):
	return unicode(getattr(o,a)) if o != None and hasattr(o,a) and getattr(o,a) != None else ''

def jsEncodeStr(s):
	return 'null' if s is None else u'"' + unicode(s).replace(u'"',u'\\"').replace(u'\n',u'\\n').replace(u'\r',u'') + u'"'

def jsEncodeBool(b):
	return 'true' if b else 'false'

def MakeTextField(name,value):
	try:
		return search.TextField(name=name,value=value)
	except Exception,x:
		logging.info("Failed to make text field for " + name + ":" + str(type(value)))
		return search.TextField(name=name,value='')

def textParseHack(t): # needed by SDK 1.7, but seemingly not production environment
	if os.environ['SERVER_SOFTWARE'] == "Development/1.0":
		also = []
		tus = unicode(t)
		pos = tus.find(',')
		while pos > 0 and pos < len(tus):
			pre = pos - 1
			word = ""
			while pre >= 0:
				if tus[pre:pos].isalnum():
					word = tus[pre:pos]
					pre = pre - 1
				else:
					break
			if word:
				also.append(word)
			pos = tus.find(',',pos + 1)
		if len(also):
			return t + '\n\n' + ' '.join(also)
	return t

def CreateDocument(tiddler):
	"""Creates a search.Document from content, title, tags and fields"""
	fields=[MakeTextField(name='page', value='/'+tiddler.page.replace('/',' ')),
			MakeTextField(name='author', value=tiddler.author.nickname() if tiddler.author else tiddler.author_ip),
			MakeTextField(name='uxl_', value=tiddler.UXL_),
			search.DateField(name='date', value=tiddler.modified.date())]
	xcl = ['page','author','author_ip','UXL_','date','created','modified','version','vercnt','currentVer','current','public','locked','id','reverted','reverted_by','comments','messages','notes','edittemplate','viewtemplate','edittemplatespecial','historyview']
	ref = re.compile('^[A-Za-z][A-Za-z0-9_]*$')
	for fn,atr in tiddler.__dict__['_entity'].iteritems():
		if not fn in xcl:
			if ref.match(fn):
				fields.append(MakeTextField(name=fn,value=textParseHack(atr)))
	return search.Document(doc_id=tiddler.id,fields=fields)

def PutTiddler(tlr, page = None, put = True):
	if page is None:
		page = Page.all().filter("path",tlr.page).get()
	if page:
		owner = page.ownername if page.owner is None else page.owner.nickname()
		logging.info("PutTiddler(" + tlr.page + " / " + tlr.title + " , for " + owner)
		if tlr.public:
			uxl = '_publ'
		elif page.authAccess > page.NoAccess:
			uxl = '_auth'
		else:
			uxl = page.groups or ''
		setattr(tlr,'UXL_',uxl + " usr|" + owner)
	else:
		logging.info("PutTiddler(" + tlr.page + " / " + tlr.title + " , for ?")
		setattr(tlr,'UXL_','_publ')

	if put:
		tlr.put()
	try:
		index = search.Index(name=_INDEX_NAME)
		if tlr.current:
			index.put(CreateDocument(tlr))
		else:
			index.delete(tlr.id)
	except apiproxy_errors.CallNotFoundError:
		logging.info("Search service not supported; tiddler not indexed.")

class library():
	libraryPath = 'library/'
	def static(self):
		files = glob.glob(self.libraryPath + '*.xml')
		pages = []
		for p in files:
			pages.append(p[len(self.libraryPath):])
		return pages

	def local(self):
		pages = []
		for p in Page.all():
			if p.tags != None and 'library' in p.tags.split():
				pages.append(p.path)
		return pages

	def uploads(self):
		files = []
		for f in UploadedFile.all():
			if f.mimetype in ['text/xml','text/html']:
				files.append(f.path)
		return files

class MyError(Exception):
  def __init__(self, value):
	self.value = value
  def __str__(self):
	return repr(self.value)

def htmlEncode(s):
	return s.replace('"','&quot;').replace('<','&lt;').replace('>','&gt;').replace('\n','<br>')

def HtmlErrorMessage(msg):
	return '<html><body>' + htmlEncode(msg) + '</body></html>' 

def Filetype(filename):
	fp = filename.rsplit('.',1)
	if len(fp) == 1:
		return None
	else:
		return fp[1].lower()

def AttrValueOrBlank(o,a):
	return unicode(getattr(o,a)) if o != None and hasattr(o,a) and getattr(o,a) != None else ''

def templateAttribute(page, default_rv, attr = None):
	try:
		tpl = page.template
		if attr == None:
			return tpl
		elif hasattr(tpl,attr) and getattr(tpl,attr) != None:
			return getattr(tpl,attr)
		else:
			return default_rv
	except:
		return default_rv

def parseToken(m, p):
	if m.group(p): # Double quoted
		n = m.group(p)
	elif m.group(p + 1): # Single quoted
		n = m.group(p + 1)
	elif m.group(p + 2): # Double-square-bracket quoted
		n = m.group(p + 2)
	elif m.group(p + 3): # Double-brace quoted
		n = m.group(p + 3)
	elif m.group(p + 4): # Unquoted
		n = m.group(p + 4)
	elif m.group(p + 5): # empty quote
		n = ""
	return n

def paramParser(a):
	dblQuote = "(?:\"((?:(?:\\\\\")|[^\"])+)\")"
	sngQuote = "(?:'((?:(?:\\\\\')|[^'])+)')"
	dblSquare = "(?:\\[\\[((?:\\s|\\S)*?)\\]\\])"
	dblBrace = "(?:\\{\\{((?:\\s|\\S)*?)\\}\\})"
	unQuoted = "([^\"'\\s]\\S*)"
	emptyQuote = "((?:\"\")|(?:''))"
	token = "(?:" + dblQuote + "|" + sngQuote + "|" + dblSquare + "|" + dblBrace + "|" + unQuoted + "|" + emptyQuote + ")"
	mx = re.compile(token)
	return mx.finditer(a)

def tagStringToList(tags):
	ts = []
	for am in paramParser(tags):
		ts.append(parseToken(am, 1))
	return ts

def tagStringFromList(tl):
	qtl = []
	for t in tl:
		if ' ' in t:
			qtl.append('[[' + t + ']]')
		else:
			qtl.append(t)
	return ' '.join(qtl)

def AddTagsToList(slist,tags):
	list = tagStringToList(slist)
	changes = False
	for t in tags:
		if not t in list:
			list.append(t)
			changes = True
	if changes:
		return ' '.join(list)
	else:
		return slist

def AutoGenerateTemplate(source,page=None):
	# Generates a template from a file in /library
	statics = library().static()
	for asl in statics:
		if asl.split('.')[0] == source:
			npt = PageTemplate()
			sfpath = 'library/' + asl
			ftwd = codecs.open(sfpath,'r','utf-8')
			npt.page = 'static:' + asl
			npt.title = source
			npt.text = ftwd.read()
			rqPos = 0
			scripts = []
			while rqPos >= 0:
				rqPos = npt.text.find('Requires script',rqPos)
				if rqPos >= 0:
					eolPos = npt.text.find('\n',rqPos)
					rqsparts = npt.text[rqPos:eolPos].split('|')
					if len(rqsparts) > 2:
						what = rqsparts[-2]
						if javascriptDict.has_key(what):
							scripts.append(what)
					rqPos = eolPos + 1
			npt.scripts = '|'.join(scripts)
			npt.current = True
			npt.version = 0
			npt.put()
			ftwd.close()
			return npt
	return None

def MimetypeFromFiletype(ft):
	if ft == "txt":
		return "text/plain"
	if ft == "htm" or ft == "html":
		return "text/html"
	if ft == "xml":
		return "text/xml"
	if ft == "jpg" or ft == "jpeg":
		return "image/jpeg"
	if ft == "png":
		return "image/png"
	if ft == "gif":
		return "image/gif"
	return "application/octet-stream"
	
def subDiff(adiff,bdiff,rdiff):
	if len(adiff) == 1 and len(bdiff) == 1:
		tdiff = difflib.ndiff(adiff[0][2:].split(' '),bdiff[0][2:].split(' '))
		for s in tdiff:
			rdiff.append(s[0] + '.' + s[2:])
	else:
		rdiff += adiff + bdiff
  
html_escape_table = {
	"&": "&amp;",
	'"': "&quot;",
	"'": "&apos;",
	">": "&gt;",
	"<": "&lt;",
	}

def html_escape(text):
	return "".join(html_escape_table.get(c,c) for c in text)

def CombinePath(path,fn):
	if path.rfind('/') != len(path) - 1:
		path = path + '/'
	return path + fn

def leafOfPath(path):
	lp = path.rfind('/')
	if lp + 1 < len(path):
		return path[lp + 1:] + '/'
	return ""

def userWho():
	u = users.get_current_user()
	if u:
		return u.nickname()
	else:
		return ""

def userNameOrAddress(u,a):
	if u != None:
		return u.nickname()
	else:
		return a

def rootPageOwner(self):
	rp = Page.all().filter('path','/').get()
	if rp == None:
		if self.path == '/' or self.path.startswith('/_templates/'):
			return users.get_current_user()
		return None
	else:
		return rp.owner

def NoneIsFalse(v):
	return False if v == None else v

def NoneIsTrue(v):
	return True if v == None else v

def NoneIsBlank(v):
	return u"" if v == None else unicode(v)
	
def NoneIsDefault(a,d):
	return d if a is None else a

def toDict(iter,keyName):
	d = dict()
	for e in iter:
		keyVal = getattr(e,keyName)
		d[keyVal] = e
	return d
	
def tagInFilter(tags,filter):
	tags = tags.split()
	filter = filter.split()
	for t in tags:
		for f in filter:
			if t == f:
				return True
	return False
	
def addTagLinks(tlr,taglist):
	for atg in taglist:
		if TagLink.all().filter('tag',atg).filter('tlr',tlr.id).get() == None:
			ntl = TagLink()
			ntl.tag = atg
			ntl.tlr = tlr.id
			ntl.put()


def xmlArrayOfStrings(xd,te,text,name):
	if isinstance(text,basestring):
		text = text.split()
	for a in text:
		se = xd.createElement(name)
		te.appendChild(se)
		se.appendChild(xd.createTextNode(unicode(a)))
	te.setAttribute('type', 'string[]')

def replyWithStringList(cl,re,se,sl):
	xd = cl.initXmlResponse()
	tv = xd.createElement(re)
	xd.appendChild(tv)
	xmlArrayOfStrings(xd,tv,sl,se)
	cl.response.out.write(xd.toxml())

def xmlArrayOfObjects(xd,te,os,name):
	for a in os:
		se = xd.createElement(name)
		te.appendChild(se)
		for (d,v) in a.iteritems():
			de = xd.createElement(d)
			se.appendChild(de)
			de.appendChild(xd.createTextNode(unicode(v)))
	te.setAttribute('type', 'object[]')

def replyWithObjectList(cl,re,se,sl):
	xd = cl.initXmlResponse()
	tv = xd.createElement(re)
	xd.appendChild(tv)
	xmlArrayOfObjects(xd,tv,sl,se)
	cl.response.out.write(xd.toxml())

def presentTiddler(t,withKey=False):
	rp = { \
		'success': True, \
		'id': t.id, \
		'title': t.title, \
		'text': t.text, \
		'tags': t.tags, \
		'created': t.created.strftime('%Y%m%d%H%M%S'),
		'modifier': userNameOrAddress(t.author,t.author_ip),
		'modified': t.modified.strftime('%Y%m%d%H%M%S'),
		'version': t.version,
		'vercnt': t.vercnt
		}
	for dpn in t.dynamic_properties():
		rp[dpn] = str(getattr(t,dpn))
	if withKey:
		rp['key'] = t.key()
		rp['path'] = t.page
	return rp

def KillTiddlerVersion(t):
	if hasattr(t,'clipOwner'):
		clown = getattr(t,'clipOwner')
		u = UserProfile.all().filter('user', clown).get()
		if u != None:
			u.clipTiddler = None
			u.put()
	index = search.Index(name=_INDEX_NAME)
	index.delete(t.id)
	t.delete()

def initHist(shadowTitle,format):
	caps = []
	for fe in format.split('|'):
		form = fe.split(';',1)
		if len(form) > 1:
			caps.append( form[1] )
		else:
			caps.append('')
	versions = '|'.join(caps)
	if shadowTitle != None:
		versions += "|\n|>|Default content|<<diff 0 " + shadowTitle + '>>|<<revision "' + shadowTitle + '" 0>>|'
	return versions
  
def getTiddlerVersions(xd,tid,startFrom,format=None):
	text = u""
	lines = []
	if not format:
		format = "modified:%Y-%m-%d %H:%M;When|author;Who|version;V#|title;Title|field:tags;Tags"
	for tlr in Tiddler.all().filter('id', tid).order('version'):
		if len(lines) == 0:
			lines.append(initHist(tlr.title if startFrom == 0 else None,format))
		if tlr.version >= startFrom:
			modified = tlr.modified
			if hasattr(tlr,'reverted') and tlr.reverted != None:
				modified = tlr.reverted
			histline = []
			for afe in format.split('|'):
				afs = afe.split(';',1)
				if len(afs):
					fe = afs[0]
					if fe[:9] == 'modified:':
						histline.append(BoldCurrent(tlr) + modified.strftime(str(fe[9:])) + BoldCurrent(tlr))
					elif fe == 'version':
						histline.append(u'<<diff ' + unicode(tlr.version) + u' ' + tid + u'>>')
					elif fe == 'author':
						histline.append(u'<<author "' + getAuthor(tlr) + u'">>')
					elif fe == 'title':
						histline.append(u'<<revision "' + htmlEncode(tlr.title) + u'" ' + unicode(tlr.version) + u'>>')
					elif fe[:6] == 'field:':
						attrname = fe[6:]
						histline.append(unicode(getattr(tlr,attrname)).strip() if hasattr(tlr,attrname) else '')
					else:
						histline.append(fe + '?')
				else:
					histline.append('?')
			lines.append('|'.join(histline))
	eVersions = xd.createElement('versions')
	eVersions.appendChild(xd.createTextNode('|' + '|\n|'.join(lines) + '|'))
	return eVersions

def BoldCurrent(tlr):
	return u"''" if tlr.current else u""

def FixTWSyntaxAndParse(html):
	return xml.dom.minidom.parseString(html.replace('<br>','<br/>'))

def deleteTiddlerVersion(tid,ver):
	tlv = Tiddler.all().filter('id', tid).filter('version',ver).get()
	if tlv != None:
		KillTiddlerVersion(tlv)
		logging.info("Deleted " + str(tid) + " version " + str(ver))
		return True
	else:
		return False
		
def getAuthor(t):
	if t.author != None:
		return unicode(t.author.nickname())
	elif hasattr(t,'author_ip') and t.author_ip != None:
		return unicode(t.author_ip)
	else:
		return u"?"

def LogEvent(what,text):
	logging.info(what + ": " + text)

def mergeDict(td,ts,filter=None):
	for t in ts:
		if filter == None or filter(t):
			key = t.title
			if key in td:
				if t.version > td[key].version or t.id != td[key].id:
					td[key] = t
			else:
				td[key] = t

def getUserPenName(user):
	up = UserProfile.all().filter('user',user).get()
	return user.nickname() if up == None else up.txtUserName

def DateFromYyyyMmDdHhMm(a):
	if len(a) >= 8:
		hh = int(a[8:10]) if len(a) >= 10 else 0
		mm = int(a[10:12]) if len(a) >= 12 else 0 
		return datetime.datetime(int(a[0:4]),int(a[4:6]),int(a[6:8]),hh,mm)
	else:
		return datetime.datetime.now()

def TiddlerFromXml(te,path):
	id = None
	try:
		title = te.getAttribute('title')
		if title != "":
			id = te.getAttribute('id')
			author_ip = te.getAttribute('modifier')
			vt = te.getAttribute('viewTemplate')
			tags = te.getAttribute('tags')
			v = te.getAttribute('version')
			version = eval(v) if v != None and v != "" else 1
		else:
			return None
	except Exception, x:
		print(unicode(x))
		return None
		
	nt = Tiddler(page = path, title = title, id = id, version = version, author_ip = author_ip)
	nt.current = True
	if te.hasAttribute('modified'):
		nt.modified = DateFromYyyyMmDdHhMm(te.getAttribute('modified'))
	else:
		nt.modified = DateFromYyyyMmDdHhMm(te.getAttribute('created'))
	if te.hasAttribute('created'):
		nt.created = DateFromYyyyMmDdHhMm(te.getAttribute('created'))
	else:
		nt.created = nt.modified
	nt.tags = te.getAttribute('tags')
	if vt != '':
		setattr(nt,'viewTemplate',vt)
	for an in te.attributes.keys(): # the remaining attributes
		if not hasattr(nt,an):
			setattr(nt,an,te.getAttribute(an))

	for ce in te.childNodes:
		if ce.nodeType == xml.dom.Node.ELEMENT_NODE and ce.tagName == 'pre':
			if ce.firstChild != None and ce.firstChild.nodeValue != None:
				nt.text = ce.firstChild.nodeValue
				break
	if nt.text == None:
		nt.text = ""
	return nt

class XmlDocument(xml.dom.minidom.Document):
	def add(self,parent,name,text=None,attrs=None):
		e = self.createElement(name)
		parent.appendChild(e)
		if attrs != None:
			for n,v in attrs.iteritems():
				e.setAttribute(n,unicode(v))
		if text != None:
			e.appendChild(self.createTextNode(unicode(text)))
		return e
	def addArrayOfObjects(self,name,parent=None):
		if parent == None:
			parent = self
		return self.add(parent,name, attrs={'type':'object[]'})

class ImportException(Exception):
	def __init__(self,err):
		self.error = err
	def __str__(self):
		return self.error

def IsIPaddress(v):
	if len(v) < 4:
		return False
	lix = len(v) - 1
	if v[lix].find(':') > 0:
		v[lix] = v[lix].split(':')[0]
	for a in range(len(v)-4,len(v)):
		try:
			n = int(v[a])
			if n < 0 or n > 255:
				return False
		except Exception:
			return False
	return True

class MainPage(webapp.RequestHandler):
  "Serves wiki pages and updates"
  trace = list()
  merge = False

  def getSubdomain(self):
	hostc = self.request.host.split('.')
	if len(hostc) > 3: # e.g. subdomain.giewiki.appspot.com
		if IsIPaddress(hostc): # [sd.]n.n.n.n[:port]
			pos = len(hostc) - 5
		else:
			pos = len(hostc) - 4
	elif len(hostc) > 1 and hostc[len(hostc) - 1].startswith('localhost'): # e.g. sd.localhost:port
		pos = len(hostc) - 2
	# elif... support for app.org.tld domains -- TODO
	else:
		self.subdomain = None
		self.sdo = None
		#LogEvent("GetSubdomain", self.request.host)
		return ""

	if pos >= 0 and hostc[pos] != 'latest': # App engine uses this for alternate versions
		self.subdomain = hostc[pos]
		self.sdo = SubDomain.all().filter('preurl', self.subdomain).get()
		namespace_manager.set_namespace(self.subdomain)
	else:
		self.subdomain = None

  def initXmlResponse(self):
	self.response.headers['Content-Type'] = 'text/xml'
	self.response.headers['Cache-Control'] = 'no-cache'
	return XmlDocument()

  def sendXmlResponse(self,xd):
	self.initXmlResponse()
	self.response.out.write(xd.toxml())

  def AuthorIP(self):
	u = users.get_current_user()
	if u == None:
		return self.request.remote_addr
	p = UserProfile.all().filter('user',u).get()
	if p == None:
		return self.request.remote_addr
	return p.txtUserName

  def smugFeed(self):
	result = urlfetch.fetch(self.request.get('url'))
	width = int(self.request.get('width'))
	details = self.request.get('details').split(',')
	if result.status_code == 200:
		try:
			rss = xml.dom.minidom.parseString(result.content)
			if rss.documentElement.tagName == 'rss':
				rp = { 'success': True }
				for ce in rss.documentElement.childNodes:
					if ce.nodeType == xml.dom.Node.ELEMENT_NODE and ce.tagName == 'channel':
						rpc = []
						for chce in ce.childNodes:
							if chce.nodeType == xml.dom.Node.ELEMENT_NODE:
								if chce.tagName == 'item':
									medias = chce.getElementsByTagName('media:content')
									amedia = medias[0];
									for am in medias:
										aw = int(am.getAttribute('width'))
										if aw > width:
											amedia = am
											break
									if amedia:
										url = amedia.getAttribute('url')
										if 'dim' in details:
											url = url + ' ' + str(amedia.getAttribute('width')) + ' ' + str(amedia.getAttribute('height'))
										rpc.append(url)
						rp['images'] = '\n'.join(rpc)
				return self.reply(rp)
			else:
				return self.warn("Root element is " + rss.documentElement.tagName)
		except Exception, x:
			logging.info("Failed to parse " + self.request.get('url') + " :\n", str(x));
			self.fail(str(x));

  def SaveNewTiddler(self,page,name,value):
	p = Tiddler()
	p.page = page
	p.author = users.get_current_user()
	p.author_ip = self.AuthorIP()
	p.version = 1
	p.vercnt = 1
	p.comments = 0
	p.current = True
	p.title = name
	p.text = value
	p.tags = ""
	p.id = unicode(uuid.uuid4())
	p.save()
	return p

  def lock(self,t,usr,hasit):
	try:
		minutes = int(self.request.get("duration"))
	except:
		minutes = 0
		
	el = EditLock( id = t.id, user = usr, user_ip = self.request.remote_addr, duration = minutes)
	ek = el.put()
	until = el.time + datetime.timedelta(0,60*eval(unicode(el.duration)))
	re = {"success": True, "now": el.time, "until": until, "key": str(ek) }
	if not hasit:
		re["title"] = t.title
		re["text"] = t.text
		re["tags"] = t.tags
	return re

  def getAutoSavedVersion(self,at):
	rt = at
	for pt in Tiddler.all().filter('id',at.id):
		if pt.version > rt.version and 'autoSaved' in pt.tags:
			if (pt.author == users.get_current_user() if userWho() else pt.author_ip == self.request.remote_addr) and 'autoSaved' in tagStringToList(pt.tags): # verify by proper check
				rt = pt
	return rt

  def editTiddler(self):
	"http version tiddlerId"
	page = Page.all().filter("path",self.path).get()
	if page == None:
		error = "Page does not exist: " + self.path
	else:
		error = page.UpdateViolation()
	if error == None:
		tid = self.request.get('id')
		version = eval(self.request.get('version'))
		hasVer = eval(self.request.get('hasVersion'))
		if tid.startswith('include-'):
			return self.fail("Included from " + tid[8:])
		if version == -1:
			t = Tiddler.all().filter('id',tid).filter('current',True).get()
			if t and hasattr(t,'autosaved_by'):
				t = self.getAutoSavedVersion(t)
		else:
			t = Tiddler.all().filter('id',tid).filter('version',version).get()
		if t == None:
			error = "Tiddler doesn't exist"
		else:
			hasit = t.version == hasVer
			usr = users.get_current_user()
			el = EditLock.all().filter('id',t.id).get() # get existing lock, if any
			if el == None: # tiddler is not locked
				return self.reply(self.lock(t,usr,hasit))
			until = el.time + datetime.timedelta(0,60*eval(unicode(el.duration)))
			if (usr == el.user if usr != None else self.request.remote_addr == el.user_ip):
				# possibly we should extend the lock duration
				return self.fail("already locked by you", { "key": unicode(el.key()) })
			elif datetime.datetime.utcnow() < until:
				error = "already locked by " + userNameOrAddress(el.user, el.user_ip) + \
						" until " + unicode(until) + "( another " + unicode(until -  datetime.datetime.utcnow()) + ")"
			else:
				el.delete()
				reply = self.lock(t,usr,hasit)
				reply['until'] = until
				return self.warn( "Lock held by " + userNameOrAddress(el.user, el.user_ip) + " broken", reply)
	self.fail(error)

  def unlock(self,key):
	if key == '' or key is None:
		return True
	logging.info('Unlocking ' + str(key))
	lock = EditLock.get(db.Key(key))
	if lock != None:
		lock.delete()
		return True
	else:
		return self.fail("Lock was not held")
	
  def unlockTiddler(self):
	if self.unlock(self.request.get('key',None)):
		self.reply({})

  def lockTiddler(self):
	t = Tiddler.all().filter('id',self.request.get('tiddlerId')).filter('current',True).get()
	if t != None:
		t.locked = self.request.get('lock') == 'true'
		t.put()
		self.reply({"success": True})
	else:
		self.fail('no such tiddler')

  def authenticateAndSaveUploadedTiddlers(self):
	if users.get_current_user() == None:
		return False
	mckey = 'saveTiddler ' + str(self.request.remote_addr)
	posts = memcache.get(mckey)
	if posts != None:
		sl = []
		for tlr in posts:
			self.saveTiddler(tlr)
			sl.append(htmlEncode(tlr.title))
		memcache.delete(mckey)
		self.warnings.append(str(len(sl)) + " tiddler(s) received:<br>" + '<br>'.join(sl))
		return False
	else:
		self.redirect(self.request.path + '?no_posts')
		return True

  def uploadTiddler(self):
	return self.saveTiddler(upload=True)

  def saveTiddler(self, tlr=None, upload=False):
	"http tiddlerName text tags version tiddlerId versions"
	self.response.headers.add_header('Access-Control-Allow-Origin','*')
	tiddlerName = self.request.get('tiddlerName',None)
	title = str(datetime.datetime.today())[0:23] if tiddlerName is None else tiddlerName
	tlrId = self.request.get('tiddlerId')
	taglist = self.request.get_all('atag')
	autoSave = self.request.get('autoSave') == 'true'
	autoSavedAsVer = self.request.get('autoSavedAsVer',None)
	key = self.request.get("key")
	elr = None
	minorEdit = False
	sameVersion = False
	nCh = 0
	if tlr is None:
		reply = True # called directly
		if tlrId and autoSavedAsVer is None and "autoSaved" in taglist:
			for pt in Tiddler.all().filter('id',tlrId):
				if (pt.author == users.get_current_user() if userWho() else pt.author_ip == self.request.remote_addr) and 'autoSaved' in tagStringToList(pt.tags): # verify by proper check
					tlr = pt
					sameVersion = True
		if tlr is None and tlrId and autoSavedAsVer:
			tlr = Tiddler.all().filter('id', tlrId).filter('version',int(autoSavedAsVer)).get()
		elif self.request.get('minorEdit', False):
			tlr = Tiddler.all().filter('id',tlrId).filter('current',True).get()
			if tlr != None and (tlr.author == self.user or users.is_current_user_admin()): #only the author or an admin is allowed to do this
				minorEdit = True
			else:
				tlr = None
		if tlr is None:
			tlr = Tiddler()
			tlr.page = self.path
			autoSavedAsVer = None

		tlr.title = title
		if self.request.get('isPrivate',False) != False:
			tlr.private = 'true'
		for ra in self.request.arguments():
			if not ra in ('method','tiddlerId','tiddlerName','atag','fields','isPrivate','created','modifier','modified','minorEdit','fromVer','shadow','currentver','vercnt','key','reverted','reverted_by','links','linksUpdated','autoSave','autoSavedAsVer','historyView'):
				setattr(tlr,ra,self.request.get(ra))
		if not autoSave and "autoSaved" in taglist:
			taglist.remove("autoSaved")
			tlr.tags = tagStringFromList(taglist)
		if "lazyLoad" in taglist:
			setattr(tlr,'lazyLoad',True)
		elif hasattr(tlr,'lazyLoad'):
			delattr(tlr,'lazyLoad')
		tlr.id = tlrId
	else:
		reply = False # called from authenticateAndSaveUploadedTiddlers

	detail = { 'errorcode': E_FAIL }

	page = Page.all().filter("path",tlr.page).get()
	if page == None:
		error = "Page does not exist: " + tlr.page
	else:
		error = page.UpdateViolation()
		if upload or (error != None and users.get_current_user() == None and self.request.get('modified',None) != None):
			mckey = 'saveTiddler ' + str(self.request.remote_addr)
			rqlist = memcache.get(mckey)
			if rqlist == None:
				rqlist = []
			error = 'Please <a href="' + self.request.url + '?method=authenticate" target="_blank">authenticate your post</a>'
			if tlr.id == '':
				tlr.id = unicode(uuid.uuid4())
				tlr.version = 0
			rqlist.append(tlr)
			memcache.set(mckey, rqlist, 300)
			detail['modified'] = tlr.modified.strftime("%Y%m%d%H%M%S")
			detail['errorcode'] = S_FALSE
			detail['id'] = tlr.id
	t = Tiddler.all().filter('page',self.request.path).filter('current',True).filter('title',title).get()
	if t != None:
		if tlrId and t.id != tlrId:
			return self.fail("Tiddler name conflict, cannot save by this name")
	if tlr.id == '' or tlr.version == 0:
		tlr.version = 1
		tlr.vercnt = 1
	elif tlr.id in ['SiteTitle','SiteSubtitle']: # not versioned
		tlr.version = -1
	else:
		if tlr.id.startswith('include-'):
			# break the link and create a new tiddler
			nt = self.SaveNewTiddler(tlr.page, title, self.request.get("text"))
			return self.reply({'success': True, "id": nt.id})
		if t == None:
			t = Tiddler.all().filter('id', tlr.id).filter('current',True).get()
		if t == None:
			error = "Tiddler does not exist"
		else:
			if not (autoSavedAsVer or sameVersion):
				# Check if there are any changes at all
				for apn in (Tiddler.properties().keys() + tlr.dynamic_properties()):
					if apn in ['author','author_ip','created','modified','comments','public','current','version','vercnt','currentver','currentVer']:
						continue
					if apn in tlr.dynamic_properties() and getattr(tlr,apn) == '':
						nCh = nCh + 1
						delattr(tlr,apn)
					elif hasattr(t,apn):
						if getattr(t,apn) == getattr(tlr,apn):
							logging.info("The '" + apn + "' property is unchanged: " + unicode(getattr(tlr,apn)))
						else:
							nCh = nCh + 1
					elif apn in tlr.dynamic_properties():
						nCh = nCh + 1
				if nCh == 0:
					return self.fail("No changes to save (use cancel or [Esc] to close)!")
				if minorEdit == False and nCh > 0:
					tlr.version = t.version + 1
					tlr.vercnt = t.vercnt + 1 if hasattr(t,'vercnt') and t.vercnt != None else tlr.version
			if not autoSave:
				if key != '':
					if self.unlock(key) == False:
						return
				else:
					el = EditLock().all().filter('id',tlr.id).get() # locked by someone else?
					if el != None:
						if (el.user == users.get_current_user() if userWho else el.user_ip == self.request.remote_addr):
							pass # warn..?
						else:
							error = t.title + " locked by " + userNameOrAddress(el.user,el.user_ip)
					elif hasattr(tlr,'currentVer'):
						sv = getattr(tlr, 'currentVer')
						v = eval(sv)
						if v != t.version:
							error = "Edit conflict: '" +  t.title + "' version " + sv + " is not the current version (" + unicode(t.version) + " is)"
			
	if error != None:
		detail['version'] = tlr.version
		return self.fail(error,detail)
	
	if minorEdit == False:
		tlr.comments = 0
	if (tlr.id == ""):
		tlr.id = unicode(uuid.uuid4())
		if autoSave:
			tlr.current = True
			tlr.private = 'true'
			autoSavedAsVer = tlr.version
	else:
		if autoSave and key == '':
			el = EditLock.all().filter("id",t.id).get() # get existing lock, if any
			if el == None: # tiddler is not locked
				elr = self.lock(tlr,users.get_current_user(),True)
				if not elr['success']:
					return elr
			else:
				return self.fail("You already have a lock on this since " + str(el.time) if el.user == users.get_current_user() else "Already locked by " + el.user.nickname())

	if users.get_current_user():
		tlr.author = users.get_current_user()
	tlr.author_ip = self.AuthorIP() # ToDo: Get user's sig in stead
	if minorEdit == False:
		tls = Tiddler.all().filter('id', tlr.id).filter('version >=',tlr.version - 1)
		# At this point it's too late to cancel the save cuz we begin to update the prior versions, something that might, conceiveably be relegated to a task queue
		for atl in tls:
			if atl.version >= tlr.version and not (autoSavedAsVer or sameVersion):
				tlr.version = atl.version + 1
				tlr.comments = atl.comments
			if atl.current:
				if autoSave:
					setattr(atl,'autosaved_by',userNameOrAddress(users.get_current_user(),self.request.remote_addr))
					atl.put()
				else:
					if not (autoSavedAsVer or sameVersion):
						tlr.vercnt = atl.versionCount() + 1
					atl.current = False
					tlr.comments = atl.comments
					atl.put()
					dropCronJob(atl)

		if autoSave:
			if not "autoSaved" in taglist:
				taglist.append("autoSaved")
			tlr.tags = tagStringFromList(taglist)
			autoSavedAsVer = tlr.version
		else:
			tlr.current = True
			setattr(tlr,'currentVer',tlr.version)
			if not self.request.get('isPrivate',False):
				if hasattr(tlr,'private'):
					delattr(tlr,'private')

	crons = []
	for tag in taglist:
		if tag.startswith('@'):
			tps = tag[1:].split('@')
			if len(tps) > 1:
				dta = tps[0]
				if dta in ['announce','promote','demote','deprecate','revert']:
					dtp = tps[1].replace('T','-').split('-')
					if len(dtp) >= 3:
						try:
							if len(dtp) == 4:
								hour = int(dtp[3])
							else:
								hour = 0
							dtd = datetime.datetime(int(dtp[0]),int(dtp[1]),int(dtp[2]),hour)
							ncj = CronJob()
							ncj.when = dtd
							ncj.action = dta
							ncj.position = 0
							if len(tps) > 2:
								try:
									ncj.position = int(tps[2])
								except ValueError:
									pass
							crons.append(ncj)
						except Exception,x:
							return self.fail("Invalid date specified (should be yyyy-mm-dd or yyyy-mm-dd-hh)", tps[1])
				else:
					return self.fail("Unknown @action@ specified")

	if "includes" in taglist:
		tlf = list()
		tls = tlr.text.split("\n")
		for tlx in tls:
			link = tlx.strip(' \r\n\t')
			if link == "":
				continue
				
			if not (link.startswith("[[") and link.endswith("]]")):
				link = '[[' + link + "|" + link + ']]'

			tli = link.lstrip('[').rstrip(']').split("|").pop()  # test the URL part
					
			parts = tli.split("#")
			if len(parts) == 2:
				tlxs = Tiddler.all().filter("page", parts[0]).filter("title", parts[1]).filter("current",True).get()
				if tlxs != None:
					incl = Include.Unique(tlr.page,tlxs.id)
					if "current" in taglist:
						incl.version = tlxs.version
					else:
						incl.version = None
					incl.put()
					tlf.append(link)
				else:
					tlf.append(link + " ''not found''")

		tlr.text = '\n'.join(tlf)
	
	if tlr.version != -1:
		if tlr.text is None:
			tlr.text = ''
		tlr.public = page.anonAccess > page.NoAccess
		PutTiddler(tlr,page) # <-- This is where it gets put()
		for tl in TagLink.all().filter('tlr',tlr.id):
			if tl.tag not in taglist:
				tl.delete()
		addTagLinks(tlr,taglist)
				
		for cj in crons:
			cj.save(tlr)

	if page != None:
		page.Update(tlr)

	warning = ""
	if not autoSave:
		isShared = True if ('shadowTiddler' in taglist or 'sharedTiddler' in taglist) else False
		st = ShadowTiddler.all().filter('id',tlr.id).get()
		if st != None:
			if isShared:
				st.tiddler = tlr
				st.put()
			else:
				st.delete()
		
		if isShared and st == None and tlr.version > 0:
			s = ShadowTiddler(tiddler = tlr, path = tlr.page, id = tlr.id)
			s.put()
		if hasattr(tlr,'requires'):
			for rtn in tagStringToList(tlr.requires):
				logging.info("Requires also " + rtn)
				rqtok = False
				for shtx in ShadowTiddler.all().filter('path',self.request.path):
					if self.request.path.startswith(shtx.path) and shtx.tiddler.title == rtn:
						rqtok = True
				if not rqtok:
					warning = "The required tiddler '" + rtn + "'<br>must also be marked with the 'include as special tiddler' attribute<br>"

	if reply:
		xd = self.initXmlResponse()
		esr = xd.add(xd,'SaveResp')
		xd.appendChild(esr)
		if warning:
			we = xd.createElement('Message')
			we.appendChild(xd.createTextNode(warning))
			esr.appendChild(we)
		we = xd.createElement('when')
		we.setAttribute('type','datetime')
		we.appendChild(xd.createTextNode(tlr.modified.strftime("%Y%m%d%H%M%S")))
		ide = xd.createElement('id')
		ide.appendChild(xd.createTextNode(unicode(tlr.id)))
		aue = xd.createElement('modifier')
		aue.appendChild(xd.createTextNode(getAuthor(tlr)))
		vce = xd.createElement('vercnt')
		vce.appendChild(xd.createTextNode(unicode(tlr.vercnt)))
		if tiddlerName is None and not autoSave: # not provided
			tne = xd.createElement('title')
			tne.appendChild(xd.createTextNode(title))
			esr.appendChild(tne)
		if not autoSave:
			tte = xd.createElement('tags')
			tte.appendChild(xd.createTextNode(tlr.tags))
			esr.appendChild(tte)
			
		esr.appendChild(we)
		esr.appendChild(ide)
		esr.appendChild(aue)
		esr.appendChild(vce)
		fromVer = self.request.get('fromVer', None)
		if fromVer != None and not autoSave:
			esr.appendChild(getTiddlerVersions(xd,unicode(tlr.id),eval(fromVer),self.request.get('historyView',None)))
		if autoSave:
			if elr:
				lke = xd.createElement('key')
				lke.appendChild(xd.createTextNode(elr['key']))
				esr.appendChild(lke)
				lue = xd.createElement('until')
				lue.setAttribute('type','datetime')
				lue.appendChild(xd.createTextNode(elr['until'].strftime("%Y%m%d%H%M%S")))
				esr.appendChild(lue)
			if autoSavedAsVer:
				ase = xd.createElement('autoSavedAsVer')
				ase.appendChild(xd.createTextNode(str(autoSavedAsVer)))
				esr.appendChild(ase)
		else:
			vne = xd.createElement('currentVer')
			vne.appendChild(xd.createTextNode(unicode(tlr.version)))
			esr.appendChild(vne)
		
		self.response.out.write(xd.toxml())

  def dropTiddlerEdit(self):
	tlrId = self.request.get('tiddlerId')
	autoSavedAsVer = self.request.get('autoSavedAsVer',None)
	if tlrId and autoSavedAsVer:
		dtlr = Tiddler.all().filter('id',tlrId).filter('version',int(autoSavedAsVer)).get()
		if dtlr is None:
			return self.fail("Tiddler " + tlrId + " version " + autoSavedAsVer + " not found!")
		if dtlr.current:
			if autoSavedAsVer == "1":
				dtlr.delete()
				return self.reply()
			else:
				return self.fail("This is now the current version!")
		else:
			dtlr.delete()
			t = Tiddler.all().filter('id', tlrId).filter('current',True).get()
			if hasattr(t,'autosaved_by'):
				delattr(t,'autosaved_by')
				t.put()
			return self.tiddlerHistory()
	else:
		return self.fail("Missing argument")

  def changeTags(self):
	id = self.request.get('tiddlerId')
	version = self.request.get('version')
	tlr = Tiddler.all().filter('id', id).filter('current',True).get()
	if tlr == None:
		return self.fail("Tiddler not found")
	if tlr.version != int(version):
		return self.fail(tlr.title + " v# " + str(tlr.version) + " is the current version")
	tlr.tags = self.request.get('tags')
	tlr.put()
	self.reply()

  def addTags(self):
	id = self.request.get('id',None)
	if id == None:
		return self.fail("Missing arg 'id'")
	tlr = Tiddler.all().filter('id',id).filter('current',True).get()
	if tlr == None:
		return self.fail("Tiddler not found")
	if tlr.version != int(self.request.get('version')):
		return self.fail("Tiddler not current")
	taglist = self.request.get_all('atag')
	for atg in taglist:
		if not atg in tlr.tags:
			if ' ' in atg:
				atg = '[[' + atg + ']]'
			tlr.tags = tlr.tags + " " + atg
	PutTiddler(tlr)
	addTagLinks(tlr,taglist)
	return self.reply({'tags': tlr.tags})
	
  def listTiddlersTagged(self):
	list = []
	rply = {'tl': list}
	tag = self.request.get('tag',None)
	tags = self.request.get_all('tags')
	any = False
	if len(tags):
		rply['mt'] = True
		for tl in TagLink.all():
			any = True
			if tl.tag in tags:
				if tl.tlr != self.request.get('excl'):
					t = Tiddler.all().filter('id', tl.tlr).filter('current',True).get()
					if not t is None:
						pl = '[[' + t.title + ']]' if ' ' in t.title else t.title
						list.append({ 'tag': tl.tag, 'page': t.page, 'title': t.title, 'link': t.page + '#' + urllib.quote(pl) })
	elif tag:
		rply['mt'] = False
		for tl in TagLink.all().filter('tag',tag):
			any = True
			t = Tiddler.all().filter('id', tl.tlr).filter('current',True).get()
			if not t is None:
				pl = '[[' + t.title + ']]' if ' ' in t.title else t.title
				list.append({ 'page': t.page, 'title': t.title, 'link': t.page + '#' + urllib.quote(pl) })
	if any:
		return self.reply(rply)
	else:
		return self.warn("Tag index is empty; visit <a href='/build_tag_index'>/build_tag_index</a> to build it", rply)
	

  def searchText(self):
	text = self.request.get('text')
	limit = self.request.get('limit')
	offset = self.request.get('offset',None)
	path = self.request.get('path','/')
	date = self.request.get('date')
	snippets = self.request.get('snippets')
	csr = self.request.get('cursor',None)
	if offset is None:
		offset = 0
	else:
		offset = int(offset)

	cu = users.get_current_user()
	if cu is None:
		ug = '_publ'
	else:
		ug = '_publ OR _auth OR usr|' + cu.nickname()
		for amg in GroupMember.all().filter('name',cu.nickname()):
			if amg.group:
				ug = ug + " OR " + amg.group

	q = text + ("" if text == "" else " AND ") + "(uxl_:" + ug + ")"
	if path != '/':
		pap = path[0:path.rfind('/')+1]
		q = q + ' AND ' + 'page:"/ ' + pap.replace('/',' ').strip() + '"'
	else:
		pap = '/'

	logging.info("Search('" + str(q) + "'," + str(offset) + ", snippets:" + snippets + ", date:" + date + ")")
	try:
		srlimit = int(limit)
	except Exception,x:
		srlimit = 4
	# sort results by author descending
	expr_list = [search.SortExpression(
		expression='page', default_value='',
		direction=search.SortExpression.ASCENDING)]
	# construct the sort options 
	sort_opts = search.SortOptions(expressions=expr_list)
	return_list = ['page','title']
	if date:
		return_list.append('date')

	text_snippet = 'snippet("' + text + '", text)'
	# logging.info("Snippet: " + text_snippet)
	return_expressions = [] # search.FieldExpression(name='score',expression='_score')]
	if snippets and snippets != 'false':
		return_expressions.append( search.FieldExpression(name='text_snippet',expression=text_snippet) )

	query_options = search.QueryOptions( 
		sort_options=sort_opts, 
		limit=srlimit, 
		offset=offset,
		returned_expressions=return_expressions,
		returned_fields=return_list)
	try:
		query_obj = search.Query(query_string=q, options=query_options)
	except Exception,x:
		return self.fail("Query syntax error(" + q + "):<br>" + str(x))
	started = datetime.datetime.now()
	try:
		results = search.Index(name=_INDEX_NAME).search(query=query_obj)
	except ZeroDivisionError,zde: # workaround SDK bug:
		query_obj = search.Query(query_string=text, options=query_options)
		results = search.Index(name=_INDEX_NAME).search(query=query_obj)
	except apiproxy_errors.CallNotFoundError,cnfe:
		return self.fail("Site search is supported only for sites using the 'High Replication' data store");

	time = datetime.datetime.now() - started
	logging.info("Got " + str(len(results.results)))

	if users.get_current_user() != None:
		she = SearchHistory()
		she.what = text
		she.who = users.get_current_user()
		she.scope = path
		she.limit = srlimit
		she.found = results.number_found
		she.time = time.microseconds + (time.seconds * 1000000)
		she.put()

	rv = list()
	for sd in results.results:
		fv = dict()
		fv['id'] = sd.doc_id
		for f in sd.fields:
			fv[f.name] = f.value
		for e in sd.expressions:
			logging.info("RX " + e.name + '=' + e.value)
			fv[e.name] = e.value
		rv.append( fv )
	prevpage = 0
	if offset > srlimit:
		prevpage = offset - srlimit;
	rply = { 'query': text, 'path': pap, 'hits': results.number_found, 'limit': min(srlimit,results.number_found), 'offset': offset, 'prevpage': prevpage, 'result': rv } # 'cursor': results.cursor.web_safe_string, 
	return self.reply(rply)

  def searchHistory(self):
	offs = int(self.request.get('offs'))
	hist = ["|When|What|Where|Found|In (ms)|"]
	what = []
	wher = []
	first = 0
	last = offs + 10
	ended = False
	for she in SearchHistory.all().filter('who',users.get_current_user()).order('-when'):
		if she.what == '':
			continue;
		if first >= offs:
			hist.append("|" + str(she.when)[:16] + '||' + str(she.scope) + '|' + str(she.found) + '|' + str(int((she.time + 1) / 1000)) + '|')
			what.append(str(she.what))
			wher.append(str(she.scope))
		first = first + 1
		if first == last:
			ended = True
			break

	return self.reply( { 'history': '\n'.join(hist), 'whats': what, 'wheres': wher, 'ended': ended })

  def tiddlerHistory(self):
	"http tiddlerId"
	xd = self.initXmlResponse()
	eHist = xd.add(xd,'Hist')
	eHist.appendChild(getTiddlerVersions(xd,self.request.get('tiddlerId'), 0 if self.request.get("shadow") == '1' else 1,self.request.get('historyView',None)))
	self.response.out.write(xd.toxml())

  def tiddlerVersion(self):
	return self.ReplyWithTiddlerVersion(self.request.get('tiddlerId'),int(self.request.get("version")))
	
  def ReplyWithTiddlerVersion(self,id,version,hist=False):
	tls = Tiddler.all().filter('id', id).filter('version',version)
	self.initXmlResponse()
	xd = xml.dom.minidom.Document()
	tv = xd.createElement('TiddlerVersion')
	xd.appendChild(tv)
	found = 0
	for tlr in tls:
		te = xd.createElement('text')
		tv.appendChild(te)
		te.appendChild(xd.createTextNode(tlr.text))
		
		te = xd.createElement('title')
		tv.appendChild(te)
		te.appendChild(xd.createTextNode(tlr.title))

		te = xd.createElement('version')
		tv.appendChild(te)
		te.appendChild(xd.createTextNode(unicode(tlr.version)))
		te.setAttribute('type','int')

		te = xd.createElement('modified')
		tv.appendChild(te)
		te.appendChild(xd.createTextNode(tlr.modified.strftime("%Y%m%d%H%M%S")))
		te.setAttribute('type','datetime')

		te = xd.createElement('modifier')
		tv.appendChild(te)
		te.appendChild(xd.createTextNode(getAuthor(tlr)))

		te = xd.createElement('tags')
		tv.appendChild(te)
		xmlArrayOfStrings(xd,te,tlr.tags,'tag')
		## te.appendChild(xd.createTextNode(tlr.tags))

		found += 1
	if found != 1:
		err = xd.createElement('error')
		tv.appendChild(err)
		err.appendChild(xd.createTextNode(self.request.get('tiddlerId') + ': ' + self.request.get("version") + ' found ' + unicode(found)))
	if hist:
		tv.appendChild(getTiddlerVersions(xd,self.request.get('tiddlerId'), 0 if self.request.get("shadow") == '1' else 1, self.request.get('historyView',None)))
	self.response.out.write(xd.toxml())
	
  def tiddlerDiff(self):
	vn1 = int(self.request.get('vn1'))
	try:
		v1t = self.request.get('shadowText') if vn1 == 0 else Tiddler.all().filter('id', self.request.get('tid')).filter('version',vn1).get().text
	except Exception,x:
		raise Exception("Cannot get version " + unicode(vn1) + " of " + self.request.get('tid'))
	vn2 = self.request.get('vn2',None)
	if vn2 == None:
		v2t = self.request.get('text')
	else:
		vn2 = int(vn2)
		try:
			v2t = Tiddler.all().filter('id', self.request.get('tid')).filter('version',vn2).get().text
		except Exception,x:
			raise Exception("Cannot get version " + unicode(vn2) + " of " + self.request.get('tid'))
	ndiffg = difflib.ndiff(v1t.replace('\r\n','\n').splitlines(),v2t.replace('\r\n','\n').splitlines())
	ndiff = []
	for v in ndiffg:
		ndiff.append(v)
	pdiff = []
	adiff = []
	bdiff = []
	rdiff = []
	ix = 0
	for ix in range(0,len(ndiff)):
		v = ndiff[ix]
		if v.startswith('  '):
			subDiff(adiff,bdiff,rdiff)
			rdiff.append(v)
			adiff = []
			bdiff = []
		elif v.startswith('+ '):
			adiff.append(v)
		elif v.startswith('- '):
			bdiff.append(v)
		elif not v.startswith('? '):
			rdiff.append(v)
		ix += 1
	subDiff(adiff,bdiff,rdiff)
	
	idiff = []
	for dl in rdiff:
		if dl[1:2] == ' ':
			if len(idiff) > 0:
				# idiff.append('<br>')
				pdiff.append(''.join(idiff))
				idiff = []
		if dl[:2] == '  ':
			pdiff.append(html_escape(dl[2:]))
		elif dl[:2] == '+ ':
			pdiff.append('<span class="diffplus">' + html_escape(dl[2:]) + '</span>')
		elif dl[:2] == '- ':
			pdiff.append('<span class="diffminus">' + html_escape(dl[2:]) + '</span>')
		elif dl[:2] == ' .':
			idiff.append(html_escape(dl[2:] + ' '))
		elif dl[:2] == '+.':
			idiff.append('<span class="diffplus">' + html_escape(dl[2:]) + ' </span>')
		elif dl[:2] == '-.':
			idiff.append('<span class="diffminus">' + html_escape(dl[2:]) + ' </span>')
	pdiff.append(''.join(idiff))
	self.response.out.write('<br>'.join(pdiff))

  def revertTiddler(self):
	tid = self.request.get('tiddlerId')
	tls = Tiddler.all().filter('id', tid)
	version = eval(self.request.get('version'))
	tplv = None
	tpcv = None
	tpn = 0
	for t in tls:
		if t.version > tpn:
			tpn = t.version
		if t.current:
			tpcv = t.version
		elif t.version == version and t.current == False: # specific version
			tplv = version
		elif tplv != version and t.current == False: # find last prior version
			if tplv == None:
				tplv = t.version
			elif tplv != None and t.version > tplv and t.version < version:
				tplv = t.version
	if tplv == None:
		return self.fail("No prior version found")
	elif tpcv == None:
		return self.fail("Current not found")
	else:
		logging.info("revert " + tid + " v. " + unicode(tpcv) + " to " + unicode(tplv))
		tpl = self.revertFromVersion(tid,tpcv,tplv,version,tpn)
		k = self.request.get('key',None)
		if k != None:
			self.unlock(k)
		return self.ReplyWithTiddlerVersion(tpl.id,tpl.version,True)
		
  def revertFromVersion(self,tid,cv,lv,version,newestver):
	tpc = Tiddler.all().filter('id', tid).filter('version',cv).get()
	tpl = Tiddler.all().filter('id', tid).filter('version',lv).get()
	tpl.current = True
	addTL = False
	if users.is_current_user_admin() == False or version != cv:
		tpc.current = False
		if tpc.tags != tpl.tags:
			for tl in TagLink.all().filter('tlr',tpc.id):
				tl.delete()
			addTL = True
		if tpl.reverted != None:
			tpc.modified = tpl.reverted
			tpc.reverted = None
		PutTiddler(tpc)
	else:
		deleteTiddlerVersion(tid,cv)
		tpl.vercnt = tpl.versionCount() - 1
	# The current version maintains the version count:
	tpl.vercnt = Tiddler.all(keys_only=True).filter('id',tpl.id).count()
	if tpl.version == newestver:
		tpl.reverted = None
	else:
		tpl.reverted = tpl.modified
	tpl.reverted_by = users.get_current_user()
	tpl.modified = datetime.datetime.now()
	PutTiddler(tpl)
	if addTL:
		addTagLinks(tpl,tagStringToList(tpl.tags))
	return tpl

  def deleteVersions(self):
	tlrs = Tiddler.all().filter('id',self.request.get('tiddlerId'))
	cnt = 0
	for t in tlrs:
		if t.version < self.request.get('version') and (not t.current) and (t.author == users.get_current_user() or users.is_current_user_admin()):
			KillTiddlerVersion(t)
		else:
			cnt = cnt + 1
	logging.info("Now " + str(cnt) + " versions")
	tlc = Tiddler.all().filter('id', self.request.get('tiddlerId')).filter('current',True).get()
	if tlc != None:
		tlc.vercnt = cnt
		tlc.put()
	self.unlock(self.request.get('key'))
	self.reply({'vercnt': cnt }, versions = True)

  def deleteTiddler(self):
	self.initXmlResponse()
	tid = self.request.get('tiddlerId')
	usr = users.get_current_user()
	if usr == None:
		return self.fail("Only authenticated users can delete a tiddler!")
	
	if self.request.get('comment') == "":
		return self.fail("A reason for deletion must be given!")

	page = self.CurrentPage()
	if page == None:
		return self.fail("Oops: page not found!")

	access = AccessToPage(page,self.user)
	if not access in ['admin', 'all']:
		if not (access in ['edit','add'] and IsSoleOwner(tid,self.user)):
			return self.fail("You are not allowed to do this")

	if tid.startswith('include-'):
		urlparts = tid[8:].split('#',1)
		url = urlparts[0] + '#'
		part = urlparts[1]
		siLines = page.systemInclude.split('\n')
		for ali in siLines:
			if ali.startswith(url):
				sl = ali[len(url):].split('||')
				sl.remove(part)
				url = url + '||'.join(sl)
				siLines.remove(ali)
				siLines.append(url)
				page.systemInclude = '\n'.join(siLines)
				page.put()
				return self.warn("tiddler excluded")
		self.reply()
	for st in ShadowTiddler.all().filter('id',tid):
		st.delete()
	ctlr = Tiddler.all().filter('id', tid).filter('current',True).get()
	if ctlr != None:
		ctlr.current = False
		for tl in TagLink.all().filter('tlr',ctlr.id):
			tl.delete()
		# setattr(ctlr,'isRecycled',True)
		DeletionLog().Log(ctlr,self.request.remote_addr,self.request.get('comment'))
		PutTiddler(ctlr)
		self.reply()
	else:
		return self.fail("Oops: That tiddler doesn't exist!")

  def recycleBin(self):
	get = self.request.get('get')
	if get != '':
		tlr = Tiddler.get(get)
		if tlr is None:
			return self.fail("Key not found", get)
		else:
			return self.deliverTiddler(tlr,True)
	if self.request.get('list') != '':
		da = []
		for t in DeletionLog.all():
			if t.page.startswith(self.request.path):
				try:
					da.append({'title': t.tiddler.title, 'page': t.page, 'key': t.tiddler.key(), 'by': t.deletedByUser, 'at': t.deletedAt, 'comment': t.deletionComment })
				except Exception, x:
					logging.warn("DeletionLog/list() error: " + str(x))
		return self.reply({ 'tiddlers': da })
	rescue = self.request.get('rescue')
	if rescue:
		ctlr = Tiddler.get(rescue)
		if ctlr is None:
			return self.fail("Tiddler not found: " + ctlr)
		if ctlr.current:
			return self.fail("Already restored")
		ctlr.current = True
		# delattr(ctlr,'isRecycled')
		PutTiddler(ctlr)
		for dle in DeletionLog.all():
			if str(dle.tiddler.key()) == rescue:
				dle.delete()
				break
		return self.reply()
	if self.request.get('empty') and users.is_current_user_admin():
		for dle in DeletionLog.all():
			try:
				id = dle.tiddler.id
				for dte in Tiddler.all().filter('id',id):
					KillTiddlerVersion(dte)
			except Exception, x:
				logging.warn("DeletionLog/empty() error: " + str(x))
			dle.delete()
		return self.reply()
	self.fail("Invalid args")

  def add(self):
	self.reply({'success': True, "result": int(self.request.get("a")) + int(self.request.get("b"))})

  def emailSubTemplate(self,comment,tls,txt):
	return txt.replace('<tiddler_name>',tls.title)\
		.replace('<tiddler_url>',self.request.url + '#' + urllib.quote(tls.title))\
		.replace('<message_text>',comment)
	
  def SendEmailNotification(self,comment,tls):
	if comment.receiver == None or users.get_current_user() == None:
		return False
	ru = UserProfile.all().filter('user', comment.receiver).get()
	if ru != None and hasattr(ru,'txtEmail'):
		rma = ru.txtEmail
	else:
		rma = comment.receiver.email()
	if mail.is_email_valid(rma):
		mail.send_mail(sender=users.get_current_user().email(),
				to = rma,
				subject = self.emailSubTemplate(comment.text,tls,"Re: <tiddler_name>"),
				body = self.emailSubTemplate(comment.text,tls,"<message_text>\n<tiddler_url>"))
		return True
	else:
		return False

  def submitComment(self):
	tls = Tiddler.all().filter('id', self.request.get("tiddler")).filter('current',True).get()
	if tls == None:
		return self.reply({'success': False, "Message": "No such tiddler!"})
	t = self.request.get("type")
	if t == "N":
		ani = Note()
	elif t == "M":
		ani = Message()
		receiver = self.request.get("receiver")
		pn = PenName.all().filter('penname',receiver).get()
		ani.receiver = pn.user.user if pn != None else users.User(receiver)
	else:
		ani = Comment()
	ani.tiddler = self.request.get("tiddler")
	ani.version = int(self.request.get("version"))
	ani.text = self.request.get("text")
	ani.author = users.get_current_user()
	ani.ref = self.request.get("ref")
	ani.save()
	ms = False
	if t == "C" and ani.ref == "":
		tls.comments = tls.comments + 1
	elif t == "M":
		ms = self.SendEmailNotification(ani,tls)
		if tls.messages == None:
			tls.messages = '|'
		tls.messages = tls.messages + ani.receiver.nickname() + '|'
	elif t == "N":
		au = self.request.remote_addr if ani.author is None else ani.author.nickname()
		tls.notes = tls.notes + '|' + au if tls.notes != None else au
		
	tls.save()
	self.reply({'success': True, 
		'id': ani.key().id(), 'Comments': tls.comments, 'author': users.get_current_user(), 'text': ani.text,'created': str(ani.created), 'mail': ms })

  def deleteComment(self):
	try:
		dc = Comment.get_by_id(int(self.request.get('comment')))
		page = self.CurrentPage()
		if dc.author != users.get_current_user():
			if page != None and page.owner == users.get_current_user():
				pass
			elif users.get_current_user() != None and users.is_current_user_admin():
				pass
			else:
				return self.fail("You are not privileged to do so")
		t = Tiddler.all().filter('id',dc.tiddler).filter('version',dc.version).get()
		if t != None:
			t.comments = t.comments - 1
			t.put()
		dc.delete()
		self.sendXmlResponse(self.getCommentList())
		# self.reply()
	except Exception,x:
		self.fail("No such comment: " + self.request.get('id') + " (" + str(x) + ")")

  def alterComment(self):
	try:
		dc = Comment.get_by_id(int(self.request.get('comment')))
		page = self.CurrentPage()
		if dc.author != users.get_current_user():
			if page != None and page.owner == users.get_current_user():
				pass
			elif users.get_current_user() != None and users.is_current_user_admin():
				pass
			else:
				return self.fail("You are not privileged to do so")
		dc.text = self.request.get('text')
		dc.put()
		self.sendXmlResponse(self.getCommentList())
		# self.reply()
	except Exception,x:
		self.fail("No such comment: " + self.request.get('id') + " (" + str(x) + ")")

  def getComments(self):
	self.sendXmlResponse(self.getCommentList())

  def getCommentList(self):
	cs = Comment.all().filter('tiddler',self.request.get('tiddlerId'))
	ref = self.request.get('ref')
	if ref != '':
		cs = cs.filter('ref', ref)
	xd = XmlDocument()
	tce = xd.add(xd,'TiddlerComments', attrs={'type':'object[]'})
	for ac in cs:
		ace = xd.add(tce,'Comment')
		xd.add(ace, 'author','anonymous' if ac.author == None else getUserPenName(ac.author))
		xd.add(ace, 'text',ac.text)
		xd.add(ace, 'created', ac.created)
		xd.add(ace, 'version', ac.version)
		xd.add(ace, 'id', ac.key().id())
		if ref == '':
			xd.add(ace, 'ref', ac.ref)
	return xd

  def getNotes(self):
	tid = self.request.get('tiddlerId')
	if tid != '':
		ns = Note.all().filter('tiddler',tid).filter('author',users.get_current_user())
	elif users.get_current_user() != None:
		ns = Note.all().filter('author',users.get_current_user())
	else:
		return self.fail("Not logged in")

	xd = XmlDocument()
	tce = xd.add(xd,'TiddlerNotes', attrs={'type':'object[]'})
	for ac in ns:
		ace = xd.add(tce,'Note')
		xd.add(ace, 'text',ac.text)
		cde = xd.add(ace, 'created', ac.created)
		if tid == '':
			cde.setAttribute('type','datetime')
			tlr = Tiddler.all().filter('id',ac.tiddler).filter('current',True).get()
			if tlr != None:
				xd.add(ace,'page',tlr.page)
				xd.add(ace,'tiddler',tlr.title)
		xd.add(ace, 'version', ac.version)
	self.sendXmlResponse(xd)
	
  def getMessages(self):
	ms = Message.all().filter('tiddler',self.request.get('tiddlerId')).filter('receiver', users.get_current_user())
	xd = XmlDocument()
	tce = xd.add(xd,'TiddlerMessages', attrs={'type':'object[]'})
	for ac in ms:
		ace = xd.add(tce,'Note')
		xd.add(ace, 'author','anonymous' if ac.author == None else ac.author.nickname())
		xd.add(ace, 'text',ac.text)
		xd.add(ace, 'created', ac.created)
		xd.add(ace, 'version', ac.version)
	self.sendXmlResponse(xd)

  def getMacro(self):
	try:
		ftwm = open(path.normcase( self.request.get('macro') + '.js'))
		self.reply({'text': ftwm.read()})
		ftwm.close()
	except Exception,x:
		self.fail(unicode(x))

  def pageProperties(self):
	user = users.get_current_user()
	page = self.CurrentPage()
	if user == None:
		return self.fail("You are not logged in", { 'template': templateAttribute(page,"normal",'title') })
	if page == None:
		if self.path == '/' and user != None: # Root page
			page = Page()
			page.gwversion = giewikiVersion
			page.path = '/'
			page.title = ''
			page.subtitle = ''
			page.tags = ''
			page.locked = False
			page.anonAccess = 0
			page.authAccess = 0
			page.groupAccess = 2
			page.owner = user
			page.ownername = getUserPenName(user)
			page.groups = ''
			page.viewbutton = False
			page.viewprior = False
			page.foldIndex = False
			page.showByline = True
		else:
			return self.fail("Page does not exist")
	try:
		refTemplate = page.template
	except:
		refTemplate = None
	if self.request.get('title') != '': # Put
		if user != page.owner and users.is_current_user_admin() == False:
			self.fail("You cannot change the properties of this pages")
		else:
			saveTemplate = False
			
			page.title = self.request.get('title')
			page.subtitle = self.request.get('subtitle')
			if 'template' in self.request.get('tags').split() and (page.tags == None or (not 'template' in page.tags.split())):
				saveTemplate = True
			page.tags = self.request.get('tags')
			page.tiddlertags = self.request.get('tiddlertags')
			tttags = AttrValueOrBlank(refTemplate,'tiddlertags')
			if page.tiddlertags == tttags:
				page.tiddlertags = ''
			page.locked = self.request.get('locked') == 'true'
			page.anonAccess = Page.access[self.request.get('anonymous')]
			page.authAccess = Page.access[self.request.get('authenticated')]
			page.groupAccess = Page.access[self.request.get('group')]
			page.groups = self.request.get('groups')
			page.scripts = self.request.get('scripts')
			page.viewbutton = True if self.request.get('viewbutton') == 'true' else False
			page.viewprior = self.request.get('viewprior') == 'true'
			page.foldIndex = self.request.get('foldindex', 'false') == 'true'
			page.showByline = self.request.get('showbyline','true') == 'true'
			reqTemplate = self.request.get('template')
			if reqTemplate != '' and reqTemplate != "normal":
				pt = PageTemplate.all().filter('title',reqTemplate).filter('current',True).get()
				if pt == None:
					pt = AutoGenerateTemplate(reqTemplate)
				if pt == None:
					return self.fail("No such template: " + self.request.get('template'))
				else:
					page.template = pt
					if hasattr(page,'scripts') and page.scripts != None:
						ppts = page.scripts.split('|')
					else:
						ppts = []
					if hasattr(pt,'scripts') and pt.scripts != None:
						for ats in pt.scripts.split('|'):
							if len(ats) and not ats in ppts:
								ppts.append(ats)
					page.scripts = '|'.join(ppts)
			else:
				page.template = None
			for ra in self.request.arguments():
				if not ra in reserved_page_attrs:
					setattr(page,ra,self.request.get(ra))
			page.put()
			if saveTemplate:
				self.saveTemplate(page)
			self.reply({'success': True })
	else: # Get
		tiddlertags = page.tiddlertags if hasattr(page,'tiddlertags') else ''
		if tiddlertags == '' and refTemplate != None:
			tiddlertags = AttrValueOrBlank(refTemplate,'tiddlertags')
		isOwner = page.owner == self.user
		reply = {
			'title': page.title,
			'subtitle': page.subtitle,
			'tags': page.tags,
			'tiddlertags': tiddlertags,
			'owner':  self.user.nickname() if isOwner else page.owner if hasattr(page,'ownername') == False or page.ownername is None else page.ownername,
			'updateaccess': isOwner or users.is_current_user_admin(),
			'locked': page.locked,
			'anonymous': Page.access[page.anonAccess],
			'authenticated': Page.access[page.authAccess],
			'group': Page.access[page.groupAccess],
			'groups': page.groups,
			'template': 'normal' if refTemplate == None else refTemplate.title,
			'template_info': {} if refTemplate == None else { 'page': refTemplate.page, 'title': refTemplate.title, 'current': refTemplate.current },
			'scripts': page.scripts if hasattr(page,'scripts') else '',
			'viewbutton': NoneIsFalse(page.viewbutton) if hasattr(page,'viewbutton') else False,
			'viewprior': NoneIsFalse(page.viewprior) if hasattr(page,'viewprior') else False,
			'foldindex': NoneIsFalse(page.foldIndex) if hasattr(page,'foldIndex') else False,
			'showbyline': NoneIsTrue(page.showByline) if hasattr(page,'showByline') else True,
			'systeminclude': '' if page.systemInclude == None else page.systemInclude }
		if self.path == '/_templates/normal':
			reply['message'] = "The 'normal' template is empty"
		elif self.path.startswith('/_templates/'):
			reply['message'] = "NB: In use, template content is normally found only under the 'fromTemplate' tag.<br>Except if you apply the page tag 'include'."
		for dpn in page.dynamic_properties():
			if not dpn in reserved_page_attrs:
				reply[dpn] = unicode(getattr(page,dpn))
		self.reply(reply)

  def clipboard(self):
	cu = users.get_current_user()
	if cu == None:
		return self.fail('Not logged in')
	act = self.request.get('action')
	page = self.CurrentPage()
	if act == u'copy' or act == u'cut':
		reply = { 'act': act, 'success': True }
		if self.subdomain != None:
			namespace_manager.set_namespace(None)
		u = UserProfile.all().filter('user', cu).get()
		if u == None:
			u = UserProfile(user = cu, txtUserName = cu.nickname()) # new record
			u.put()
			
		if self.subdomain != None:
			namespace_manager.set_namespace(self.subdomain)

		if not ReadAccessToPage(page,self.user):
			return self.fail("No access")
		tlrid = self.request.get('tiddler')
		at = Tiddler.all().filter('id',tlrid).filter('current',True).get()
		if at == None:
			return self.fail("No such tiddler")
		if act == u'cut' and at.locked:
			return self.fail("Tiddlers is locked")
		try:
			prct = u.clipTiddler
			if not prct is None and prct.current == False:
				# setattr(prct,'isRecycled',True)
				DeletionLog().Log(prct,self.request.remote_addr,"Dropped from clipboard")
				reply['Message'] = "Tiddler '" + prct.title + "' dropped from the clipboard <br>into the recycle bin!"
				prct.put()
		except Exception, uhx:
			pass
		setattr(u,'clipTiddler',at)
		setattr(u,'clipDomain',self.subdomain)
		setattr(u,'clipAction',act)
		setattr(at,'clipOwner',cu)

		reply['action'] = "copied"
		u.put()
		if act == 'cut':
			access = AccessToPage(page,self.user)
			if not access in ['admin', 'all']:
				pass ## return self.fail("Tiddler was copied (not cut)")
				act = 'copy'
			else:
				at.current = False
				at.put()
				reply['action'] = "moved"
				elck = EditLock.all().filter('id',at.id).get()
				if not elck is None:
					elck.delete()
		self.reply(reply)
	elif act == u'paste':
		if self.subdomain != None:
			namespace_manager.set_namespace(None) # the user profile is shared between (sub-)domains.
		u = UserProfile.all().filter('user', cu).get()
		if u == None:
			return self.fail("No user profile found")
		if hasattr(u,'clipTiddler'):
			ct = getattr(u,'clipTiddler')
			if ct == None:
				return self.fail("Clipboard is empty")
			cd = getattr(u,'clipDomain')
			message = None
			newtitle = ct.title
			while True:
				cxt = Tiddler.all().filter('page', self.path).filter('title',newtitle).filter('current', True).get()
				if not cxt is None:
					if message == None:
						message = "Original title was '" + ct.title + "'"
					newtitle = '_' + newtitle;
				else:
					break
			if cd != self.subdomain: # we need to copy/move it
				logging.info("Moving between domain: " + str(cd) + " -> " + str(self.subdomain))
				namespace_manager.set_namespace(self.subdomain)
				cpt = Tiddler()
				# clone tiddler
				for fn,atr in ct.__dict__['_entity'].iteritems():
					setattr(cpt,fn,atr)
				cpt.id = unicode(uuid.uuid4())
				cpt.page = self.path
				cpt.vercnt = 1
				cpt.current = True
				cpt.put()
				logging.info("Created clone as key=" + str(cpt.key()))
				if getattr(u,'clipAction') == 'cut':
					namespace_manager.set_namespace(cd)
					# setattr(cpt,'isRecycled',True)
					DeletionLog().Log(ct,self.request.remote_addr,"Moved to " + ("top domain" if self.subdomain is None else "subdomain " + self.subdomain))
					namespace_manager.set_namespace(self.subdomain)
				if message:
					setattr(cpt,'Message', message)
				return self.deliverTiddler(cpt)
			else:
				namespace_manager.set_namespace(self.subdomain)
				if ct.current: # (not cut / already pasted)
					cpt = Tiddler()
					for fn,atr in ct.__dict__['_entity'].iteritems():
						# clone tiddler
						if fn == 'id':
							cpt.id = unicode(uuid.uuid4())
						elif fn == 'title':
							cpt.title = newtitle
						elif fn == 'vercnt':
							cpt.vercnt = 1
						elif fn == 'page':
							cpt.page = self.path
						else:
							setattr(cpt,fn,atr)
					cpt.put()
					if message:
						setattr(cpt,'Message', message)
					return self.deliverTiddler(cpt)
				else:
					ct.page = self.path
					ct.current = True
					ct.title = newtitle
					ct.put()
					for t in Tiddler.all().filter('id',ct.id):
						t.page = self.path
						t.put()
					if message:
						setattr(ct,'Message', message)
					return self.deliverTiddler(ct)
		self.reply()
	else:
		self.fail("invalid action: '" + act + "'")

  def saveTemplate(self,page,update=False,tags=''):
	pt = PageTemplate.all().filter('title',page.title).filter('current',True).get()
	newVersion = 'version' in page.tags.split() or 'version' in tags.split()
	if pt == None or newVersion:
		ptn = PageTemplate()
		ptn.version = 1
		ptn.current = True
		ptn.scripts = page.scripts
		update = True
	else:
		ptn = None
	if pt != None and ptn != None:
		pt.current = False
		pt.put()
		ptn.version = pt.version + 1
	if ptn != None:
		pt = ptn
	if update:
		pt.text = self.getText(page)
	pt.title = page.title
	pt.page = page.path
	pt.tiddlertags = page.tiddlertags
	pt.include = 'include' in page.tags
	pt.put()

  def updateTemplate(self):
	self.saveTemplate(self.CurrentPage(),True, self.request.get('tags'))
	self.reply({'success': True })

  def getTemplates(self):
	this_template = self.request.get('template')
	if len(this_template) > 0:
		dt = [ this_template ]
	else:
		dt = [ 'dummy', 'normal' ]
		for at in library().static():
			dt.append( at[:-4]) # 4 = len('.xml')
		for at in PageTemplate.all().filter('current',True):
			if not at.title in dt:
				dt.append(at.title)
	self.reply({'success': True, 'templates': dt})

  def getNewAddress(self):
	path = self.path
	lsp = path.rfind('/')
	parent = path[0:1+lsp]
	title = self.request.get('title')
	prex = Page.all().filter('path',parent).filter('title', title).get()
	if prex != None:
		self.fail("Page already exists")
	npt = title.replace(' ','_').replace('/','-')
	prex = Page.all().filter('path',parent + '/' + npt).get()
	if prex != None:
		self.fail("Page already exists")
	self.reply({'success': True, 'Address': npt })
	
  def siteMap(self):
	pal = Page.all().order('path')
	xd = XmlDocument()
	xroot = xd.add(xd,'SiteMap', attrs={'type':'object[]'})
	for p in pal:
		if (p.tags == None or 'hidden' not in p.tags.split()) and not hasattr(p,'redirect'):
			xpage = xd.createElement('page')
			xroot.appendChild(xpage)
			xd.add(xpage,'path',p.path)
			xd.add(xpage,'title',p.title)
			if p.tags != None:
				xd.add(xpage,'tags',p.tags)
	cu = users.get_current_user()
	if not cu is None:
		namespace_manager.set_namespace(None)
		u = UserProfile.all().filter('user', cu).get()
		if not u is None:
			prjs = u.Projects(self.subdomain).split(' ')
			for p in prjs:
				if len(p) > 0:
					xpage = xd.createElement('project')
					xroot.appendChild(xpage)
					host = '.'.join(self.request.host.split('.')[-3:])
					if host in p:
						host = p
					else:
						host = p + '.' + host
					xd.add(xpage,'prefix','http://' + host )
					xd.add(xpage,'title',p)

	self.sendXmlResponse(xd)

  def createPage(self):
	user = users.get_current_user()
	path = self.path
	lsp = path.rfind("/")
	parent = path[0:1+lsp]
	pad = Page.all().filter("path =",parent).get()
	if pad == None: # parent folder doesn't exist
		if self.request.get("title") == "":
			if parent == "/" and user != None:
				pad = Page()
				pad.gwversion = giewikiVersion
				pad.path = "/"
				pad.tags = ''
				pad.owner = user
				pad.ownername = getUserPenName(user)
				pad.locked = False
				pad.anonAccess = Page.access[self.request.get("anonymous")]
				pad.authAccess = Page.access[self.request.get("authenticated")]
				pad.groupAccess = Page.access[self.request.get("group")]
				pad.viewbutton = True
				pad.viewprior = True
				pad.foldIndex = False
				pad.showByline = True
				pad.put()
				return self.reply( { 'success': True })
			else:
				return self.fail("Root folder not created")
		else:
			return self.fail("Parent folder doesn't exist")
	if user == None and pad.anonAccess != "":
		return self.fail("You cannot create new pages")

	if self.request.get('defaults') == 'get':
		return self.reply({
			'anonymous': Page.access[pad.anonAccess], 
			'authenticated': Page.access[pad.authAccess],
			'group': Page.access[pad.groupAccess],
			'updateaccess': True })

	url = parent + self.request.get('address').strip()
	if self.request.path[-1] == '/' and url.find(self.request.path) != 0:
		return self.fail("Address is not below path")
	rurl = url[len(self.request.path):]
	if rurl == '/':
		return self.fail("Invalid address: " + rurl)
	if rurl.find('/',0,-1) >= 0:
		return self.fail("A / is allowed only to end the address")
		
	page = Page.all().filter('path',url).get()
	if page == None:
		page = Page()
		page.gwversion = giewikiVersion
		page.path = url
		page.tags = ''
		page.owner = user
		page.ownername = getUserPenName(user)
		page.title = self.request.get('title')
		page.subtitle = self.request.get('subtitle')
		page.locked = False
		page.anonAccess = Page.access[self.request.get('anonymous')]
		page.authAccess = Page.access[self.request.get('authenticated')]
		page.groupAccess = Page.access[self.request.get('group')]
		reqTemplate = self.request.get('template')
		if reqTemplate != '':
			for at in PageTemplate.all().filter('current',True):
				if at.title == reqTemplate:
					page.template = at
			if page.template == None:
				page.template = AutoGenerateTemplate(reqTemplate)

		page.viewbutton = hasattr(page,'viewbutton') and page.viewbutton
		page.viewprior = hasattr(page,'viewprior') and page.viewprior
		page.showByline = (not hasattr(page,'showByline')) or page.showByline
		page.foldIndex = hasattr(page,'foldIndex') and page.foldIndex

		page.put()
		memcache.set(page.path,page,1)
		self.reply( {'Url': url, 'success': True })
	else:
		self.fail("Page already exists: " + page.path)
		
  def moveThisPage(self):
	newpath = self.request.get('address').strip()
	redirect = self.request.get('redirect') == 'true'
	if newpath == '':
		return self.fail("No address indicated");
	else:
		# TODO: improve validation
		if newpath[0] != '/':
			newpath = '/' + newpath
		if newpath == self.path:
			return self.fail("Same as current address; not moved")
		page = Page.all().filter('path',newpath).get()
		if page == None:
			page = Page.all().filter('path',self.path).get()
			if not page is None:
				for t in Tiddler.all().filter('page',self.path):
					t.page = newpath
					t.put()
				if redirect:
					np = Page()
					for an in (Page.properties().keys() + page.dynamic_properties()):
						av = getattr(page,an)
						setattr(np,an,av)
					np.path = newpath
					np.put()
					setattr(page,'redirect',newpath)
					page.put()
				else:
					page.path = newpath
					page.put()
				self.reply({'Url': newpath, 'success': True })
			else:
				return self.fail("Not found: " + self.path);
		else:
			return self.fail("Page already exist: " + newpath);
	
  def getLoginUrl(self):
	p = self.request.get("path")
	while len(p) > 300:
		ei = len(p)
		lsi = p.rfind('%20',0,ei) # last tiddler separator
		lpi = p.rfind('%5D%5D',0,ei)
		if lpi > lsi:
			lsi = p.rfind('%5B%5B',0,lpi)
		if lsi > 0:
			p = p[0:lsi]
			
	if users.get_current_user() is None:
		self.reply( {'Url': users.create_login_url(p), 'success': True })
	else:
		self.reply( {'Url': users.create_logout_url(p), 'success': True })

  def deletePage(self):
	path = self.path
	prex = Page.all().filter('path',path)
	tls = Tiddler.all().filter('page',path)
	for result in tls:
		KillTiddlerVersion(result)
	for result in prex:
		result.delete()
	self.reply({'success': True})
	
  def getUserName(self):
	self.initXmlResponse()
	xd = xml.dom.minidom.Document()
	tv = xd.createElement('UserName')
	u = users.get_current_user()
	if (u):
		tv.appendChild(xd.createTextNode(u.nickname()))
	xd.appendChild(tv)
	self.response.out.write(xd.toxml())

  def fail(self, msg = None, aux = None):
	if aux == None:
		aux = {}
	if msg != None:
		aux["Message"] = msg
	aux['success'] = False
	self.reply(aux)
	return False

  def warn(self, msg, aux = None):
	if aux == None:
		aux = {}
	aux["Message"] = msg
	aux['success'] = True
	self.reply(aux)
	return True

  def objectToXml(self,xd,pe,values):
	for k, v in values.iteritems():
		av = xd.createElement(k)
		pe.appendChild(av)
		if type(v) == bool:
			av.setAttribute("type","bool")
			v = "true" if v else "false"
		elif type(v) == datetime.datetime:
			av.setAttribute('type','datetime')
			v = v.strftime("%Y%m%d%H%M%S")
		elif type(v) == list:
			if len(v) == 0:
				av.setAttribute('type', '[]')
				v = None
			elif type(v[0]) in [ str, unicode ]:
				av.setAttribute('type', 'string[]')
				for an in v:
					sael = xd.createElement('string')
					sael.appendChild(xd.createTextNode(unicode(an)))
					av.appendChild(sael)
				v = None
			elif type(v[0]) == dict:
				av.setAttribute('type','object[]')
				for an in v:
					dil = xd.createElement('object')
					av.appendChild(dil)
					self.objectToXml(xd,dil,an)
				v = None
		elif type(v) == dict:
			av.setAttribute('type', 'object')
			self.objectToXml(xd,av,v)
			v = None
		if v != None:
			av.appendChild(xd.createTextNode(unicode(v)))

  def reply(self, values = { 'success': True }, de = 'reply', versions = False):
	self.initXmlResponse()
	xd = xml.dom.minidom.Document()
	tr = xd.createElement(de)
	xd.appendChild(tr)
	self.objectToXml(xd,tr,values)
	if versions:
		tr.appendChild(getTiddlerVersions(xd,self.request.get('tiddlerId'), 0 if self.request.get("shadow") == '1' else 1))
	self.response.out.write(xd.toxml())
	return True
	
  def LoginDone(self,path):
	page = Page.all().filter("path =",path).get()
	# LogEvent('Login', userWho() + path)
	grpaccess = "false"
	if page != None:
		if HasGroupAccess(page.groups,userWho()):
			grpaccess = "true"
			
	self.response.out.write(
'<html>'
'<header><title>Login succeeded</title>'
'<script>'
'function main() { \n'
'    act = "onLogin()";'
'    window.parent.setTimeout(act,100);\n'
'}\n'
'</script></header>'
'<body onload="main()">'
'<a href="/">success</a>'
'</body>'
'</html>') #,\'' + self.request.get("path") + '\'

  def getTiddlers(self):
	self.initXmlResponse()
	xd = XmlDocument()
	tr = xd.add(xd,"reply")
	pg = self.request.get("page")
	page = Page.all().filter('path',pg).get()
	error = None
	if page != None:
		who = userWho()
		own = False
		if who == '':
			if page.anonAccess < page.ViewAccess:
				error = "You need to log in to access this page"
		elif page.owner.nickname() != who:
			if page.authAccess < page.ViewAccess:
				if page.groupAccess < page.ViewAccess or HasGroupAccess(page.groups,who) == False:
					error = "You do not have access to this page"
		else:
			own = True
	if error == None:
		tiddlers = Tiddler.all().filter('page', pg).filter('current', True)
		if tiddlers.count() > 0:
			want_deprecated = self.request.get('deprecated',None)
			tr.setAttribute('type', 'string[]')
			for t in tiddlers:
				if want_deprecated == None:
					if hasattr(t,'deprecated'):
						continue
				elif want_deprecated == 'only':
					if not hasattr(t,'deprecated'):
						continue

				if own or not hasattr(t,'private'):
					xd.add(tr,"tiddler",unicode(t.title))
		else:
			error = "Page '" + pg + "' is empty"
		
	if error != None:
		xd.add(tr,"error",error)
	return self.response.out.write(xd.toxml())

  def getTiddler(self):
	id = self.request.get("id",None)
	if id != None:
		urlParts = id.split('#',1)
		if len(urlParts) == 2:
			urlPath = urlParts[0]
			urlPick = urlParts[1]
			self.warnings = []
			ts = self.tiddlersFromSources(urlPath)
			if ts != None:
				for at in ts:
					if at.title == urlPick:
						return self.reply( {
							'title': at.title,
							'id': 'include-' + id,
							'text': at.text,
							'modifier': at.author_ip,
							'tags': at.tags })
			self.fail('\n'.join(self.warnings))
		else:
			self.fail("id should be like path#tiddlerTitle")

	title = self.request.get("title")
	if title == "":
		url = self.request.get("url").split("#",1)
		if len(url) < 2:
			return LogEvent("getTiddler:", self.request.get("url"))
		title = url[1]
		page = url[0]
	else:
		self.Trace(title)
		page = self.path
		
	t = Tiddler.all().filter('page', page).filter('title',title).filter('current', True).get()
	if t is None:
		try:
			astd = {}
			dtf = None
			for st in ShadowTiddler.all():
				if page == st.path or (page.startswith(st.path) and not st.tiddler.title in astd.keys()):
					astd[st.tiddler.title] = st.tiddler
				if page.startswith(st.path) and st.tiddler.title == title:
					if hasattr(st.tiddler,'requires'):
						dtf = st.tiddler
					else:
						return self.deliverTiddler(st.tiddler)
			if dtf:
				ts = [presentTiddler(dtf)]
				for rtn in tagStringToList(dtf.requires):
					if rtn in astd.keys():
						ts.append(presentTiddler(astd[rtn]))
				return self.reply({'tiddlers': ts})
			xmlfn = title + '.xml'
			logging.info('parse ' + xmlfn)
			try:
				xdt = xml.dom.minidom.parse(xmlfn)
			except IOError,iox:
				xdt = xml.dom.minidom.parse(xmlfn.replace(' ','_'))
			de = xdt.documentElement
			if de.tagName == 'tiddler':
				t = TiddlerFromXml(de,self.path)
				if t is None:
					return self.fail(title + " not found")
				t.public = True
			elif de.tagName == 'tiddlers': # Allow piggybacking other tiddlers on which it depends
				ts = []
				for ce in de.childNodes:
					if ce.nodeType == xml.dom.Node.ELEMENT_NODE:
						ts.append(presentTiddler(TiddlerFromXml(ce,self.path),False))
				return self.reply({'tiddlers': ts})
			else:
				return self.fail()
		except Exception, x:
			logging.info("No such ? (" + str(x) + ")")
			cp = self.CurrentPage()
			if not cp is None:
				nctl = cp.NoSuchTiddlersOfPage()
				if not title in nctl:
					nctl.append(title)
					cp.noSuchTiddlers = '\n'.join(nctl)
					cp.put()

			return self.fail()
	else:
		if hasattr(t,'private') and t.private: # Check if page owner is asking for it
			cp = self.CurrentPage()
			if cp != None and cp.owner != None and cp.owner != self.user:
				return self.fail() # No access allowed

	self.deliverTiddler(t)

  def deliverTiddler(self,t,withKey=False):
	if t.public or ReadAccessToPage(t.page):
		self.reply(presentTiddler(t,withKey))
		return True
	else:
		self.reply({'success': False, "Message": "No access" })
		return False

  def getGroups(self):
	groups = Group.all().filter("admin =", users.get_current_user())
	self.initXmlResponse()
	xd = xml.dom.minidom.Document()
	tr = xd.createElement("groups")
	tr.setAttribute('type', 'string[]')
	for g in groups:
		av = xd.createElement("group")
		tr.appendChild(av)
		av.appendChild(xd.createTextNode(unicode(g.name)))
	xd.appendChild(tr)
	self.response.out.write(xd.toxml())

  def getRecentChanges(self):
	xd = self.initXmlResponse()
	re = xd.add(xd,'result')
	ta = xd.add(re,'changes',attrs={'type':'object[]'})
	offset = eval(self.request.get('offset'))
	limit = eval(self.request.get('limit'))
	while True:
		extra = 0
		ts = Tiddler.all().order('-modified').fetch(limit,offset)
		cnt = 0
		for t in ts:
			cnt += 1
			if t.title in ['DefaultTiddlers','MainMenu','SiteTitle','SiteSubtitle'] or t.current == False:
				extra += 1
			else:
				rt = xd.add(ta,'tiddler')
				xd.add(rt,'time',t.modified)
				xd.add(rt,'who',getAuthor(t))
				xd.add(rt,'page',t.page)
				xd.add(rt,'title',t.title)
		if cnt < limit or extra == 0:
			break
		else:
			offset += limit
			limit = extra
	xd.add(re,'success',True)
	self.sendXmlResponse(xd)

  def getRecentComments(self):
	xd = self.initXmlResponse()
	re = xd.add(xd,'result')
	offset = eval(self.request.get('offset'))
	limit = eval(self.request.get('limit'))
	cs = Comment.all().order("-created").fetch(limit,offset)
	ca = xd.add(re,"comments",attrs={'type':'object[]'})
	dt = dict()
	for ac in cs:
		rt = xd.add(ca,"comment")
		xd.add(rt,"text",ac.text)
		xd.add(rt,"who",ac.author)
		xd.add(rt,"time",ac.created)
		xd.add(rt,"ref",ac.ref)
		xd.add(rt,"tiddler",ac.tiddler)
		if dt.has_key(ac.tiddler) == False:
			at = Tiddler.all().filter('id',ac.tiddler).filter('current',True).get()
			if at != None:
				dt[ac.tiddler] = at
	ta = xd.add(re,"tiddlers",attrs={'type':'object[]'})
	for (id,tn) in dt.iteritems():
		ti = xd.add(ta,"tiddler")
		xd.add(ti,"page",tn.page)
		xd.add(ti,"title",tn.title)
		xd.add(ti,"id",id)
	xd.add(re,'success',True)
	self.sendXmlResponse(xd)

  def createGroup(self):
	name = self.request.get("name")
	if Group.all().filter("name =", name).get() == None:
		g = Group()
		g.name = name
		g.admin = users.get_current_user()
		g.put()
		self.reply({"Group": name, 'success': True})
	else:
		self.reply({"Message": "A group named " + name + " already exists", 'success': False})
		
  def getGroupMembers(self):
	grp = self.request.get("groupname")
	ms = GroupMember.all().filter("group =",grp).order("name")
	self.initXmlResponse()
	xd = xml.dom.minidom.Document()
	tr = xd.createElement("reply")
	tr.setAttribute('type', 'string[]')
	for am in ms:
		av = xd.createElement("m")
		tr.appendChild(av)
		av.appendChild(xd.createTextNode(unicode(am.name)))
	xd.appendChild(tr)
	self.response.out.write(xd.toxml())
	
  def addGroupMember(self):
	user = self.request.get("user")
	grp = self.request.get("groupname")
	ms = GroupMember.all().filter("group =",grp).filter("name =",user)
	if ms.get() == None:
		nm = GroupMember()
		nm.group = grp
		nm.name = user
		nm.put()
		self.reply({'success': True})
	else:
		self.reply({"Message": user + " is already a member of " + grp,'success':False})

  def removeGroupMember(self):
	user = self.request.get("user")
	grp = self.request.get("groupname")
	gmu = GroupMember.all().filter("group =",grp).filter("name =",user).get()
	gmu.delete()
	self.reply({'success': True})

  def tiddlerChanged(self,et,nt):
	if et.tags != nt.tags:
		self.status = "tags changed: " + et.tags + " <> " + nt.tags
		return True
	if et.text != nt.text:
		self.status = "text changed: " + et.text + " <> " + nt.text
		return True
	if et.title != nt.title:
		self.status =  "title changed: " + et.title + " <> " + nt.title
		return True
	return False  
  
  def uploadTiddlersFrom(self,storeArea):
	page = Page.all().filter("path",self.path).get()
	if page == None:
		error = "Page " + nt.page + " doesn't exist (page properties are not undefined)!"
	else:
		error = page.UpdateViolation()
	if error != None:
		self.response.out.write(error)
		return

	self.response.out.write("<ul>")
	for te in storeArea.childNodes:
		# self.response.out.write("<br>&lt;" + (te.tagName if te.nodeType == xml.dom.Node.ELEMENT_NODE else unicode(te.nodeType)) + "&gt;")
		if te.nodeType == xml.dom.Node.ELEMENT_NODE:
			nt = TiddlerFromXml(te,self.path)
			if nt == None:
				return
			nt.public = page.anonAccess > page.NoAccess
			#self.response.out.write("<br>Upload tiddler: " + nt.title + " | " + nt.id + " | version " + unicode(nt.version) + nt.text + "<br>")
			
			et = Tiddler.all().filter('id',nt.id).filter("current",True).get() if nt.id != "" else None
			if et == None:
				et = Tiddler.all().filter('page',self.path).filter('title',nt.title).filter("current",True).get()

			# self.response.out.write("Not found " if et == None else ("Found v# " + unicode(et.version)))
			if et == None:
				self.status = ' - added'
				nt.id = unicode(uuid.uuid4())
				nt.comments = 0
			elif et.version > nt.version:
				self.response.out.write("<li>" + nt.title + " - version " + unicode(nt.version) + \
										" <b>not</b> uploaded; it is already at version " + unicode(et.version) + "</li>")
				continue
			elif self.tiddlerChanged(et,nt):
				nt.id = et.id
				nt.version = nt.version + 1
				nt.comments = et.comments
				et.current = False
				et.put()
			else:
				self.response.out.write("<li>" + nt.title + " - no changes</li>")
				continue
			nt.put()
			self.response.out.write('<li><a href="' + self.path + "#" + urllib.quote(nt.title) + '">' + nt.title + "<a> " + self.status + "</li>")
			page.Update(nt)
	self.response.out.write("</ul>")

  def uploadTiddlyWikiDoc(self,filename,filedata):
	try:
		dom = xml.dom.minidom.parseString(filedata)
	except Exception,x:
		self.response.out.write("Oops: " + unicode(x))
		return
	doce = dom.documentElement
	if doce.tagName == "html":
		for ace in doce.childNodes:
			if ace.nodeType == xml.dom.Node.ELEMENT_NODE and ace.tagName == "body":
				for bce in ace.childNodes:
					if bce.nodeType == xml.dom.Node.ELEMENT_NODE:
						if bce.getAttribute("id") == "storeArea":
							self.uploadTiddlersFrom(bce)
		
  def ImportDb(self,filedata):
	try:
		dom = xml.dom.minidom.parseString(filedata)
		doce = dom.documentElement
		if doce.tagName == "giewiki":
			for ace in doce.childNodes:
				if ace.nodeType == xml.dom.Node.ELEMENT_NODE:
					mc = None
					deleteKey = None
					deleteMatch = None
					if ace.tagName == "tiddlers":
						mc = Tiddler
					elif ace.tagName == "shadowtiddlers":
						mc = ShadowTiddler
					elif ace.tagName == "siteinfos":
						mc = ShadowTiddler
					elif ace.tagName == "pages":
						mc = Page
						deleteKey = "path"
					elif ace.tagName == "comments":
						mc = Comment
					elif ace.tagName == "messages":
						mc = Message
					elif ace.tagName == "notes":
						mc = Note
					elif ace.tagName == "groups":
						mc = Group
					elif ace.tagName == "groupmember":
						mc = GroupMember
					if mc != None:
						for ice in ace.childNodes:
							mi = mc()
							self.response.out.write('<br>class ' + mc.__name__ + '()<br>')
							for mce in ice.childNodes:
								field = mce.tagName
								dtype = mce.getAttribute('type')
								if mce.firstChild != None:
									self.response.out.write(field + '(' + dtype + ') ')
									v = mce.firstChild.nodeValue
									# self.response.out.write(field + unicode(mce.firstChild.nodeValue))
									if dtype == 'datetime':
										if len(v) == 19:
											v = datetime.datetime.strptime(v,'%Y-%m-%d %H:%M:%S')
										else:
											v = datetime.datetime.strptime(v,'%Y-%m-%d %H:%M:%S.%f')
										setattr(mi,field,v)
									elif dtype == 'long' or dtype == 'int' or dtype == 'bool':
										setattr(mi,field,eval(v))
									elif dtype == 'User':
										setattr(mi,field,users.User(email=v))
									else:
										setattr(mi,field,unicode(v))
								if field == deleteKey:
									deleteMatch = v
							if deleteMatch != None:
								oldrec = mc.all().filter(deleteKey,deleteMatch).get()
								if oldrec != None:
									oldrec.delete()
							mi.put()
				
	except Exception,x:
		self.response.out.write("Oops: " + unicode(x))
		return

  def replaceFile(self):
	return self.uploadFile(True)

  def replaceExistingFile(self):
	tuf = memcache.get(self.request.get('filename'))
	if tuf is None:
		return self.fail("Upload is no longer in memory - try again!")
	else:
		puf = UploadedFile.all().filter('path',tuf.path).get()
		if puf != None:
			if not puf.blob is None:
				puf.blob.delete()
			puf.delete()
		tuf.put()
		self.reply()

  def fileList(self):
	files = UploadedFile.all()
	owner = self.request.get('owner')
	if owner != '':
		files = files.filter('owner',owner)
		
	path = self.request.get('path')
	far = []
	for f in files.fetch(100):
		if path == "" or f.path.find(path) == 0:
			far.append( { 'date': f.date, 'mimetype': f.mimetype, 'owner': f.owner.nickname() if f.owner != None else '', 'path': f.path, 'size': -1 if f.blob == None else f.blob.size } ) 
	self.reply({ 'files': far })

  def deleteFile(self):
	fn = self.request.get('url', None)
	if fn is None:
		return self.fail("Missing argument")
	else:
		ufo = UploadedFile.all().filter('path',fn).get()
		if ufo is None:
			return self.fail("No such file: " + fn)
		elif ufo.owner != users.get_current_user() and not users.is_current_user_admin():
			return self.fail("Not allowed to delete " + fn)
		if not ufo.blob == None:
			ufo.blob.delete()
		ufo.delete()
		self.reply()
	
  def urlFetch(self):
	result = urlfetch.fetch(self.request.get('url'))
	if result.status_code == 200:
		xd = self.initXmlResponse()
		tv = xd.createElement('Content')
		xd.appendChild(tv)
		tv.appendChild(xd.createTextNode(result.content))
		self.response.out.write(xd.toxml())


  def tiddlersFromUrl(self):
	if self.request.get('menu') == 'true':
		filelist = list()
		for file in UrlImport.all():
			filelist.append(file.url)
		return replyWithStringList(self,"files","file",filelist)

	url = self.request.get('url')
	iftagged = self.request.get('filter')
	cache = self.request.get('cache')
	source = self.request.get('source',None)
	select = self.request.get('select')
	cache = 60 if cache == "" else int(cache) # default cache age: 60 s
	try:
		self.warnings = []
		tiddlers = self.tiddlersFromSources(url,source,cache=cache,save=True)
		if tiddlers == None:
			return self.fail('\n'.join(self.warnings))
	except xml.parsers.expat.ExpatError, ex:
		return self.fail("The url " + url + " failed to read as XML: <br>" + unicode(ex))
		
	fromUrl = list()
	page = self.CurrentPage()
	if page != None and page.systemInclude != None:
		urls = page.systemInclude.split('\n')
		for al in urls:
			if al.startswith(url):
				if select != "":
					urls.remove(al) # to be replaced by select
				else:
					fromUrl = al.split('#',1)[1].split('||')
	if select != "":
		error = page.UpdateViolation()
		if error != None:
			return self.fail(error)
		if select != 'void':
			newPick = url + "#" + select
		else:
			newPick = None
		if page.systemInclude == None:
			page.systemInclude = newPick
		else:
			if newPick != None:
				urls.append(newPick)
			page.systemInclude = '\n'.join(urls)
		page.put()
		memcache.set(page.path,page,1)
		return self.warn("Reload to get the requested tiddlers")

	newlist = list()
	for t in tiddlers:
		if t != None:
			if iftagged == "" or tagInFilter(t.tags,iftagged):
				newel = {'title': t.title, 'tags': t.tags }
				if fromUrl.count(t.title) > 0:
					newel['current'] = 'true'
				if hasattr(t,'requires'):
					newel['requires'] = getattr(t,'requires')
				newlist.append(newel)

	replyWithObjectList(self,'Content','tnt',newlist)


  def tiddlersFromSources(self,url,sources=None,cache=None,save=False):
	try:
		excl = []
		upr = urlparse.urlparse(url)
		scheme = upr[0]
		if scheme == 'local':
			return Tiddler.all().filter('page',upr[2]).filter('current', True)
		elif scheme == 'uploads':
			te = UploadedFile.all().filter('path',upr[2]).get()
			if te == None:
				return None
			else:
				if te.blob == None:
					xd = FixTWSyntaxAndParse(te.data)
				else:
					blobReader = te.blob.open()
					xd = FixTWSyntaxAndParse(blobReader.read())
					blobReader.close()
				url = None
		elif scheme == 'static':
			url = library.libraryPath + upr[2]
		if url != None:
			xd = self.XmlFromSources(url,sources,cache,save)
		if scheme == 'file':
			excl.append('GiewikiAdaptor')
	except IOError, iox:
		return Tiddler.all().filter('page',url).filter('current', True)
	except Exception, x:
		self.warnings.append('failed to read ' + unicode(url) + ":" + unicode(x))
		return None
	if xd.__class__ == xml.dom.minidom.Document:
		pe = xd.documentElement
		if pe.nodeName.lower() == 'html':
			es = pe.getElementsByTagName('body')
			if len(es) == 1:
				pe = es[0]
			else:
				raise ImportException(pe.nodeName + " contains " + unicode(len(es)) + " body elements.")
		return self.TiddlersFromXml(pe,url,excl)
	return None

  def XmlFromSources(self,url,sources=None,cache=None,save=False):
	if url.startswith('//'):
		url = 'http:' + url
	if url.startswith('http:') or url.startswith('file:'):
		if sources == None or 'local' in sources:
			importedFile = UrlImport.all().filter('url',url).get()
			if importedFile != None:
				if importedFile.blob == None:
					return FixTWSyntaxAndParse(importedFile.data)
				else:
					blobReader = importedFile.blob.open()
					rv = FixTWSyntaxAndParse(blobReader.read())
					blobReader.close()
					return rv
		if sources == None or 'remote' in sources:
			content = memcache.get(url) if cache != None else None
			if content == None:
				try:
					result = urlfetch.fetch(url)
				except urlfetch.Error, ex:
					raise ImportException("Could not get the file <b>" + url + "</b>:<br/>Exception " + unicode(ex.__class__.__doc__))
				if result.status_code != 200:
					raise ImportException("Fetching the url " + url + " returned status code " + unicode(result.status_code))
				else:
					content = result.content
					if cache != None and len(content) < 1000000:
						memcache.add(url,content,cache)
			xd = FixTWSyntaxAndParse(content)
			if xd == None:
				return None
			if save:
				urlimport = UrlImport.all().filter('url',url).get()
				if urlimport is None:
					urlimport = UrlImport()
					urlimport.url = url
				urlimport.data = db.Blob(content)
				urlimport.put()
			return xd
		return None
	else:
		return xml.dom.minidom.parse(url)


  def TiddlersFromXml(self,te,path,excl=[]):
	lst = []

	def append(t):
		if t != None:
			if not t.title in excl:
				lst.append(t)

	if te.tagName in ('body','document'):
		for acn in te.childNodes:
			if acn.nodeType == xml.dom.Node.ELEMENT_NODE:
				if acn.nodeName == 'storeArea' or acn.getAttribute('id') == 'storeArea':
					for asn in acn.childNodes:
						if asn.nodeType == xml.dom.Node.ELEMENT_NODE and asn.tagName == 'div':
							append(TiddlerFromXml(asn,path))
	elif te.tagName == 'tiddlers':
		for ce in te.childNodes:
			if ce.nodeType == xml.dom.Node.ELEMENT_NODE and ce.tagName == 'div':
				append(TiddlerFromXml(ce,path))
	else:
		append(TiddlerFromXml(te,path))
	return lst
	
  def evaluate(self):
	xd = self.initXmlResponse()
	tv = xd.createElement('Result')
	xd.appendChild(tv)
	if  users.is_current_user_admin():
		try:
			result = eval(self.request.get("expression"))
# this syntax was introduced in Python 2.6, and is not supported by the google environment:
#        except Exception as sa:
# in stead, use:
		except Exception, sa:
			result = sa
	else:
		result = "Access denied"
	tv.appendChild(xd.createTextNode(unicode(result)))
	self.response.out.write(xd.toxml())

  def saveSiteInfo(self):
	xd = self.initXmlResponse()
	tv = xd.createElement('Result')
	xd.appendChild(tv)
	if  users.is_current_user_admin():
		try:
			data = SiteInfo.all().get()
			if data != None:
				data.delete()
			data = SiteInfo()
			data.title = self.request.get("title")
			data.description = self.request.get("description")
			data.put()
			result = "Data was saved"
		except Exception, sa:
			result = sa
	else:
		result = "Access denied"
	tv.appendChild(xd.createTextNode(unicode(result)))
	self.response.out.write(xd.toxml())

  def expando(self,method):
	xd = self.initXmlResponse()
	result = xd.createElement('Result')
	mt = Tiddler.all().filter("page = ", "/_python/").filter("title = ", method).filter("current = ", True).get()
	if mt == None:
		return self.fail("No such method found: " + method)
	code = compile(mt.text, mt.title, 'exec')
	exec code in globals(), locals()
	if result.childNodes.count > 0:
		xd.appendChild(result)
		self.response.out.write(xd.toxml())

  def truncateAll(self):
	if users.is_current_user_admin():
		truncateAllData()
		self.fail('Data was truncated')
	else:
		self.fail('Access denied')
		
  def getFile(self):
	try:
		ftwm = open(path.normcase( self.request.get('filename')))
		self.reply({'text': ftwm.read()})
		ftwm.close()
	except Exception,x:
		self.fail(unicode(x))

  def userProfile(self):
	"Store or retrieve current user's profile data"
	cu = users.get_current_user()
	if cu == None:
		return self.fail('Not logged in')
	u = UserProfile.all().filter('user', cu).get()
	if u == None and self.subdomain != None:
		namespace_manager.set_namespace(None)
		u = UserProfile.all().filter('user', cu).get()
		namespace_manager.set_namespace(self.subdomain)
		if u != None:
			CopyIntoNamespace(u,self.subdomain)
	an = None
	al = self.request.arguments()
	al.remove('method') # ignore
	for an in al:
		av = self.request.get(an)
		if u == None: # data supplied and not stored
			u = UserProfile(user = cu, txtUserName = cu.nickname()) # new record
			u.put()
		if an == 'txtUserName':
			pn = PenName.all().filter('penname',av).get()
			if pn != None:
				try:
					if pn.user.user != users.get_current_user():
						return self.fail( "This penname belongs to someone else (" + pn.user.nickname() + ")" \
										  if users.is_current_user_admin() else \
										  "This penname belongs to someone else")
				except Exception,x:
					logging.error("PenName(" + av + ") ->user mapping failed: " + unicode(x))
					pn.delete()
					pn = None
			elif pn == None:
				pn = PenName.all().filter('user',u).get()
			if pn == None:
				pn = PenName(user=u)
			pn.penname = av
			pn.put()
		if an in dir(UserProfile):
			attype = type(getattr(UserProfile,an))
		elif an.startswith('chk'):
			attype =  db.BooleanProperty
		else:
			attype = db.StringProperty
			
		if attype == db.BooleanProperty:
			av = True if av == 'true' else False
		elif attype == db.IntegerProperty:
			try:
				av = int(av)
			except Exception, x:
				return self.fail(unicode(x))
		setattr(u,an,av)
	if an != None:
		u.put()
		return self.reply()
		
	# retrieve data, if it exists
	default_subject = "Re: <tiddler_name>"
	default_body = "<message_text>\n<tiddler_url>"
	if u != None: 
		urls = list()
		host = self.request.host
		if self.subdomain != None:
			host = host[len(self.subdomain):]
		else:
			host = '.' + host
		prjs = u.Projects(self.subdomain).split(' ')
		for p in prjs:
			if len(p) > 0:
				urls.append(p if p.endswith('appspot.com') else p + host)
		self.reply({ \
			'success': True, \
			'txtUserName': NoneIsBlank(u.txtUserName),
			'txtEmail': u.txtEmail if hasattr(u,'txtEmail') else cu.email(), 
			'aboutme': NoneIsBlank(u.aboutme),
			'tiddler': NoneIsBlank(u.tiddler),
			'tmsg_subject': NoneIsDefault(getattr(u,'tmsg_subject'),default_subject),
			'tmsg_body': NoneIsDefault(getattr(u,'tmsg_body'),default_body),
			'projects': ' '.join(urls),
			'updateaccess': True })
	elif cu != None:
		self.reply({ \
			'success': True, \
			'txtUserName': cu.nickname(),
			'txtEmail': cu.email(),
			'tmsg_subject': default_subject,
			'tmsg_body': default_body,
			'updateaccess': True })
	else:
		self.reply()

  def addProject(self):
	cns = namespace_manager.get_namespace()
	if cns == "":
		cns = None
	namespace_manager.set_namespace(None)
	rv = self.RootAddProject()
	namespace_manager.set_namespace(cns) # back to the current namespace
	return rv
  
  def RootAddProject(self):
	up = UserProfile.all().filter('user', users.get_current_user()).get()
	if up == None:
		return self.fail("You have to first save your profile before you can add a project")
	currp = up.projects.split() if up.projects != None else []
	if len(currp) >= 10:
		return self.fail("You cannot create more than 10 projects")

	sd = self.request.get('domain')
	if sd == '':
		return self.fail("You must supply a name")

	rem = re.match('([0-9A-Za-z._-]{0,100})',sd)
	if rem.group() != sd:
		return self.fail("Invalid name: " + sd[rem.end():rem.end() + 1] + " not allowed!")
		
	ev = SubDomain.all().filter('preurl',sd).get()
	if ev == None:
		if self.request.get('confirmed',False) == False:
			return self.reply({'success': 'true'})
		ev = SubDomain( \
			preurl = sd, \
			ownerprofile = up, \
			owneruser = users.get_current_user())
		ev.put()
	elif ev.owneruser != users.get_current_user():
		if ev.public == False:
			return self.fail("This project belongs to someone else")
		if not self.request.get('confirmed',False):
			return self.warn("This project is managed by " + ev.ownerprofile.txtUserName + '\nProceed?')
	if not sd in currp:
		currp.append(sd)
		up.projects = ' '.join(currp)
		up.put()
	self.reply()
	
  def getUserInfo(self):
	user = self.request.get('user')
	pn = PenName.all().filter('penname',user).get()
	if pn == None:
		return self.reply({ 'about': user })
	self.reply( { 'about': pn.user.aboutme, 'tiddler': pn.user.tiddler } )

  def openLibrary(self):
	ln = self.request.get('library')
	if ln.startswith('/'):
		pgs = []
		for p in Page.all():
			if p.path.startswith(ln) and len(p.path) > len(ln):
				pgs.append(p.path)
		self.reply({'pages': pgs})
	elif ln.find(':/') > 0:
		try:
			ups = urlparse.urlparse(ln)
			result = urlfetch.fetch(ln,'method=openLibrary&library=' + ups.path,'POST')
		except urlfetch.Error, ex:
			raise ImportException("Could not get the file <b>" + ln + "</b>:<br/>Exception " + unicode(ex.__class__.__doc__))
		if result.status_code != 200:
			raise ImportException("Fetching the url " + ln + " returned status code " + unicode(result.status_code))
		else:
			content = result.content
			#if cache != None:    
			#    memcache.add(url,content,cache)
			self.initXmlResponse()
			self.response.out.write(content)
	else:
		try:
			lib = library()
			lm = getattr(lib,ln)
			self.reply({'pages': lm()})
		except Exception,x:
			self.fail("Importing " + ln + ": " + unicode(x))
	
  def listScripts(self):
	try:
		scripts = []
		for (name,file) in javascriptDict.iteritems():
			scripts.append(name)
		self.reply({'success': True, 'list': '|'.join(scripts)})
	except Exception,x:
		self.fail(unicode(x))

  def traceMethod(self,m,method):
	r = method()
	if self.trace != False:
		LogEvent("tm:" + m,'\n'.join(self.trace))

  def traceKey(self):
	return "T:" + self.request.remote_addr

  def post(self):
	self.user = users.get_current_user()
	self.path = self.request.path
	trace = memcache.get(self.traceKey())
	self.trace = [] if trace != None and trace != "0" else False
	self.getSubdomain()
	m = self.request.get("method") # what do you want to do
	if m in dir(self):
		try: # find specified method if it's built-in
			method = getattr(self,m)
		except AttributeError, a:
			return self.fail("Invalid method: " + m)
		except MyError, x:
			return self.fail(unicode(x.value))
		return self.traceMethod(m,method) # run method
	else:
		try: # Any class that has a 'public(self,page)' method handle method named by class
			po = eval(m + "()") # construct class
			method = getattr(po,'public') # does it support the public interface?
			if method != None:
				return method(self) # i.e. po->public(self)
			else:
				return self.expando(m)
		except NameError:
			return self.expando(m)
		except Exception, x:
			return self.fail("Ups!\n" + unicode(dir(x)))

############################################################################
  def BuildTiddlerDiv(self,xd,id,t,user,xsvr=False):
	div = xd.createElement('div')
	div.setAttribute('id',  unicode(t.id) if t.id != None else unicode(t.title))
	div.setAttribute('title', unicode(t.title))
	if getattr(t,'locked',False):
		div.setAttribute('locked','true')
	elif t.page != self.path:
		if t.page != None:
			div.setAttribute('from',unicode(t.page))
		div.setAttribute('locked','true')

	div.setAttribute('modifier', unicode(getAuthor(t)))
	div.setAttribute('version', unicode(t.version))
	div.setAttribute('vercnt', unicode(t.vercnt if hasattr(t,'vercnt') and t.vercnt != None else t.version))
	modified = t.modified
	if hasattr(t,'reverted'): # reverted/modified is switched for recentChanges to show reverted:
		reverted = t.reverted
		if reverted != None:
			div.setAttribute('reverted', modified.strftime('%Y%m%d%H%M%S'))
			rby = t.reverted_by
			if rby != None:
				div.setAttribute('reverted_by', unicode(rby.nickname()))
			modified = reverted

	if modified != None:
		div.setAttribute('modified', modified.strftime('%Y%m%d%H%M%S'))

	if t.comments != None:
		div.setAttribute('comments', unicode(t.comments))

	if t.notes != None and user != None:
		if t.notes.find(user.nickname()) >= 0:
			div.setAttribute('notes', "true")

	if t.messages != None and user != None:
		msgCnt = t.messages.count("|" + user.nickname())
		if msgCnt > 0:
			div.setAttribute('messages', unicode(msgCnt))

	if t.tags != None:
		div.setAttribute('tags', unicode(t.tags))
		
	td = t.dynamic_properties()
	for m in td:
		if m == 'UXL_' or m == '_uxl' or (xsvr and m[:7] == 'server.'): 
			pass # the 'server:..' fields should not have been saved in the first place, but
		else:
			try:
				tavm = getattr(t,m)
				if type(tavm) == str:
					div.setAttribute(m,tavm)
				elif type(tavm) == unicode:
					div.setAttribute(m,tavm)
				elif type(tavm) == bool and tavm:
					div.setAttribute(m,"true")
				else: # if type(tavm) != instancemethod:
					pass # logging.info("Attr " + m + " is a " + unicode(type(tavm)) + ": " + unicode(tavm))
			except Exception, x:
				logging.warn("X: " + unicode(x))

	pre = xd.createElement('pre')
	if t.text != None:
		pre.appendChild(xd.createTextNode(t.text))
	div.appendChild(pre)
	return div

  def cleanup(self):
	for el in EditLock.all():
		until = el.time + datetime.timedelta(0,60*eval(unicode(el.duration)))
		if until < datetime.datetime.utcnow():
			el.delete()
	truncateModel(LogEntry)

  def deleteLink(self,id):
	done = False
	for st in ShadowTiddler.all():
		if st.id == id:
			st.delete()
			done = True
	self.response.out.write(''.join(["Id ", id,' ','deleted' if done else 'not deleted']))

  def buildIndex(self):
	purge = self.request.get('purge')
	done = self.request.get('done',None)
	total = self.request.get('total')
	n = 0
	liq = []
	if purge:
		index = search.Index(name=_INDEX_NAME)
		while True:
			dl = index.list_documents(ids_only=True,limit=1000)
			if len(dl) == 0:
				break
			else:
				ids = []
				for d in dl:
					ids.append(d.doc_id)
				index.delete(ids)
		return self.response.out.write("Index purged")

	if done is None:
		db.delete(IndexQueue.all(keys_only=True))
		for t in Tiddler.all(keys_only=True).filter('current',True):
			iq = IndexQueue(tiddler=t)
			liq.append(iq)
		db.put(liq)
		return self.reply({'total': len(liq), 'done': 0 })
	else:
		done = int(done)
		max = 5
		for it in IndexQueue.all():
			PutTiddler(it.tiddler,put=True)
			it.delete()
			n = n + 1
			if n == max:
				break
		return self.reply({'total': total, 'done': n + done })

  def listIndex(self):
	name = self.request.get('name',None)
	if name is None:
		indexes = dict()
		for idx in search.get_indexes(fetch_schema=True):
			indexes[idx.name] = []
			for sn in idx.schema:
				ssn = str(sn)
				if not ssn in ['uxl_','page']:
					indexes[idx.name].append(ssn)
		return self.reply(indexes)

  def task(self,method):
	if method == 'cleanup':
		return self.cleanup()
		
  def Trace(self,msg):
	if self.trace == False:
		return # disabled
	if self.trace == None:
		self.trace = []
	self.trace.append(msg)
	
  def CurrentPage(self):
	pp = memcache.get(self.path)
	if pp != None and type(pp) == Page:
		logging.info("Page " + self.path + " found in memcache")
		return pp
	for page in Page.all().filter("path",self.path):
		logging.info("Page " + self.path + " found.")
		return page
	logging.info("CurrentPage: " + self.path + " NOT found")
	if self.subdomain != None and (not hasattr(self.sdo,"version") or self.sdo.version < giewikiVersion):
		namespace_manager.set_namespace(None)
		LogEvent('CurrentPage', "Upgrading page " + self.path + " of " + self.request.host)
		page = Page.all().filter('sub',self.subdomain).filter("path",self.path).get()
		LogEvent('CurrentPage', "Page version " + (page.gwversion if page != None else "Page not found"))
		namespace_manager.set_namespace(self.subdomain)
		return page
	return None

  def addTiddler(self,tiddict,title,text,modified,author):
	td = Tiddler()
	td.title = title
	if modified == None:
		modified = datetime.datetime(2010,1,1,0,0)
	td.author = author
	td.modified = modified
	td.version = 0
	td.text = text
	tiddict[title] = td

  def getIncludeFiles(self,rootpath,page,defaultTiddlers,twd):
	tiddict = dict()
	includefiles = self.request.get('include').split()
	if twd != None and twd != TWComp:
		includefiles.append('GiewikiAdaptor.xml')
		self.addTiddler(tiddict, "SiteTitle", page.title, page.titleModified, page.owner)
		self.addTiddler(tiddict, "SiteSubtitle", page.subtitle, page.subtitleModified, page.owner)
	if rootpath:
		if page == None:
			if self.user == None:
				includefiles.append('help-anonymous.xml')
				defaultTiddlers = "Welcome" # title from help-anonymous.xml
			else:
				includefiles.append('page-setup-first.xml')

	if defaultTiddlers != None:
		td = Tiddler()
		td.title = "DefaultTiddlers"
		td.version = 0
		td.text = defaultTiddlers
		tiddict["DefaultTiddlers"] = td
			
	for tn in includefiles:
		try:
			splitpos = tn.find('|')
			if splitpos > 0: # rule: filename|select-list
				tfs = tn[splitpos + 1:].split('|') # the filter: ta|tb|...
				tn = tn[0:splitpos] # the filename
			else:
				tfs = None
			tds = self.tiddlersFromSources(tn)
			if tds != None:
				tdx = []
				for tdo in tds:
					if tdo != None:
						tdo.id = 'included'
					if tdo == None:
						self.warnings.append("Internal error: None in TiddlersFromSources")
					elif tfs == None or tdo.title in tfs:
						tiddict[tdo.title] = tdo
						if tfs != None:
							tfs.remove(tdo.title)
					else:
						tdx.append(tdo.title)
				if tfs != None and len(tfs) > 0:
					if tfs[0] != 'list':
						self.warnings.append("Not found: " + '|'.join(tfs))
					elif len(tdx) > 0:
						self.warnings.append("Found but excluded:<br>" + ' '.join(tdx))
		except Exception, x:
			self.response.out.write("<html>Error including " + tn + ":<br>" + unicode(x))
			raise x
	return tiddict

  def getTiddlersFromTemplate(self, refTemplate, tiddict, update=False):
	tl = refTemplate
	if not tl.current and update:
		ptc = PageTemplate.all().filter('title',refTemplate.title).filter('current',True).get()
		if ptc != None:
			tl = ptc
	xd = xml.dom.minidom.parseString(tl.text.encode('utf-8'))
	tds = self.TiddlersFromXml(xd.documentElement,refTemplate.page)
	if tds != None:
		for tdo in tds:
			if hasattr(self,'template_tags'):
				tdo.tags = AddTagsToList(tdo.tags,self.template_tags)
			tiddict[tdo.title] = tdo
	return tl

  def getText(self, page, readAccess=True, tiddict=dict(), twd=None, xsl=None, metaData=False, message=None, mcpage = None):
	if message:
		self.warnings.append(message);
	if mcpage:
		mcpage.lazyLoadAll = dict()
		mcpage.lazyLoadTags = dict()
		mcpage.lazyLoadSpecial = []
		mcpage.page = page

	if page != None:
		try:
			refTemplate = page.template
		except:
			refTemplate = None

		if readAccess == False:
			if self.request.get('twd',None) != None and self.request.get('rat') == self.readAccessToken(page,True):
				readAccess = True # allow sync status retrieval
			else:
				alwaysReadAccess = ['NoAccessMessage','DefaultTiddlers']


		if readAccess and refTemplate != None:
			tl = self.getTiddlersFromTemplate(refTemplate,tiddict,self.request.get('upgradeTemplate') == 'try')
			if AttrValueOrBlank(page,'tiddlertags') == '':
				page.tiddlertags = AttrValueOrBlank(tl,'tiddlertags')

		if readAccess and page.systemInclude != None:
			includeDisabled = self.request.get('disable')
			if includeDisabled != '*':
				for sf in page.systemInclude.replace('\r','').split('\n'):
					urlParts = sf.split('#',1)
					urlPath = urlParts[0]
					if includeDisabled != urlPath:
						urlPicks = None if len(urlParts) <= 1 else urlParts[1].split('||')
						tds = self.tiddlersFromSources(urlPath)
						if tds != None:
							for tdo in tds:
								if urlPicks == None or urlPicks.count(tdo.title) > 0:
									if tdo.id == None or tdo.id == '':
										tdo.id = 'include-' + urlPath + '#' + tdo.title
									tdo.page = urlPath
									tiddict[tdo.title] = tdo

	tiddlers = Tiddler.all().filter("page", self.path).filter("current", True)
	if page == None:
		def inclusionFilter(t):
			return False
	else:
		ttiddlers = list()
		nast = 0
		for at in tiddlers:
			ata = at
			if at and hasattr(at,'autosaved_by'):
				asv = self.getAutoSavedVersion(at)
				if not asv == ata:
					ata = asv
					nast = nast + 1
			ttiddlers.append(ata)
		tiddlers = ttiddlers
		if nast:
			self.warnings.append(str(nast) + (" tiddlers have" if nast > 1 else " tiddler has") + " been auto-saved (see tags)!")

		getdts = self.request.get('deprecated',None)
		def inclusionFilter(t):
			if readAccess:
				deprecated = hasattr(t,'deprecated')	# Check if this tiddler is deprecated
				if mcpage != None and deprecated:
					mcpage.deprecatedCount = mcpage.deprecatedCount + 1
				if getdts == None:						# Unless you want the deprecated tiddlers
					if deprecated:
						return False					#   leave 'em out
				if metaData and hasattr(t,'lazyLoad'):	# - or lazyLoad only
					if mcpage:
						ttl = tagStringToList(t.tags)
						if not 'excludeLists' in ttl:
							for alzt in ttl:
								if alzt in mcpage.lazyLoadTags:
									if not t.title in mcpage.lazyLoadTags[alzt]:
										mcpage.lazyLoadTags[alzt].append(t.title)
								else:
									mcpage.lazyLoadTags[alzt] = [ t.title ]
							if 'shadowTiddler' in ttl:
								if not t.title in mcpage.lazyLoadSpecial:
									mcpage.lazyLoadSpecial.append(t.title)
							else:
								mcpage.lazyLoadAll[t.title] = t.modified
					if t.title in tiddict.keys():
						tiddict.pop(t.title)
					return False
				priv = hasattr(t,'private')
				if t.author == users.get_current_user():
					if priv:
						delattr(t,'private')
					return True
				else:
					return not priv
			elif t.title in alwaysReadAccess:
				if t.title == 'DefaultTiddlers':
					t.text = '[[NoAccessMessage]]'
				return True
			else:
				return False

	for st in ShadowTiddler.all():
		if self.path.startswith(st.path) and inclusionFilter(st.tiddler):
			if readAccess or st.tiddler.title in alwaysReadAccess:
				try:
					tiddict[st.tiddler.title] = st.tiddler
				except Exception, x:
					self.warnings.append(''.join(['The shadowTiddler with id ', st.id, \
						' has been deleted! <a href="', self.path, '?method=deleteLink&id=', st.id, '">Remove link</a>']))

	mergeDict(tiddict, tiddlers, inclusionFilter)
	
	if page != None:
		includes = Include.all().filter("page", self.path)
		for t in includes:
			tv = t.version
			tq = Tiddler.all().filter("id = ", t.id)
			if t.version == None:
				tq = tq.filter("current = ", True)
			else:
				tq = tq.filter("version = ", tv)
			t = tq.get()
			if t != None:
				id = t.id
				if id in tiddict:
					if t.version > tiddict[id].version:
						tiddict[id] = t
				else:
					tiddict[id] = t

	httpMethodTiddler = None
	for id, t in tiddict.iteritems():
		if t == None:
			print("Bad data in tiddict: " + unicode(id))
			return
		if t.title == 'HttpMethods':
			httpMethodTiddler = tiddict.pop(id)
			break
		
	self.Trace("Tiddict: " + unicode(len(tiddict)))
	for id, t in tiddict.iteritems():
		self.Trace(id + ':' + t.title)
	pages = []
	papalen = self.path.rfind('/')
	if papalen == -1:
		paw = ""
	else:
		paw = self.path[0:papalen + 1]
	for p in Page.all():
		if p.path.startswith(paw):
			pages.append(p)
		
	xd = self.initXmlResponse()

	elDoc = xd.createElement("document")
		
	if twd == None: # classic giewiki output
		elStArea = xd.createElement("storeArea")
		elShArea = xd.createElement("shadowArea")
	else: # HTML output
		self.response.headers['Content-Type'] = 'text/html'
		elStArea = xd.createElement('div')
		elStArea.setAttribute('id','storeArea')
		elShArea = xd.createElement('div')
		elShArea.setAttribute('id','shadowArea')
		if not metaData: # offline TW generation
			h = ''.join(['http://',  self.request.host, self.path, '?', self.request.query ])
			noEditAccess = not AccessToPage(page,self.user) in ['edit','all','admin']
			for t in tiddict.itervalues():
				if noEditAccess:
					t.id = ''
				setattr(t,'server.type',unicode('giewiki'))
				setattr(t,'server.host',unicode(h))
				setattr(t,'server.page.revision',unicode(t.modified.strftime('%Y%m%d%H%M%S')))

	scripts = dict()
	if len(tiddict) > 0:
		httpMethods = [ httpMethodTiddler.text ] if httpMethodTiddler != None else None
		for id, t in tiddict.iteritems():
			# pages at /_python/ are executable script...
			if t.page != None and t.page.startswith("/_python/") and t.page != self.path:
				# ...either to be called from a http (XmlHttpRequest) method
				if t.tags == 'HttpMethod':
					if httpMethods != None:
						httpMethods.append(t.title)
					else:
						t.text = "No proxy for:\n"
					t.text= "{{{\n" + t.text + "\n}}}"
				else: # ...or immediately
					try:
						if t.tags == "test":
							text = "{{{\n" + t.text + "\n}}}\n"
						code = compile(t.text, t.title, 'exec')
						exec code in globals(), locals()
						if t.tags == "test":
							t.text = text + t.text
					except Exception, x:
						t.text = unicode(x)

			antd = self.BuildTiddlerDiv(xd,id,t,self.user,metaData)
			if t.tags != None and 'shadowTiddler' in t.tags.split():
				if t.page != self.path: # remove tag and make it a shadowTiddler if not the source page
					tags = t.tags.split()
					tags.remove('shadowTiddler')
					t.tags = ' '.join(tags)
					elShArea.appendChild(antd)
				else:
					elStArea.appendChild(antd)
			elif t.tags != None and "systemScript" in t.tags.split():
				if xsl == "/static/iewiki.xsl":
					xsl = "/dynamic/iewiki-xsl?path=" + self.path
				scripts[t.title] = t.text
				memcache.set(self.path,scripts,5)
				elStArea.appendChild(antd)
			else:
				elStArea.appendChild(antd)

		if httpMethods != None:
			httpMethodTiddler.text = '\n'.join(httpMethods)
			elStArea.appendChild(self.BuildTiddlerDiv(xd,httpMethodTiddler.id,httpMethodTiddler,self.user))

	if metaData and hasattr(self,'pagekey'):
		introMsg = self.request.get("introduce",None)
		if not introMsg is None:
			self.warnings.append(introMsg)
		wmckey = "W:" + self.pagekey
		if len(self.warnings) > 0:
			memcache.set(wmckey,'<br>'.join(self.warnings))
		else:
			memcache.delete(wmckey)

	if xsl != None and xsl != "":    # except if no CSS is desired
		xd.appendChild(xd.createProcessingInstruction('xml-stylesheet','type="text/xsl" href="' + xsl + '"'))

	elDoc.appendChild(elShArea)
	elStArea.appendChild( xd.createComment("Content lives here!") )
	elDoc.appendChild(elStArea) # the root element
	
	xd.appendChild(elDoc)
	text = xd.toxml()
	cssha = '<div id="shadowArea">'
	cssta = u'<div id="storeArea">'
	mysha = elShArea.toxml()
	mysta = elStArea.toxml()
	serverHost = self.request.url.replace('.html?','?')

	if twd != None:
		twdtext = None
		if twd.startswith('http:'):
			try:
				twdres = urlfetch.fetch(twd)
				if twdres.status_code == 200:
					twdtext = twdres.content
				else:
					text = HtmlErrorMessage("Failed to retrieve " + twd + ":\nHTTP Error " + unicode(twdres.status_code))
			except Exception, x:
				text = HtmlErrorMessage("Cannot retrive " + unicode(twd) + ":\n" + unicode(x))
		else:
			try:
				ftwd = codecs.open(twd,'r','utf-8')
				twdtext = ftwd.read()
				ftwd.close()
			except Exception, x:
				text = HtmlErrorMessage("Cannot read " + twd + ":\n" + unicode(x))
		if twdtext != None:
			xmldecl = '<?xml version="1.0" ?>' # strip off this
			if twdtext.startswith(xmldecl):
				twdtext = twdtext[len(xmldecl):]
			if page != None:
				posTitleS = twdtext.find('<title>')
				posTitleE = twdtext.find('</title>')
				if posTitleS != -1 and posTitleE > posTitleS:
					twdtext = ''.join([twdtext[0:posTitleS + 7], page.title, ' - ' if len(page.title) and len(page.subtitle) else '', page.subtitle, twdtext[posTitleE:] ])
			if metaData:
				eoS = '<!-- injection point A -->'
				psPos = twdtext.rfind(eoS)
				if psPos == -1:
					psPos = twdtext.rfind('<!--POST-SCRIPT-START-->')
				globalPatch = [ twdtext[0:psPos],'<script src="' + self.path + '.config.js" type="text/javascript"></script>\r\n<script src="/static/iewiki.js" type="text/javascript"></script>']
				if not page is None:
					scrdict = dict()
					if hasattr(page,'scripts') and page.scripts != None:
						for sn in page.scripts.split('|'):
							if len(sn) > 0 and javascriptDict.has_key(sn):
								scrdict[sn] = javascriptDict[sn]
					if refTemplate != None:
						tpl = refTemplate
						if hasattr(tpl,'scripts') and tpl.scripts != None:
							for sn in tpl.scripts.split('|'):
								if len(sn) > 0:
									scrdict[sn] = javascriptDict[sn]
					for k in scrdict.keys():
						globalPatch.append('\r\n<script src="/scripts/' + scrdict[k] + '" type="text/javascript"></script>')
				globalPatch.append('\n<script type="text/javascript">' \
								 + '\nconfig.options.rat = ' + ( ('"' + self.readAccessToken(page,readAccess) + '"') if users.get_current_user() != None else 'false') + ';\n')
				globalPatch.append('</script>\n')
				for k in scripts:
					globalPatch.append('\n<script src="/dynamic/js' + self.request.path + "/" + k + '" type="text/javascript"></script>')

				if len(mysha) > len(cssha) + 6:
					iBPos = twdtext.rfind('<!--- injection point B --->')
					globalPatch.append(twdtext[psPos:iBPos])
					globalPatch.append(mysha[len(cssha):-6])
					globalPatch.append(twdtext[iBPos:])
				else:
					globalPatch.append(twdtext[psPos:])
				twdtext = ''.join(globalPatch)

				sasPos = twdtext.find(cssta)
				if sasPos == -1:
					text = '<div id="storeArea">) not found in ' + twd
				else:
					saePos = twdtext.find('</div>',sasPos)
					text = ''.join([twdtext[0:sasPos],mysta,twdtext[saePos + len('</div>'):]]) # insert text into body
			else:
				text = twdtext
				if mysta[-6:] == '</div>':
					text = text.replace(cssta,mysta[:-6])
				if mysha[-6:] == '</div>':
					text = text.replace(cssha,mysha[:-6])
				pss = '<!--POST-SCRIPT-START-->'
				text = text.replace(pss, \
					'<script type="text/javascript">' \
					+ '\nconfig.options.rat = ' + ( ('"' + self.readAccessToken(page,readAccess) + '"') if users.get_current_user() != None else 'false') + ';'
					+ '\nconfig.defaultCustomFields["server.host"] = "' + serverHost \
					+ '";\nconfig.defaultCustomFields["server.type"] = "giewiki";\n</script>\n'
					+ pss) 
	return text

  def readAccessToken(self,page,readAccess):
	# returns a read access token for use with TiddlyWiki sync, otherwise effectively a js bool
	if self.request.get('twd',None) != None:
		return hashlib.sha224(str(page.key().id())).hexdigest() if readAccess else ''
	else:
		return '1' if readAccess or (self.request.path == '/' and page is None and users.get_current_user() != None) else ''

  def ClearNoSuchTiddlersOfPage(self):
	page = self.CurrentPage()
	if page != None and page.owner == self.user:
		self.CurrentPage().NoSuchTiddlersOfPage(True)

  def get(self): # this is where it all starts
	self.user = users.get_current_user()
	self.path = self.request.path
	self.getSubdomain()
	if self.path.endswith('.config.js'):
		return self.getConfig()

	self.warnings = []
	self.pagekey = self.request.remote_addr + self.request.path
	
	trace = self.request.get('trace')
	if trace == '':
		self.trace = False # disabled by default
	else:
		self.traceLevel = trace
		self.trace = []
		memcache.set(self.traceKey(), self.traceLevel, 300) # 5 minutes
		self.Trace("TL=" + memcache.get(self.traceKey()))

	method = self.request.get('method',None)
	if method != None:
		if method == "LoginDone":
			return self.LoginDone(self.request.get("path"))
		elif method == 'authenticate':
			if self.authenticateAndSaveUploadedTiddlers(): # and proceed
				return # or not
		elif method == 'deleteLink':
			return self.deleteLink(self.request.get('id'))
		elif method == 'buildIndex':
			return self.buildIndex()
		elif method == 'clearNoSuchTiddlers':
			self.ClearNoSuchTiddlersOfPage()
		else:
			return self.post()

	if self.path == "/_tasks":
		return self.task(method)

	rootpath = self.path == '/'
	message = None
	twd = self.request.get('twd',None)
	xsl = self.request.get('xsl',None)
	if twd == None and xsl == None: # Unless a TiddlyWiki is required or a style sheet is specified
		twd = TWComp # xsl = "/static/iewiki.xsl" # use the default
		metaData = True
	elif twd == TWComp:
		metaData = True
	else:
		metaData = xsl != None

	defaultTiddlers = None
	self.template_tags = ['fromTemplate']

	page = self.CurrentPage()
	if page != None:
		if not templateAttribute(page,False,'include'):
			self.template_tags.append('excludeLists')
			self.template_tags.append('excludeSearch')
	elif self.path.startswith('/_templates/'):
		page = Page()
		tpln = self.path[len('/_templates/'):]
		if tpln != 'normal':
			page.template = PageTemplate.all().filter('title',tpln).get()
			if page.template == None:
				page.template = AutoGenerateTemplate(tpln)
			if page.template == None:
				self.response.set_status(404)
				return
			ttd = dict()
			self.getTiddlersFromTemplate(page.template,ttd)
			page.systemInclude = 'static:' + tpln + '.xml#' + '||'.join(ttd.keys())
		page.title = tpln
		page.subtitle = "Template"
		page.anonAccess = page.authAccess = page.groupAccess = Page.ViewAccess
		page.owner = rootPageOwner(self)
		page.path = self.path
		page.tags = 'template'
		page.put()
		# self.user = None # read-only!

	if page == None:
		if rootpath:
			message = "You have successfully installed " + app_identity.get_application_id()
		elif twd != None and self.path.endswith('.html'):
			self.path = self.path[0:-5]
			page = self.CurrentPage()
		elif xsl != None and self.path.endswith('.xml'):
			self.path = self.path[0:-4]
			page = self.CurrentPage()
	readAccess = ReadAccessToPage(page,self.user)
	if rootpath and self.subdomain != None:
		if page == None:
			if self.sdo == None:
				self.response.set_status(404)
				return
			elif self.sdo.owneruser != self.user:
				if self.user == None:
					defaultTiddlers = ""
				else:
					self.response.set_status(404)
					return
			else:
				message = "Start by defining root page properties"

#    if page != None and page.gwversion < giewikiVersion:
#        self.warnings.append(Upgrade(self,giewikiVersion))
	if page != None:
		LogEvent("Page request ", self.request.url)
	else:
		LogEvent("No page ", self.request.url)

	if page is None:
		if rootpath:
			pg = Page()
			pg.path = "/"
			memcache.set(self.request.remote_addr,pg) # used by config.js request
		else:
			if self.path in ('/UploadDialog.htm','/UploadTiddlers.htm'):
				ftwd = open(self.path[1:])
				uplurl = blobstore.create_upload_url('/upload')
				text = ftwd.read().replace('<uploadHandler>', uplurl, 1)
				ftwd.close()

				self.response.headers['Content-Type'] = 'text/html'
			else:
				# Not an existing page, perhaps an uploaded file ?
				uqp = urllib.unquote(self.request.path)
				file = UploadedFile.all().filter("path =", uqp).get()
				LogEvent("Get file", uqp)
				if file is None:
					page = Page.all().filter('path','/HTTP/404').get()
					if page is None:
						self.response.set_status(404)
						return
				else:
					self.response.headers['Content-Type'] = str(file.mimetype)
					if file.blob == None:
						text = file.data
					else:
						self.response.headers['X-AppEngine-BlobKey'] = str(file.blob.key())
						return
			if page is None:
				self.response.headers['Cache-Control'] = 'no-cache'
				self.response.out.write(text)
				return
	elif hasattr(page,'redirect'):
		rdpath = getattr(page,'redirect')
		rdpage = Page.all().filter('path',rdpath).get()
		if not rdpage is None:
			self.response.set_status(301)
			self.response.headers['Location'] = rdpath
			return

	tiddict = self.getIncludeFiles(rootpath,page,defaultTiddlers,twd)
	mcpage = MCPage()
	text = self.getText(page,readAccess,tiddict,twd,xsl,metaData,message,mcpage)
	logging.info("mckey := " + self.pagekey)
	memcache.set(self.pagekey,mcpage) # used by config.js request
		
	# last, but not least
	self.response.headers['Cache-Control'] = 'no-cache'
	self.response.headers['Access-Control-Allow-Origin'] = '*'
	self.response.out.write(text)
	if self.trace != False:
		LogEvent("get " + self.request.url,'\n'.join(self.trace))
		self.trace = False

  def options(self):
	self.response.headers.add_header('Access-Control-Allow-Origin','*')
	self.response.headers.add_header('Access-Control-Allow-Headers','X-Requested-With')

  def AppendConfigOption(self,list,fn,fv):
	self.configOptions.append(fn)
	list.append(fn + ': ' + fv)

  def getConfig(self):
	'Dynamically construct file ".config.js"'
	user = users.get_current_user()

	logging.info("CFG: " + self.request.path)
	mckey = self.request.remote_addr + self.request.path[0:-len('.config.js')]
	mcpage = memcache.get(mckey)
	page = None if not mcpage else mcpage.page
	logging.info("mckey : " + mckey)
	warnings = memcache.get("W:" + mckey)
	userGroups = ''
	pages = []
	noSuchTdlrs = None
	if page is None or page.is_saved() == False:
		logging.error("page not found in memcache" if page is None else "Page is new")
		yourAccess =  'view' if page is None else 'admin' # admin when db is blank
		anonAccess = 'view' #?
		authAccess = 'view' #?
		groupAccess = 'view'#?
		owner = ''
		locked = False
		deprecatedCount = 0
		siteTitle = ''
		subTitle = ''
		viewButton = 'false'
		viewPrior = 'false'
		showByline = 'true'
		foldIndex = 'false'
	else:
		yourAccess = AccessToPage(page,user)
		anonAccess = page.access[page.anonAccess]
		authAccess = page.access[page.authAccess]
		groupAccess = page.access[page.groupAccess]
		if (not page.ownername is None) and (user is None or user.nickname() != page.owner.nickname()):
			owner = page.ownername
		else:
			owner = page.owner.nickname()
		if page.groups != None:
			userGroups = page.groups
		viewButton = 'true' if hasattr(page,'viewbutton') and page.viewbutton else 'false'
		viewPrior = 'true' if hasattr(page,'viewprior') and page.viewprior else 'false'
		showByline = 'true' if (not hasattr(page,'showByline')) or page.showByline != False else 'false'
		foldIndex = 'true' if hasattr(page,'foldIndex') and page.foldIndex else 'false'
		siteTitle = page.title
		subTitle = page.subtitle
		locked = page.locked
		deprecatedCount = mcpage.deprecatedCount
		if hasattr(page,noSuchTiddlers):
			noSuchTdlrs = page.noSuchTiddlers

		papalen = page.path.rfind('/')
		if papalen == -1:
			paw = ""
		else:
			paw = page.path[0:papalen + 1]
		for p in Page.all():
			if p.path.startswith(paw): # list sibling pages
				pages.append(''.join(['{ p:', jsEncodeStr(p.path), ',t:', jsEncodeStr(p.title), ',s:', jsEncodeStr(p.subtitle),'}']))
		logging.info("Config for " + page.path + ": " + page.title)

	self.configOptions = list()
	isLoggedIn = user != None
	self.response.headers['Content-Type'] = 'application/x-javascript'
	self.response.headers['Cache-Control'] = 'no-cache'
	loginName = 'null' if user is None else jsEncodeStr(user.nickname())
	self.response.out.write( jsProlog)
	nsts = [] if noSuchTdlrs is None else noSuchTdlrs.split('\n')
	if mcpage:
		if mcpage.lazyLoadTags:
			for (altag,altit) in mcpage.lazyLoadTags.iteritems():
				if len(altit):
					self.response.out.write('lazyLoadTags[' + jsEncodeStr(altag) + '] = [')
				while len(altit):
					self.response.out.write(jsEncodeStr(altit.pop()))
					self.response.out.write(',' if len(altit) else '];\n')
		for atn in mcpage.lazyLoadSpecial:
			self.response.out.write('lazyLoadSpecial.push(' + jsEncodeStr(atn) + ');\n')
		if mcpage.lazyLoadAll:
			for (altitle,altime) in mcpage.lazyLoadAll.iteritems():
				if altitle in nsts:
					nsts.remove(altitle)
				self.response.out.write('lazyLoadAll[' + jsEncodeStr(altitle) + '] = "' + altime.strftime('%Y%m%d%H%M%S') + '";\n')
	
	project = "" if self.subdomain is None else self.subdomain
	apat = []
	if page:
		for dpn in page.dynamic_properties():
			if not dpn in reserved_page_attrs:
				apat.append(dpn + ': ' + jsEncodeStr(str(getattr(page,dpn))))

	self.response.out.write( jsConfig\
		.replace('<appid>', app_identity.get_application_id(),1)\
		.replace('<project>',project,1)\
		.replace('<sitetitle>',jsEncodeStr(siteTitle),1)\
		.replace('<subtitle>',jsEncodeStr(subTitle),1)\
		.replace('<isLocked>', jsEncodeBool(locked),1)\
		.replace('<tiddlerTags>',jsEncodeStr(AttrValueOrBlank(page,'tiddlertags')),1)\
		.replace('<viewButton>',viewButton,1)\
		.replace('<viewPrior>',viewPrior,1)\
		.replace('<showByline>',showByline,1)\
		.replace('<foldIndex>',foldIndex,1)\
		.replace('<servertype>',os.environ['SERVER_SOFTWARE'],1)\
		.replace('<isAdmin>','true' if users.is_current_user_admin() else 'false',1)\
		.replace('<loginName>',loginName,1)\
		.replace('<pageOwner>',jsEncodeStr(owner),1)\
		.replace('<access>',yourAccess,1)\
		.replace('<anonAccess>',anonAccess,1)\
		.replace('<authAccess>',authAccess,1)\
		.replace('<groupAccess>',groupAccess,1)\
		.replace('<userGroups>',jsEncodeStr(userGroups),1)\
		.replace('<clientIP>',self.request.remote_addr,1)\
		.replace('<deprecatedCount>', str(deprecatedCount),1)\
		.replace('<allWarnings>',jsEncodeStr(warnings),1)\
		.replace('<noSuchTiddlers>',jsEncodeStr('\n'.join(nsts)),1)\
		.replace('<siblingPages>', ',\n'.join(pages),1)\
		.replace('<pageAttributes>', ','.join(apat),1)\
		.replace('<timestamp>', unicode(datetime.datetime.now()),1)) # time.strftime("%Y-%m-%d-%H:%M:%S"),1))
	if isLoggedIn:
		upr = UserProfile.all().filter('user',user).get() # my profile
		if upr == None:
			upr = UserProfile(txtUserName = user.nickname()) # my null profile
		else:
			upr.txtUserName == user.nickname()
	else:
		upr = UserProfile(txtUserName='IP \t' + self.request.remote_addr) # anon null profile
		
	optlist = []
	for (fn,ft) in upr._properties.iteritems():
		try:
			fv = getattr(upr,fn)
			if fv != None:
				if type(getattr(UserProfile,fn)) == db.BooleanProperty:
					fv = 'true' if fv else 'false'
				else:
					fv = jsEncodeStr(fv)
				if isNameAnOption(fn):
					self.AppendConfigOption(optlist,fn, fv)
		except Exception,ex:
			logging.warn("Cannot get attribute " + fn + " for " + upr.txtUserName)

	for (fn,ft) in upr._dynamic_properties.iteritems():
		fv = getattr(upr,fn)
		if fv != None:
			if fn.startswith('chk'):
				fv = 'true' if fv else 'false'
			else:
				fv = jsEncodeStr(fv)
			if isNameAnOption(fn):
				self.AppendConfigOption(optlist,fn, fv)

	if isLoggedIn and not 'txtUserName' in self.configOptions:
		self.AppendConfigOption(optlist,'txtUserName',jsEncodeStr(user.nickname()))

	self.response.out.write(',\n\t\t'.join(optlist))
	self.response.out.write('\n\t}\n};\n')

	self.response.out.write('http._init(["')
	self.response.out.write('","'.join(HttpMethods.split('\n')))
	self.response.out.write('"]);')

############################################################################
	
application = webapp.WSGIApplication( [('/.*', MainPage)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
