
config.macros.uploadFile = {
	onClick: function()
	{
		story.displayTiddler(null,"UploadDialog", DEFAULT_VIEW_TEMPLATE);
		return false;
	},
	handler: function(place)
	{
		if(!readOnly)
			createTiddlyButton(place,"upload file","Upload one or more files",this.onClick);
	}
}

config.macros.uploadDialog = {
	handler: function(place,macroName,params,wikifier,paramString,tiddler) 
	{
		createUploadFrame(place,"");
		createTiddlyElement(place,"DIV","displayUploadResult");
		createTiddlyElement(place,"DIV","displayUploads");
	}
}

function createUploadFrame(place, qs, id)
{
	var theFrame = document.createElement("IFRAME");
	var ts = new Date();
	theFrame.src = "/static/UploadDialog.htm?" + qs + "#" + window.location.pathname;
	theFrame.height = 196;
	theFrame.width = "100%";
	theFrame.frameBorder = 0;
	if (id)
	    theFrame.id = id;
	place.appendChild(theFrame);
}

function InsertTiddlerText(title, text, parentId)
{
	if (parentId)
	{
		var parent = document.getElementById(parentId);
		if (parent)
		{
			var ta = FindChildTextarea(parent);
			if (ta)
			{
				ta.focus();
				if (document.selection) //IE
					document.selection.createRange().text = text;
				else // firefox
					ta.value = ta.value.substr(0,ta.selectionStart) + text + ta.value.substr(ta.selectionStart);
				var fid = document.getElementById(parentId + "iFrame");
				fid.parentNode.removeChild(fid);
				return;
			}
		}
	}
	var curtx = store.getTiddlerText(title);
	if (!curtx)
		store.saveTiddler(title,title,text,config.options["txtUserName"],new Date(), "");
	story.displayTiddler(null,title);
}

function FindChildTextarea(ac)
{
	if (ac.tagName == "TEXTAREA")
		return ac;

	for (var i=0; i<ac.childNodes.length; i++)
	{
		var e = FindChildTextarea(ac.childNodes[i]);
		if (e) return e;
	}
}


