# this:	every_hour.py
# by:	Poul Staugaard (poul(dot)staugaard(at)gmail...)
# URL:	http://code.google.com/p/giewiki
# ver.:	1.13

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
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.api import mail
from google.appengine.api import namespace_manager

from giewikidb import Tiddler,SiteInfo,ShadowTiddler,EditLock,Page,PageTemplate,DeletionLog,Comment,Include,Note,Message,Group,GroupMember,UrlImport,UploadedFile,UserProfile,PenName,SubDomain,LogEntry,CronJob
from giewikidb import truncateModel, truncateAllData, HasGroupAccess, ReadAccessToPage, AccessToPage, IsSoleOwner, Upgrade, CopyIntoNamespace, dropCronJob

class EveryHour(webapp.RequestHandler):
  def get(self):
	for cj in CronJob.all():
		if cj.when < datetime.datetime.now():
			tdlr = Tiddler.all().filter('id',cj.tiddler).filter('current',True).get()
			if tdlr is None:
				logging.warning("Tiddler not found")
			else:
				if cj.action == 'promote':
					logging.info("CJob:promote " + cj.tiddler)
					if hasattr(tdlr,'deprecated'):
						delattr(tdlr,'deprecated')
					tdlr.tags = tdlr.tags.replace('@promote@','@promoted@')
					tdlr.put()
					dts = Tiddler.all().filter('page', tdlr.page).filter('title','DefaultTiddlers').filter('current', True).get()
					if dts is None:
						logging.warning("DefaultTiddlers not found for page " + tdlr.page)
					else:
						dtparts = dts.text.split('\n')
						dtparts.insert(cj.position,'[[' + tdlr.title + ']]')
						dts.text = '\n'.join(dtparts)
						dts.put()
						logging.info("Tiddler " + tdlr.title + " added to DefaultTiddlers") 
				if cj.action == 'announce':
					logging.info("CJob/announce " + cj.tiddler)
					if hasattr(tdlr,'deprecated'):
						delattr(tdlr,'deprecated')
					tdlr.tags = tdlr.tags.replace('@announce@','@announced@')
					tdlr.put()
					dts = Tiddler.all().filter('page', tdlr.page).filter('title','MainMenu').filter('current', True).get()
					if dts is None:
						logging.warning("MainMenu not found for page " + tdlr.page)
					else:
						dtparts = dts.text.split('\n')
						dtparts.insert(cj.position,'[[' + tdlr.title + ']]')
						dts.text = '\n'.join(dtparts)
						dts.put()
						logging.info("Tiddler " + tdlr.title + " added to MainMenu") 
				if cj.action == 'demote' or cj.action == 'deprecate':
					logging.info("CJob:demote " + cj.tiddler)
					dts = Tiddler.all().filter('page', tdlr.page).filter('title','DefaultTiddlers').filter('current', True).get()
					if not dts is None:
						ss = '[[' + tdlr.title + ']]\n'
						dts.text = dts.text.replace(ss,'')
						dts.put()
					dts = Tiddler.all().filter('page', tdlr.page).filter('title','MainMenu').filter('current', True).get()
					if not dts is None:
						ss = '[[' + tdlr.title + ']]\n'
						dts.text = dts.text.replace(ss,'')
						dts.put()
				if cj.action == 'deprecate':
					logging.info("CJob:deprecate " + cj.tiddler)
					setattr(tdlr,'deprecated',True)
					tdlr.put()
				if cj.action == 'revert':
					logging.info("CJob: revert " + str(cj.tiddler) + " to V#" + str(cj.position))
					rvn = cj.position if cj.position > 0 else tdlr.version - 1
					tdlrvr = Tiddler.all().filter('id',cj.tiddler).filter('version',rvn).get()
					if tdlrvr is None:
						logging.warning("Version " + str(rvn) + " of tiddler " + tdlr.page + "#" + tdlr.title + " not found!")
					else:
						tdlr.current = False
						tdlr.put()
						tdlrvr.current = True
						tdlrvr.vercnt = tdlr.vercnt
						tdlrvr.reverted = datetime.datetime.now()
						tdlrvr.reverted_by = None
						tdlrvr.put()

			cj.delete()

application = webapp.WSGIApplication( [('/every_1_hours', EveryHour)], debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
