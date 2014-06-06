import cgi
import re

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db

from giewikidb import Tiddler,TagLink,SiteInfo,ShadowTiddler,EditLock,Page,MCPage,PageTemplate,DeletionLog,Comment,Include,Note,Message,Group,GroupMember,UrlImport,UploadedFile,UserProfile,PenName,SubDomain,LogEntry,CronJob
from giewikidb import truncateModel, truncateAllData, HasGroupAccess, ReadAccessToPage, AccessToPage, IsSoleOwner, Upgrade, CopyIntoNamespace, dropCronJob, noSuchTiddlers

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
	return mx.finditer(str(a))

def tagStringToList(tags):
	ts = []
	for am in paramParser(tags):
		ts.append(parseToken(am, 1))
	return ts

def addTagLinks(tlr,taglist):
	n = 0
	for atg in taglist:
		if TagLink.all().filter('tag',atg).filter('tlr',tlr.id).get() == None:
			ntl = TagLink()
			ntl.tag = atg
			ntl.tlr = tlr.id
			ntl.put()
			n = n + 1
	return n

class BuildTagIndex(webapp.RequestHandler):
  def get(self):
	nt = 0
	log = []
	for tid in Tiddler.all().filter("current", True):
		if not (tid.tags is None):
			nt = nt + addTagLinks(tid,tagStringToList(tid.tags))
	self.response.out.write(str(nt) + " tags found..")

application = webapp.WSGIApplication( [('/build_tag_index', BuildTagIndex)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
