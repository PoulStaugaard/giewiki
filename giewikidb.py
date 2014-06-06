# this: giewikidb.py
# by:   Poul Staugaard (poul(dot)staugaard(at)gmail...)
# URL:  http://code.google.com/p/giewiki
# ver.: 1.18.0

import logging
import datetime

from google.appengine.ext import db
from google.appengine.ext import blobstore
from google.appengine.api import users
from google.appengine.api import namespace_manager

class Tiddler(db.Expando):
  "Unit of text storage"
  title = db.StringProperty()
  page = db.StringProperty()
  author = db.UserProperty()
  author_ip = db.StringProperty()
  version = db.IntegerProperty()
  vercnt = db.IntegerProperty()
  current = db.BooleanProperty()
  public = db.BooleanProperty()
  locked = db.BooleanProperty()
  text = db.TextProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  modified = db.DateTimeProperty(auto_now_add=True)
  reverted = db.DateTimeProperty()
  reverted_by = db.UserProperty()
  tags = db.StringProperty()
  id = db.StringProperty()
  comments = db.IntegerProperty(0)
  messages = db.StringProperty()
  notes = db.StringProperty()
  def todict(s,d):
	d['title'] = s.title
	d['page'] = s.page
	d['author'] = s.author
	d['author_ip'] = s.author_ip
	d['version'] = s.version
	d['current'] = s.current
	d['public'] = s.public
	d['locked'] = s.locked
	d['text'] = s.text
	d['created'] = s.created
	d['modified'] = s.modified
	d['reverted'] = s.reverted
	d['tags'] = s.tags
	d['id'] = s.id
	d['comments'] = s.comments
	d['messages'] = s.messages
	d['notes'] = s.notes
  def versionCount(self):
	if hasattr(self,'vercnt') and self.vercnt != None:
		return self.vercnt
	else:
		return Tiddler.all(keys_only=True).filter('id',self.id).count()

class TagLink(db.Model):
  tag = db.StringProperty()
  tlr = db.StringProperty()

class SiteInfo(db.Model):
  title = db.StringProperty()
  description = db.StringProperty()
  def todict(s,d):
	d['title'] = s.title
	d['description'] = s.description
	
class ShadowTiddler(db.Model):
  tiddler = db.ReferenceProperty(Tiddler)
  path = db.StringProperty()
  id = db.StringProperty()
  def todict(s,d):
	d['path'] = s.path
	d['id'] = s.id
	
class EditLock(db.Model):
  id = db.StringProperty(Tiddler)
  user = db.UserProperty()
  user_ip = db.StringProperty()
  time = db.DateTimeProperty(auto_now_add=True)
  duration = db.IntegerProperty()

class PageTemplate(db.Model):
  page = db.StringProperty()
  text = db.TextProperty()
  title = db.StringProperty()
  tiddlertags = db.StringProperty()
  updated = db.DateTimeProperty(auto_now_add=True)
  version = db.IntegerProperty()
  current = db.BooleanProperty()
  scripts = db.StringProperty()
  include = db.BooleanProperty()

noSuchTiddlers = 'noSuchTiddlers'

class Page(db.Expando):
  NoAccess = 0
  ViewAccess = 2
  CommentAccess = 4
  AddAccess = 6
  EditAccess = 8
  AllAccess = 10
  access = { "all":10, "edit":8, "add":6, "tag":5, "comment":4, "view":2, "none":0,
			 10:"all", 8:"edit", 6:"add", 5:"tag", 4:"comment", 2:"view", 0:"none" }
	
  path = db.StringProperty()
  sub = db.StringProperty()
  owner = db.UserProperty()
  ownername = db.StringProperty()
  title = db.StringProperty()
  titleModified = db.DateTimeProperty()
  subtitle = db.StringProperty()
  subtitleModified = db.DateTimeProperty()
  tags = db.StringProperty()
  tiddlertags = db.StringProperty()
  locked = db.BooleanProperty()
  anonAccess = db.IntegerProperty()
  authAccess = db.IntegerProperty()
  groupAccess = db.IntegerProperty()
  groups = db.StringProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  modified = db.DateTimeProperty(auto_now_add=True)
  systemInclude = db.TextProperty()
  gwversion = db.StringProperty()
  viewbutton = db.BooleanProperty()
  viewprior = db.BooleanProperty()
  foldIndex = db.BooleanProperty()
  showByline = db.BooleanProperty()
  template = db.ReferenceProperty(PageTemplate)
  scripts = db.StringProperty()
  noSuchTiddlers = db.TextProperty()
  def todict(s,d):
	d['path'] = s.path
	d['owner'] = s.owner
	d['title'] = s.title
	d['subtitle'] = s.subtitle
	d['tags'] = s.tags
	d['tiddlertags'] = s.tiddlertags
	d['locked'] = s.locked
	d['anonAccess'] = s.anonAccess
	d['authAccess'] = s.authAccess
	d['groupAccess'] = s.groupAccess
	d['groups'] = s.groups
	d['created'] = s.created
	d['modified'] = s.modified
	d['systemInclude'] = s.systemInclude
	d['gwversion'] = s.gwversion
	d['viewbutton'] = s.viewbutton
	d['viewprior'] = s.viewprior
	if s.template != None:
		d['template'] = s.template.page.path

  def Update(self,tiddler):
	if tiddler.title == "SiteTitle":
		self.title = tiddler.text
		self.titleModified = tiddler.modified
		put = True
	elif tiddler.title == "SiteSubtitle":
		self.subtitle = tiddler.text
		self.subtitleModified = tiddler.modified
		put = True
	else:
		put = False
	nctl = self.NoSuchTiddlersOfPage()
	if tiddler.title in nctl:
		nctl.remove(tiddler.title)
		self.noSuchTiddlers = None if len(nctl) == 0 else '\n'.join(nctl)
		put = True
	if put:
		self.put()
  
  def UpdateViolation(self):
	if users.get_current_user() == None and self.anonAccess < 6:
		return "You cannot change this page"
	if users.get_current_user() != self.owner and self.authAccess < 6 and (self.groupAccess < 6 or HasGroupAccess(self.groups,userWho()) == False):
		return "Edit access is restricted"
	return None

  def NoSuchTiddlersOfPage(self,clear=False):
	if hasattr(self,noSuchTiddlers):
		if clear:
			self.noSuchTiddlers = ''
			self.put()
			return []
		else:
			nsts = self.noSuchTiddlers
			return [] if nsts is None else nsts.split('\n')
	else:
		return []

class MCPage():
  page = None
  lazyLoadAll = dict()
  lazyLoadTags = dict()
  lazyLoadSpecial = []
  deprecatedCount = 0

class DeletionLog(db.Model):
	page = db.StringProperty()
	tiddler = db.ReferenceProperty(Tiddler)
	deletedAt = db.DateTimeProperty(auto_now_add=True)
	fingerprint = db.StringProperty()
	deletedByUser = db.UserProperty()
	deletionComment = db.StringProperty()
	def Log(self, tiddler,fingerprint,comment):
		self.page = tiddler.page
		self.tiddler = tiddler
		self.fingerprint = fingerprint
		self.deletedByUser = users.get_current_user()
		self.deletionComment = comment
		self.put()

class Comment(db.Model):
  tiddler = db.StringProperty()
  version = db.IntegerProperty()
  text = db.TextProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  author = db.UserProperty()
  ref = db.StringProperty()
  def todict(s,d):
	d['tiddler'] = s.tiddler
	d['version'] = s.version
	d['text'] = s.text
	d['created'] = s.created
	d['author'] = s.author
	d['ref'] = s.ref
	
class Include(db.Model):
  page = db.StringProperty()
  id = db.StringProperty()
  version = db.IntegerProperty()
  @staticmethod
  def Unique(apage,aid):
	"Finds or creates instance"
	ev = Include.all().filter("page =", apage).filter("id =",aid).get()
	if ev == None:
		return Include(page = apage, id = aid)
	return ev

class Note(Comment):
  revision = db.IntegerProperty()
  def todict(s,d):
	Comment.todict(s,d)
	d['revision'] = s.revision
  
class Message(Comment):
  receiver = db.UserProperty()
  def todict(s,d):
	Comment.todict(s,d)
	d['receiver'] = s.receiver

class Group(db.Model):
  name = db.StringProperty()
  admin = db.UserProperty()
  def todict(s,d):
	d['name'] = s.name
	d['admin'] = s.admin
		
class GroupMember(db.Model):
  name = db.StringProperty()
  group = db.StringProperty()
  def todict(s,d):
	d['name'] = s.name
	d['group'] = s.group

class UrlImport(db.Model):
  url = db.StringProperty()
  data = db.BlobProperty()
  blob = blobstore.BlobReferenceProperty()

class UploadedFile(db.Model):
  owner = db.UserProperty()
  path = db.StringProperty()
  mimetype = db.StringProperty()
  data = db.BlobProperty() # not used but for pre-existing files
  date = db.DateTimeProperty(auto_now_add=True)
  blob =  blobstore.BlobReferenceProperty()

  msg = "" # piggybacked data

class UserProfile(db.Expando):
  user = db.UserProperty()
  aboutme = db.TextProperty("")
  tiddler = db.StringProperty("")
  projects = db.StringProperty("")
  tmsg_subject = db.StringProperty()
  tmsg_body = db.StringProperty(multiline=True)
  txtUserName = db.StringProperty() # penname, using TW's term
  clipTiddler = db.ReferenceProperty(Tiddler)
  clipDomain = db.StringProperty("")

  def Projects(self,sub):
	if sub != None:
		namespace_manager.set_namespace(None)
		rootUser = UserProfile.all().filter('user',users.get_current_user()).get()
		if rootUser != None:
			return rootUser.projects
	return '' if self.projects is None else self.projects # should be blank...

class PenName(db.Model):
  penname = db.StringProperty()
  user = db.ReferenceProperty(UserProfile)

class SubDomain(db.Expando):
  preurl = db.StringProperty()
  ownerprofile = db.ReferenceProperty(UserProfile)
  owneruser = db.UserProperty()
  public = db.BooleanProperty()
  version = db.StringProperty()

class LogEntry(db.Model):
	when = db.DateTimeProperty(auto_now_add=True)
	what = db.StringProperty()
	text = db.TextProperty()

class CronJob(db.Model):
	when = db.DateTimeProperty()
	tiddler = db.StringProperty()
	action = db.StringProperty()
	position = db.IntegerProperty()

	def save(self,tiddler):
		self.tiddler = tiddler.id
		self.put()

class SearchHistory(db.Model):
	when = db.DateTimeProperty(auto_now_add=True)
	what = db.StringProperty()
	who = db.UserProperty()
	scope = db.StringProperty()
	limit = db.IntegerProperty()
	found = db.IntegerProperty()
	time = db.IntegerProperty()

class IndexQueue(db.Model):
	tiddler = db.ReferenceProperty(Tiddler)

def dropCronJob(tiddler):
	for cj in CronJob.all().filter('tiddler',tiddler.id):
		cj.delete()

def truncateModel(m):
	while m.all().get() != None:
		db.delete(m.all())

def truncateAllData():
	truncateModel(Message)
	truncateModel(Note)
	truncateModel(Comment)
	truncateModel(Include)
	truncateModel(EditLock)
	truncateModel(Page)
	truncateModel(ShadowTiddler)
	truncateModel(Tiddler)
	truncateModel(UploadedFile)
	truncateModel(LogEntry)
	
def userWho():
	u = users.get_current_user()
	if (u):
		return u.nickname()
	else:
		return ""

def HasGroupAccess(grps,user):
	if grps != None:
		for ga in grps.split(","):
			if GroupMember.all().filter("group =",ga).filter("name =",user).get():
				return True
	return False
	
def ReadAccessToPage( page, user = None):
	if user == None:
		user = users.get_current_user()
	if page == None:
		# logging.info("ReadAccessToPage: page == None")
		return False

	if page.__class__ in (unicode, str):
		page = Page.all().filter('path',page).get()
	if page == None: # Un-cataloged page - restricted access
		# if not users.is_current_user_admin():
		#	logging.info("ReadAccessToPage: no such page and not admin")
		return users.is_current_user_admin()
	if page.anonAccess >= page.ViewAccess: # anyone can see it
		return True
	if user != None:
		if page.authAccess >= page.ViewAccess: # authenticated users have access
			return True
		if page.owner == user: # owner has access, of course
			return True
		if page.groupAccess >= page.ViewAccess and HasGroupAccess(page.groups,user.nickname()):
			return True
		# logging.info("ReadAccessToPage: User " + user.nickname() + " has only " + str(page.authAccess) + " access")
	#else:
	#	logging.info("ReadAccessToPage: No anon access");
	return False

def AccessToPage( page, user):
	if page.__class__ == unicode:
		page = Page.all().filter('path',page).get()
	if page == None: # Un-cataloged page - restricted access
		return 'admin' if users.is_current_user_admin() else 'none'
	if page.owner == user or users.is_current_user_admin():
		return 'admin'
	if user != None:
		access = page.groupAccess if HasGroupAccess(page.groups,user.nickname()) else page.authAccess
	else:
		access = page.anonAccess
	return Page.access[access]

def IsSoleOwner(tid,user):
	for tv in Tiddler.all().filter('id',tid):
		if not tv.author == user:
			return False
	return True

def CopyIntoNamespace(e,ns):
	namespace_manager.set_namespace(ns)
	np = e.__class__()
	for aen,aep in e.__dict__['_entity'].iteritems():
		av = getattr(e,aen)
		setattr(np,aen,av)
	np.put()
	return np

def upgradePage(p,version):
	if hasattr(p,'tags') == False:
		setattr(p,'tags', '')
		setattr(p,'template',None)
	if hasattr(p,'sub') and p.sub != None:
		logging.info("CopyIntoNamespace " + p.path + " > " + p.sub)
		np = CopyIntoNamespace(p,p.sub)
		setattr(np,'gwversion',version)
		np.put()
		p.delete()
	else:
		logging.info('upgradePage ' + p.path + ' v.' + version)
		setattr(p,'gwversion',version)
		p.put()

def upgradeSub(p,version):
	if hasattr(p,'sub') and p.sub != None:
		CopyIntoNamespace(p,p.sub)
		p.delete()
		
def Upgrade(mainPage, version):
	sdo = mainPage.sdo
	if mainPage.subdomain != None and sdo != None and sdo.preurl != None and (not hasattr(sdo,"version") or sdo.version < '2.7'):
		UpgradeTable(Page,upgradePage,version,mainPage)
		UpgradeTable(Tiddler,upgradeSub,version,mainPage)
		UpgradeTable(UploadedFile,upgradeSub,version,mainPage)
		namespace_manager.set_namespace(mainPage.subdomain)
		return "DataStore of Project " + str(sdo.preurl) + " was upgraded to version " + str(version)
	else:
		return ""

def UpgradeTable(c,f,v,mp):
	cursor = None
	repeat = True
	while repeat:
		logging.info("Setting ns None: " + ("old" if not hasattr(mp.sdo,"version") else str(mp.sdo.version) ))
		namespace_manager.set_namespace(None)
		ts = c.all()
		if cursor != None:
			ts.with_cursor(cursor)
		n = 0
		for t in ts.fetch(1000):
			f(t,v)
			n = n + 1
		if n < 1000:
			repeat = False
		else:
			cursor = ts.cursor()

