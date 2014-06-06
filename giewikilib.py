# this:	giewikilib.py
# by:	Poul Staugaard
# URL:	http://code.google.com/p/giewiki
# ver.:	1.4

import logging
import xml.dom.minidom
import datetime
import difflib
import re
from google.appengine.api import mail

from Tiddler import *

class MyError(Exception):
  def __init__(self, value):
	self.value = value
  def __str__(self):
	return repr(self.value)

def htmlEncode(s):
	return s.replace('"','&quot;').replace('<','&lt;').replace('>','&gt;').replace('\n','<br>')

def HtmlErrorMessage(msg):
	return "<html><body>" + htmlEncode(msg) + "</body></html>" 

def Filetype(filename):
	fp = filename.rsplit('.',1)
	if len(fp) == 1:
		return None
	else:
		return fp[1].lower()

def MimetypeFromFiletype(ft):
	if ft == "txt":
		return "text/plain"
	if ft == "htm" or ft == "html":
		return "text/html"
	if ft == "xml":
		return "text/xml"
	if ft == "jpg" or ft == "jpeg":
		return "image/jpeg"
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
	if (u):
		return u.nickname()
	else:
		return ""

def userNameOrAddress(u,a):
	if u != None:
		return u.nickname()
	else:
		return a
		
def NoneIsFalse(v):
	return False if v == None else v

def NoneIsBlank(v):
    return "" if v == None else str(v)

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

def initHist(shadowTitle):
	versions = '|When|Who|V#|Title|\n'
	if shadowTitle != None: # self.request.get("shadow") == '1':
		versions += "|>|Default content|<<diff 0 " + shadowTitle + '>>|<<revision "' + shadowTitle + '" 0>>|\n'
	return versions;
  
def getTiddlerVersions(xd,tid,startFrom):
	text = ""
	for tlr in Tiddler.all().filter('id', tid).order('version'):
		if text == "":
			text = initHist(tlr.title if startFrom == 0 else None);
		if tlr.version >= startFrom:
			modified = tlr.modified
			if hasattr(tlr,'reverted') and tlr.reverted != None:
				modified = tlr.reverted;
			text += '|' + BoldCurrent(tlr) + modified.strftime('%Y-%m-%d %H:%M') + BoldCurrent(tlr) \
				 + '|<<author "' + getAuthor(tlr) + '">>' \
				 + '|<<diff ' + str(tlr.version) + ' ' + tid + '>>' \
				 + '|<<revision "' + htmlEncode(tlr.title) + '" ' + str(tlr.version) + '>>|\n'
	eVersions = xd.createElement('versions')
	eVersions.appendChild(xd.createTextNode(text))
	return eVersions

def BoldCurrent(tlr):
	return "''" if tlr.current else ""
	
def deleteTiddlerVersion(tid,ver):
	tlv = Tiddler.all().filter('id', tid).filter('version',ver).get()
	if tlv != None:
		tlv.delete()
		logging.info("Deleted " + str(tid) + " version " + str(ver))
		return True
	else:
		return False
		
def getAuthor(t):
	if hasattr(t,'author_ip') and t.author_ip != None and re.match('\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}',t.author_ip) == None:
		return t.author_ip # It's not an IP address
	elif t.author != None:
		return str(t.author.nickname());
	elif t.author_ip != None:
		return str(t.author_ip)
	else:
		return "?"

def SendEmailNotification(comment,tls):
	if comment.receiver == None or users.get_current_user() == None:
		return False
	ru = UserProfile.all().filter('user', comment.receiver).get()
	if ru != None and hasattr(ru,'txtEmail'):
		rma = ru.txtEmail
	else:
		rma = comment.receiver.email()
	if mail.is_email_valid(rma):
		mail.send_mail(sender=users.get_current_user().email(),
				to=rma,
				subject=tls.title,
				body=comment.text)
		return True
	else:
		return False

def LogEvent(what,text):
	logging.info(what + ": " + text)

def exportTable(xd,xr,c,wnn,enn):
	tr = xd.createElement(wnn)
	xr.appendChild(tr)

	cursor = None
	repeat = True
	while repeat:
		ts = c.all()
		if cursor != None:
			ts.with_cursor(cursor)
		n = 0
		for t in ts.fetch(1000):
			d = dict()
			t.todict(d)
			te = xd.createElement(enn)
			tr.appendChild(te)
			for (tan,tav) in d.iteritems():
				if tav == None:
					continue
				tae = xd.createElement(tan)
				te.appendChild(tae)
				if tav.__class__ != unicode:
					tae.setAttribute('type',unicode(tav.__class__.__name__))
				tae.appendChild(xd.createTextNode(unicode(tav)))
			n = n + 1
		if n < 1000:
			repeat = False
		else:
			cursor = ts.cursor()
	
def mergeDict(td,ts):
	for t in ts:
		key = t.title
		if key in td:
			if t.version > td[key].version or t.id != td[key].id:
				td[key] = t
		else:
			td[key] = t

def isNameAnOption(name):
	return name.startswith('txt') or name.startswith('chk')

def jsEncodeStr(s):
	return '"' + str(s).replace('"','\\"').replace('\n','\\n').replace('\r','') + '"'
	
def getUserPenName(user):
	up = UserProfile.all().filter('user',user).get()
	return user.nickname() if up == None else up.txtUserName

def TiddlerFromXml(te,path):
	id = None
	try:
		title = te.getAttribute('title')
		if title != "":
			id = te.getAttribute('id')
			author_ip = te.getAttribute('modifier')
			tags = te.getAttribute('tags')
			v = te.getAttribute('version')
			version = eval(v) if v != None and v != "" else 1
		else:
			return None
	except Exception, x:
		print(str(x))
		return None
		
	nt = Tiddler(page = path, title = title, id = id, version = version, author_ip = author_ip)
	nt.current = True
	nt.tags = te.getAttribute('tags')
	nt.author = users.get_current_user()
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
		e = self.createElement(name);
		parent.appendChild(e);
		if attrs != None:
			for n,v in attrs.iteritems():
				e.setAttribute(n,str(v))
		if text != None:
			e.appendChild(self.createTextNode(unicode(text)))
		return e;
	def addArrayOfObjects(self,name,parent=None):
		if parent == None:
			parent = self
		return self.add(parent,name, attrs={'type':'object[]'})

class ImportException(Exception):
    def __init__(self,err):
        self.error = err
    def __str__(self):
	   return self.error