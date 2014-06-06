from google.appengine.ext import db
from giewikidb import Tiddler

class Hello(Tiddler):
  name = db.StringProperty()
  # address = db.StringProperty()
  def public(self,page):
	self.name = page.request.get('name')
	self.put()
	page.reply( {"Message": "Good morning, " + page.request.get('name'), "Success": False})
