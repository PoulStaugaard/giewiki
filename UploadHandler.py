# this:  UploadHandler.py
# by:    Poul Staugaard [poul(dot)staugaard(at)gmail...]
# URL:   http://code.google.com/p/giewiki
# ver.:  1.18.3

import logging
import codecs
from google.appengine.api import users
from google.appengine.api import memcache
from google.appengine.api import namespace_manager
from google.appengine.ext import webapp
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers

from giewikidb import UploadedFile,Page,UrlImport,SubDomain

def CombinePath(path,fn):
	if path.rfind('/') != len(path) - 1:
		path = path + '/'
	return path + fn

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

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
  def post(self):
	self.getSubdomain()
	for (a,v) in self.request.POST.items():
		logging.info("UploadH(" + str(a) + ")" + str(v))
	upload_files = self.get_uploads()
	replace = False
	for blob_info in upload_files:
		reqpath = self.request.get('path')
		filename = self.request.get('filename')
		if self.request.get('method') == 'uploadTiddlers':
			url = 'file:' + reqpath + '/' + filename
			logging.info("Uploaded url: " + reqpath + '/' + filename)
			urlimport = UrlImport().all().filter('url',url).get()
			if urlimport == None:
				urlimport = UrlImport()
				urlimport.url = url
			urlimport.blob = blob_info.key()
			urlimport.put()
			self.response.out.write(
'<html>'
'<header><title>Upload succeeded</title>'
'<script>'
'function main() { \n'
'    act = "onUploadTiddlers(' + "'" + url + "'" + ')";'
'    window.parent.setTimeout(act,100);\n'
'}\n'
'</script></header>'
'<body style="margin: 0 0 0 0; text-align: center; font-family: Arial" onload="main()">'
'<center><a href="/">success..</a></center>'
'</body>'
'</html>')
		else:
			f = UploadedFile()
			f.owner = users.get_current_user()
			logging.info("Uploaded " + filename)
			p = filename if filename[0] == '/' else CombinePath(reqpath, filename)
			logging.info('Uploaded ' + p)
			f.path = p
			f.mimetype = blob_info.content_type
			f.blob = blob_info.key()
			ef = UploadedFile.all().filter('path',p).get()
			if ef != None:
				if replace == False:
					msg = p + "&lt;br&gt;is an already existing file - &lt;&lt;confirm_replace " + p + "&gt;&gt;";
					f.msg = msg
					memcache.set(p,f,300)
				elif f.owner != ef.owner and not users.is_current_user_admin():
					msg = "Not allowed"
				else:
					ef.data = f.data
					ef.put()
					msg = p + " replaced"
			elif Page.all().filter("path",p).get():
				msg = p + "&lt;br&gt;is an existing page URL. Pick a different name."
			else:
				msg = ""
				f.put()
			ftwd = codecs.open( 'UploadDialog.htm', 'r', 'utf-8' ) # open('UploadDialog.htm')
			uplurl = blobstore.create_upload_url('/upload')
			text = unicode(ftwd.read()).replace('<uploadHandler>', unicode(uplurl), 1)
			text = text.replace("<requestPath>",reqpath);
			text = text.replace("UFL",unicode(p))
			text = text.replace("UFT",unicode(f.mimetype))
			text = text.replace("ULR",u"Uploaded:")
			text = text.replace("UFM",unicode(msg))
			ftwd.close()
			self.response.out.write(text)
		break

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
		logging.info("Upload to subdomain " + self.subdomain)
	else:
		self.subdomain = None

application = webapp.WSGIApplication([('/upload', UploadHandler)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
