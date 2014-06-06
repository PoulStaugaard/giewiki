import cgi
import uuid
import urllib
import xml.sax.saxutils
import datetime

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import urlfetch 

class SiteInfo(db.Model):
  title = db.StringProperty()
  description = db.StringProperty()
  language = db.StringProperty()

class Page(db.Model):
  path = db.StringProperty()
  title = db.StringProperty()
  subtitle = db.StringProperty()

class Tiddler(db.Model):
  title = db.StringProperty()
  page = db.StringProperty()
  author = db.UserProperty()
  version = db.IntegerProperty()
  current = db.BooleanProperty()
  public = db.BooleanProperty()
  text = db.TextProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  modified = db.DateTimeProperty(auto_now_add=True)
  tags = db.StringProperty()
  id = db.StringProperty()
  comments = db.IntegerProperty(0)
  messages = db.StringProperty()
  notes = db.StringProperty()

class MainRss(webapp.RequestHandler):
  def get(self):
	ignore = ['SiteTitle','SiteSubtitle','MainMenu','GettingStarted']
	si = SiteInfo.all().get()
	if si == None:
		si = SiteInfo()
		tnr = Page.all().filter("path = ", '/').get()
		if tnr != None:
			si.title = tnr.title
			si.description = tnr.subtitle
			si.language = "en"
			
	tq = Tiddler.all().filter("public",True).filter("current",True)
		
	ts = tq.order("-modified").fetch(10 + len(ignore))
	authors = dict()
	for t in ts:
		if t.author != None:
			authors[t.author.nickname()] = t.modified

	if len(authors) > 0:
		pdate = max(authors.itervalues())
		copyright = ', '.join(authors.keys())
	else:
		copyright = ""
		pdate = datetime.datetime.now()
			
	#for au,mt in authors.iteritems():
	#	if pdate == None or pdate < mt:
	#		pdate = mt
	#	if copyright != "":
	#		copyright = copyright + ", "
	#	copyright = copyright + au.nickname()
	#	if pdate < aux[0]:
	#		pdate = aux[0]
	#if pdate == None:
		
	copyright = "Copyright " + pdate.strftime("%Y") + " " + copyright
	
	self.response.headers['Content-Type'] = 'application/rss+xml'
	self.response.headers['Cache-Control'] = 'no-cache'
	self.response.out.write('\
<?xml version="1.0"?>\
<rss version="2.0">\
<channel>\
<title>' + xml.sax.saxutils.escape(si.title) + '</title>\
<link>' + self.tiddlerUrl(None) + '</link>\
<description>' + xml.sax.saxutils.escape(si.description) + '</description>\
<language>si.language</language>\
<copyright>' + copyright + '</copyright>\
<pubDate>' + pdate.strftime("%Y-%m-%d") + '</pubDate>\
<lastBuildDate>' + pdate.strftime("%Y-%m-%d") + '</lastBuildDate>\
<docs>http://blogs.law.harvard.edu/tech/rss</docs>\
<generator>giewiki 1.15.2</generator>')

	for t in ts:
		if not t.title in ignore:
			self.response.out.write('\
<item>\
  <title>' + xml.sax.saxutils.escape(t.title) + '</title>\
  <link>' + self.tiddlerUrl(t) + '</link>\
  <description>' + xml.sax.saxutils.escape(t.text) + '</description>\
  <pubDate>' + xml.sax.saxutils.escape(t.modified.strftime("%Y-%m-%dT%H:%M:%S")) + '</pubDate>\
  <guid>' + self.tiddlerUrl(t) + '</guid>\
</item>')
	self.response.out.write('\
 </channel>\
</rss>')

  def tiddlerUrl(self, tdlr):
	urlp = self.request.url.split('/')
	urlr = urlp[0] + "//" + urlp[2]
	if tdlr == None:
		return urlr + "/"
	return urlr + tdlr.page + "#" + self.encodeTiddlyLink(tdlr.title)
	
  def encodeTiddlyLink(self, tl):
	try:
		if tl.find(' ') == -1:
			return urllib.quote(tl)
		return urllib.quote('[[' + tl + ']]')
	except KeyError:
		return ""
		
application = webapp.WSGIApplication( [('/index.xml', MainRss)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
