import cgi
import os.path

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import memcache

class MainJs(webapp.RequestHandler):
  def get(self):
	path = self.request.path
	epos = path.rfind('/')
	p = path[len('/dynamic/js'):epos]
	if p == '':
		p = '/'
	s = path[epos + 1:]
	d = memcache.get(p)
	if d != None:
		self.response.headers.add_header('Content-Type','application/x-javascript')
		self.response.out.write(d[s])
	else:
		self.response.set_status(404)

class MainXsl(webapp.RequestHandler):
  def get(self):
	d = memcache.get(self.request.get('path'))
	ftwd = open('iewiki.xsl')
	text = ftwd.read()
	ftwd.close()
	
	self.response.headers.add_header('Content-Type','text/xsl');
	if d != None:
		incls = []
		for (k,v) in d.iteritems():
			p = self.request.get('path')
			if p[-1:] != '/':
				p += '/'
			incls.append('<script src="/dynamic/js' + p + k + '" type="text/javascript"></script>')
		self.response.out.write(text.replace('<script src="/static/iewiki.js" type="text/javascript"></script>', '<script src="/static/iewiki.js" type="text/javascript"></script>\n' + '\n'.join(incls)))
	else:
		self.response.out.write(text);


application = webapp.WSGIApplication( [('/dynamic/iewiki-xsl', MainXsl), ('/dynamic/js/.*', MainJs)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
