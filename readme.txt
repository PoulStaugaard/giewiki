This is (or was) giewiki release 1.18.2.

Starting point:
	http://giewiki.appspot.com

Changes in release 1.18.2:
	* Bugfix release: 'delete prior versions' and BuildIndex were still calling the old index.remove(), not index.delete().
	  Also, the datastore link was wrong in hosted operation.

Changes in release 1.18.0:
	* Uses blobstore for uploaded files allowing files larger than 1MB to be uploaded.
	* Fixes an incompatibility with App Engine SDK 1.7.7.

Changes in release 1.17.2:
	* This is a bugfix release: Trying to import tiddlers from libraries would fail if the '#' character was used in a tiddler title.

Changes in release 1.17.1:
	* This version has minor changes to adapt to changes in the Google App Engine search library.
	* A new macro, smugFeed, allows users of the SmugMug photo hosting site to present a random image or a sequence of images
	  to be presented, as defined by either of the RSS feeds that SmugMug makes available. The syntax is
	  <<smugFeed rssurl width interval>>
	  where width and interval are optional:
	  width defaults to 100% (of the containing column width)
	  interval is taken to be a number of seconds; if provided, the image is replaced with another random image from the same feed
	  at the specified interval.

New features in release in 1.17:
	* This version introduces Full-text search using the new search feature of App Engine 1.7, which is only supported when using the
	  High-replication data store. Tiddlers are indexed only if they are public, ie. on a page that offers at least read access to anonymous users.
	  All user-defined attributes of a tiddler are searchable, either across the entire site or (when folders are used) within a area. An
	  AdvancedSearch dialog allows searches to match specific attributes only.
	* Additions to the PageProperties dialog are now possible, allowing custom fields to be defined on the page object. These are available as
	  content using the new <<page fieldname>>.
	* The '?highlight=text' syntax can be used to hightlight a specific text, via URL's like /Wonderland?highlight=Alice#%5B%5BFind%20Me%5D%5D
	  and using pretty-links like [[Find Alice|Find Me?highlight=Alice]].

Changes in 1.16.3:
	Tiddlers are now displayed with a triangular button left of the title, that allows the user to collapse it to show only the title.
	The custom field space may now be set to eg. wideArea (in stead of tiddlerDisplay), causing the tiddler to be rendered above both
	the middle and right colums.
	Beware that several special tiddlers (ViewTemplate, EditTemplate, PageTemplate, StyleSheetLayout)  have changed in an
	inter-dependant way, which could cause odd behavior if you have changed any of them.

Changes in 1.16.1:
	* <<input type name ..>> changed to <<input name type ..>> for consistency & interop with: <<edit name type ..>>
	* New: macro <<if "condition" other-macro>>
	* New: advanced option chkListPrevious: "List previous version(s) of tiddlers you just edited" (defaults to true)
	* Fix: Multi-line custom fields
	* Fix: Unicode in tiddler title

New features in release 1.16:
	* The attribute tag tiddlerTemplate marks a tiddler as template for editing or viewing tiddlers.
	  A new macro <<tiwinate>>, used in EditingMenu lets you easily subclass the existing EditTemplate and ViewTemplate tiddlers 
	  by defining (copy via page setup - All..) derivatives named e.g. thingEditTemplate and thingEditTemplate. This will produce
	  a new entry in the edit sidebar labeled (in this case) "new thing".
	* When you have a tiddler tagged tiddlerTemplate, a link pattern of the form templateName/tiddlerName will render tiddlerName
	  using templateName as the HTML template.
	* You can now paste a tiddler on the same page as where you did the copy (via the editing menu). This will produce a copy where
	  the title is derived by prepending a '_'.
 
New features in release 1.15:
	* Site-wide tag links, retrieved via the 'tags' caption.
	* User-defined template for the auto-generated mails.
	* New option to Auto-save changes while editing.
	* Allow custom revision history via the ViewTemplate.
	* On demand-loading macro's assuming tiddler title = '<macro-name> macro'.
	* Lazy-load tiddler attribute for generel load-on-demand.
	* "requires" attribute for systemConfig tiddlers.
	* Admin now has direct DataStore link to http://appengine.google.com.
	* NoAccessMessage, a special tiddler, which prompts the user to log in if he doesn't have (anonymous) read-access to the page. 
	  It's therefore listed in stead of the defined DefaultTiddlers in such case.

New in 1.15.8:
	* Tiddler fields can now be added, edited & deleted (by clearing the value) via a dialog available to admins through the 'fields' popup.
	  This allows selecting an alternative "viewtemplate" and/or "edittemplate" for a tiddler, or defining the "requires" attribute of a systemConfig tiddler.
	* When Moving a page to a different URL, you now have the option to set up a redirect of the current URL to the new.
	* Whether to show the tiddler byline in read-only mode is now a page property.

Additional resources:
	http://code.google.com/p/giewiki

Feedback:
	http://giewiki.appspot.com/FeedBack
	poul.staugaard@gmail.com

Enjoy!