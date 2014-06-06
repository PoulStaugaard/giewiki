/* this:	iewiki.js
   by:  	Poul Staugaard
   URL: 	http://code.google.com/p/giewiki
   version:	1.18.3

Giewiki is based on TiddlyWiki created by Jeremy Ruston (and others)

Copyright (c) UnaMesa Association 2004-2009

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution.

Neither the name of the UnaMesa Association nor the names of its contributors may be
used to endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

var version = { title: "TiddlyWiki", major: 2, minor: 4, revision: 1, date: new Date("Aug 4, 2008"), extensions: {} };

// Set tab size to 4 characters for readability.

//-- Configuration repository is constructed dynamically server-side as /config.js

var Type = {
    System: { Exception: "System.Exception" }
};

// Errors in the tiddler save process
var TIDDLER_NOT_SAVED = -2; // Implies do not close the editor

var pfxFields = 'fields/';
var csqHighLight = '?highlight=';

// Hashmap of alternative parsers for the wikifier
config.parsers = {};

// Annotations
config.annotations = {};

// Custom fields to be automatically added to new tiddlers
config.defaultCustomFields = {};

config.NoSuchTiddlers = [ "EnableAnimations","CaseSensitiveSearch","RegExpSearch" ];

// Messages
config.messages = {
    messageClose: {
        text: "close",
        tooltip: "close this message area"
    },
    dates: {},
    tiddlerPopup: {},
    listView : {
        tiddlerTooltip: "Click for the full text of this tiddler",
        previewUnavailable: "(preview not available)"
    },
    customConfigError: "Problems were encountered loading plugins. See PluginManager for details",
    pluginError: "Error: %0",
    pluginDisabled: "Not executed because disabled via 'systemConfigDisable' tag",
    pluginForced: "Executed because forced via 'systemConfigForce' tag",
    pluginVersionError: "Not executed because this plugin needs a newer version of TiddlyWiki",
    nothingSelected: "Nothing is selected. You must select one or more items first",
    subtitleUnknown: "(unknown)",
    undefinedTiddlerToolTip: "The tiddler '%0' doesn't yet exist",
    shadowedTiddlerToolTip: "The tiddler '%0' doesn't yet exist, but has a pre-defined shadow value",
    tiddlerLinkTooltip: "%0 - %1, %2",
    externalLinkTooltip: "External link to %0",
    noTags: "There are no tagged tiddlers",
    macroError: "Error in macro <<\%0>>",
    macroErrorDetails: "Error while executing macro <<\%0>>:\n%1",
    missingMacro: "No such macro",
    overwriteWarning: "A tiddler named '%0' already exists. Choose OK to overwrite it",
    confirmExit: "If you continue you will lose your unsaved edit(s).",
    tiddlerLoadError: "Error when loading tiddler '%0'",
    wrongSaveFormat: "Cannot save with storage format '%0'. Using standard format for save.",
    invalidFieldName: "Invalid field name %0",
    fieldCannotBeChanged: "Field '%0' cannot be changed",
    sizeTemplates:
        [
        { unit: 1024 * 1024 * 1024, template: "%0\u00a0GB" },
        { unit: 1024 * 1024, template: "%0\u00a0MB" },
        { unit: 1024, template: "%0\u00a0KB" },
        { unit: 1, template: "%0\u00a0B" }
        ]
};

// Options that can be set in the options panel and/or cookies
merge(config.options, {
    chkAutoSyncAddress: false,
    chkAutoSave: false,
    chkAutoReloadOnSystemConfigSave: true,
    chkRegExpSearch: false,
    chkCaseSensitiveSearch: false,
    chkIncrementalSearch: true,
    chkAnimate: true,
    chkOpenInNewWindow: true,
    chkToggleLinks: false,
    chkForceMinorUpdate: false,
    chkRequireDeleteConfirm: true,
    chkRequireDeleteReason: true,
    chkSearchViewDate: false,
    chkSearchViewSnippets: false,
    chkShowManyResults: false,
    chkInsertTabs: false,
    chkListPrevious: true,
    chkUsePreForStorage: true, // Whether to use <pre> format for storage
    chkDisplayInstrumentation: false,
    txtEditorFocus: "text",
    txtMainTab: "tabTimeline",
    txtMoreTab: "moreTabAll",
    txtMaxEditRows: "30",
    txtEmail: "",
    txtExternalLibrary: "",
    txtTheme: "",
    txtEmptyTiddlyWiki: "empty.html", // Template for stand-alone export
    txtLockDuration: "60"},
    true);

config.optionsDesc = {
    // Options that can be set in the options panel
    chkAutoSyncAddress: "Auto-sync adress bar with displayed tiddlers",
	chkAutoSave: "Auto-save changes while editing",
    chkAutoReloadOnSystemConfigSave: "Auto reload on saving systemConfig tiddlers",
    chkRegExpSearch: "Enable regular expressions for searches",
    chkCaseSensitiveSearch: "Case-sensitive searching",
    chkIncrementalSearch: "Incremental key-by-key searching",
	chkSearchViewSnippets: "Get snippets of results",
    chkAnimate: "Enable animations",
    chkOpenInNewWindow: "Open external links in a new window",
    chkToggleLinks: "Clicking on links to open tiddlers causes them to close",
    chkForceMinorUpdate: "Don't update modifier username and date when editing tiddlers",
    chkRequireDeleteConfirm: "Require confirmation before deleting tiddlers",
    chkRequireDeleteReason: "Ask for a reason for deletion",
    chkInsertTabs: "Use the tab key to insert tab characters instead of moving between fields",
	chkListPrevious: "List previous version(s) of tiddlers you just edited",
    txtEmptyTiddlyWiki: "Source template (empty.html) for downloaded TiddlyWiki's",
    txtMaxEditRows: "Maximum number of visible lines in edit boxes",
    txtEmail: "Email for receiving messages",
    txtExternalLibrary: "Source of tiddlers listed via Libraries/other..",
    txtLockDuration: "Lock for edit (if so, duration in minutes) - leave blank to disable edit locking"
};

// Default tiddler templates
var DEFAULT_VIEW_TEMPLATE = 1;
var DEFAULT_EDIT_TEMPLATE = 2;
var SPECIAL_EDIT_TEMPLATE = 3;
config.tiddlerTemplates = [
	null,
    "ViewTemplate",
    "EditTemplate",
	"SpecialEditTemplate",
	"fields"
];

// More messages (rather a legacy layout that should not really be like this)
config.views = {
    wikified: {
        defaultText: "The tiddler '%0' doesn't yet exist. Double-click to create it, or to create a new page named %0: <script label=\"click here\" title=\"Create page\">var pe=place.parentElement; wikify(store.getTiddlerText(\"CreateNewPage\"), pe); pe.removeChild(place);</script><br><br>",
        defaultModifier: "(missing)",
        shadowModifier: "(special tiddler)",
        dateFormat: "DD MMM YYYY",
        createdPrompt: "created",
        tag: {
            labelTags: "tags",
            openTag: "Open tag '%0'",
            tooltip: "Show tiddlers tagged with '%0'",
            openAllText: "Open all",
            openAllTooltip: "Open all of these tiddlers",
            popupNone: "No other tiddlers tagged with '%0'"
            }
        },
    editor: {
        tagPrompt: "Type tags separated by spaces, [[use double square brackets]] if necessary, or add existing or predefined",
        defaultText: "",
        tagChooser: {
            text: "tags",
            tooltip: "Choose tags to add to this tiddler",
            popupNone: "There are no tags defined",
            tagTooltip: "Add the tag '%0'"
            }
    }
};

// Macros; handlers defined elsewhere
config.macros = {
    today: {},
    version: {},
    giewikiversion: {},
    search: {
        sizeTextbox: 15,
        pageLabel: "Page",
        areaLabel: "Area",
        siteLabel: "Site",
        prompt: "Search this page only",
        accessKey: "F",
        optionsPanel: "SearchOptionsPanel",
        successMsg: "%0 tiddlers found matching %1",
        failureMsg: "No tiddlers found matching %0"
        },
    tiddler: {},
    tag: {},
    tags: {},
    tagging: {
        label: "tagging: ",
        labelNotTag: "not tagging",
        tooltip: "List of tiddlers tagged with '%0'"
    },
    timeline: {
        dateFormat: "DD MMM YYYY"
    },
    allTags: {
        tooltip: "Show tiddlers tagged with '%0'",
        noTags: "There are no tagged tiddlers"
    },
    list: {
        all: {},
        missing: {},
        orphans: {},
        shadowed: {},
        touched: {},
        filter: {}
    },
    closeAll: {
        label: "close all",
        prompt: "Close all displayed tiddlers (except any that are being edited)"
    },
	permaview: {
		label: "permaview",
		prompt: "Link to an URL that retrieves all the currently displayed tiddlers"
	},
	comments: {
		listLabel: "%0 comments",
		listPrompt: "List comments",
		notesLabel: "%0 notes",
		messagesLabel: "%0 messages",
		listPrompt: "List notes",
		addCommentLabel: "add comment",
		addCommentPrompt: "comment on above",
		addMessageLabel: "add message",
		addMessagePrompt: "message to author",
		addNoteLabel: "add note",
		addNotePrompt: "add personal note",
		addTagLabel: "add tag",
		addTagPrompt: "add one ore more tags"
    },
    slider: {},
    option: {},
    options: {
        wizardTitle: "Personal preferences",
        step1Title: "These options are saved online in your profile if you are logged in (otherwise not)",
        step1Html: "<input type='hidden' name='markList'></input><br><input type='checkbox' checked='false' name='chkUnknown'>Show unknown options</input>",
        unknownDescription: "//(unknown)//",
        listViewTemplate: {
            columns: [
                { name: 'Option', field: 'option', title: "Option", type: 'String' },
                { name: 'Description', field: 'description', title: "Description", type: 'WikiText' },
                { name: 'Name', field: 'name', title: "Name", type: 'String' }
                ],
            rowClasses: [
                { className: 'lowlight', field: 'lowlight' }
                ]
        }
    },
    newTiddler: {
        label: "new tiddler",
        prompt: "Create a new tiddler",
        title: "",
        accessKey: "N"
    },
    newJournal: {
        label: "new journal",
        prompt: "Create a new tiddler from the current date and time",
        accessKey: "J"
    },
    tabs: {},
    gradient: {},
    message: {},
    view: { defaultView: "text" },
    edit: {},
    tagChooser: {},
    toolbar: {
        moreLabel: "more",
        morePrompt: "Reveal further commands"
    },
    refreshDisplay: {
        label: "refresh",
        prompt: "Redraw the entire TiddlyWiki display"
    },
    importTiddlers: {},
    sync: {},
    annotations: {}
};

// Commands supported by the toolbar macro
config.commands = {
    closeTiddler: {
        text: "close",
        tooltip: "Close this tiddler"
    },
    closeOthers: {
        text: "close others",
        tooltip: "Close all other tiddlers"
    },
    editTiddler: {
        text: "edit",
        tooltip: "Edit this tiddler",
        readOnlyText: "view",
        readOnlyTooltip: "View the source of this tiddler"
    },
    saveTiddler: {
        hideReadOnly: true,
        text: "done",
        tooltip: "Save changes to this tiddler"
    },
    applyChanges: {
        text: "apply",
        tooltip: "Save and apply changes"
    },
    cancelChanges: {
        text: "cancel",
        tooltip: "Cancel changes"
    },
    cancelTiddler: {
        text: "cancel",
        tooltip: "Undo changes to this tiddler",
        warning: "Are you sure you want to abandon your changes to '%0'?",
        readOnlyText: "done",
        readOnlyTooltip: "View this tiddler normally"
    },
    lockTiddler: { 
        text: "lock",
        tooltip: "Permanently lock this tiddler",
        readOnlyText: "unlock",
        readOnlyTooltip: "Allow editing tiddler"
    },
	cutTiddler: {
		text: "cut",
		tooltip: "Move to clipboard"
	},
    copyTiddler: { 
        text: "copy",
        tooltip: "Copy this tiddler"
    },
    excludeTiddler: { 
        text: "exclude",
        tooltip: "Exclude this tiddler"
    },
    deleteTiddler: { 
        hideReadOnly: true,
        text: "delete",
        tooltip: "Throw this in the recycle bin",
        warning: "Are you sure you want to delete '%0'?",
        prompt: "Why are you deleting '%0'? (hit Cancel to abort)"
    },
    rescueTiddler: {
        hideReadOnly: true,
		text: "rescue",
		tooltip: "Restore this tiddler",
		bin: []
	},
    revertTiddler: { 
        hideReadOnly: true,
        text: "revert",
        tooltip: "Revert last edit",
        warning: "Are you sure you want to revert '%0' to version '%1'?",
        adminWarning : "Reverting from the most recent version as admin will delete it - proceed ?"
    },
    truncateTiddler: { 
        hideReadOnly: true,
        text: "delete versions",
        tooltip: "Delete prior versions",
        warning: "delete all your prior versions?",
        adminWarning: "delete all prior versions?"
    },
    permalink: {
        text: "permalink",
        tooltip: "Permalink for this tiddler"
    },
    references: {
        type: "popup",
        text: "references",
        tooltip: "Show tiddlers that link to this one",
        popupNone: "No references"
    },
    jump: {
        type: "popup",
        text: "jump",
        tooltip: "Jump to another open tiddler"
    },
    history: {
		text: "history",
		tooltip: "Show history"
	},
	preview: {
		text: "preview",
		tooltip: "Preview formattet text"
	},
	reload: {
		text: "reload",
		tooltip: "Reload this tiddler to execute any macros again"
	},
	tag: {
		text: "tag",
		tooltip: "Add tags"
	},
	attributes: {
		type: "popup",
		text: "attributes",
		tooltip: "Toggle special tags"
	},
	diff: {
		text: "changes",
		tooltip: "What have I changed?"
	},
	help: {
		type: "popup",
		text: "help",
		tooltip: "Display formatting help",
		topics: [
			"Font Styles", "Links", "Markup", "CSS Formatting", "Tables", "Macros", "Timing"]
	},
	syncing: { type: "popup" },
	fields: {
		type: "popup",
		text: "fields",
		tooltip: "Show the fields of this tiddler",
		emptyText: "There are no fields for this tiddler",
		listViewTemplate: {
			columns: [
				{ name: 'Field', field: 'field', title: "Field", type: 'String' },
				{ name: 'Value', field: 'value', title: "Value", type: 'String' }
				],
			rowClasses: [
				],
			buttons: [
				]
		}
	}
};

// Browser detection... In a very few places, there's nothing else for it but to know what browser we're using.
config.userAgent = navigator.userAgent.toLowerCase();
config.browser = {
    isIE: config.userAgent.indexOf("msie") != -1 && config.userAgent.indexOf("opera") == -1,
    isGecko: config.userAgent.indexOf("gecko") != -1,
    ieVersion: /MSIE (\d.\d)/i.exec(config.userAgent), // config.browser.ieVersion[1], if it exists, will be the IE version string, eg "6.0"
    isSafari: config.userAgent.indexOf("applewebkit") != -1,
    isBadSafari: !((new RegExp("[\u0150\u0170]", "g")).test("\u0150")),
    firefoxDate: /gecko\/(\d{8})/i.exec(config.userAgent), // config.browser.firefoxDate[1], if it exists, will be Firefox release date as "YYYYMMDD"
    isOpera: config.userAgent.indexOf("opera") != -1,
    isLinux: config.userAgent.indexOf("linux") != -1,
    isUnix: config.userAgent.indexOf("x11") != -1,
    isMac: config.userAgent.indexOf("mac") != -1,
    isWindows: config.userAgent.indexOf("win") != -1
};

// Basic regular expressions
config.textPrimitives = {
    upperLetter: "[A-Z\u00c0-\u00de\u0150\u0170]",
    lowerLetter: "[a-z0-9_\\-\u00df-\u00ff\u0151\u0171]",
    anyLetter: "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]",
    anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff\u0150\u0170\u0151\u0171]"
};
if (config.browser.isBadSafari) {
    config.textPrimitives = {
        upperLetter: "[A-Z\u00c0-\u00de]",
        lowerLetter: "[a-z0-9_\\-\u00df-\u00ff]",
        anyLetter: "[A-Za-z0-9_\\-\u00c0-\u00de\u00df-\u00ff]",
        anyLetterStrict: "[A-Za-z0-9\u00c0-\u00de\u00df-\u00ff]"
    };
}

config.textPrimitives.sliceSeparator = "::";
config.textPrimitives.sectionSeparator = "##";
config.textPrimitives.urlPattern = "(?:file|http|https|mailto|ftp|irc|news|data):[^\\s'\"]+(?:/|\\b)";
config.textPrimitives.unWikiLink = "~";
config.textPrimitives.wikiLink = "(?:(?:" + config.textPrimitives.upperLetter + "+" +
    config.textPrimitives.lowerLetter + "+" +
    config.textPrimitives.upperLetter +
    config.textPrimitives.anyLetter + "*)|(?:" +
    config.textPrimitives.upperLetter + "{2,}" +
    config.textPrimitives.lowerLetter + "+))";

config.textPrimitives.cssLookahead = "(?:(" + config.textPrimitives.anyLetter + "+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:(" + config.textPrimitives.anyLetter + "+):([^;\\|\\n]+);)";
config.textPrimitives.cssLookaheadRegExp = new RegExp(config.textPrimitives.cssLookahead, "mg");

config.textPrimitives.brackettedLink = "\\[\\[([^\\]]+)\\]\\]";
config.textPrimitives.titledBrackettedLink = "\\[\\[([^\\[\\]\\|]+)\\|([^\\[\\]\\|]+)\\]\\]";
config.textPrimitives.tiddlerForcedLinkRegExp = new RegExp("(?:" + config.textPrimitives.titledBrackettedLink + ")|(?:" +
    config.textPrimitives.brackettedLink + ")|(?:" +
    config.textPrimitives.urlPattern + ")", "mg");
config.textPrimitives.tiddlerAnyLinkRegExp = new RegExp("(" + config.textPrimitives.wikiLink + ")|(?:" +
    config.textPrimitives.titledBrackettedLink + ")|(?:" +
    config.textPrimitives.brackettedLink + ")|(?:" +
    config.textPrimitives.urlPattern + ")", "mg");

config.glyphs = {
    browsers: [
        function() { return config.browser.isIE; },
        function() { return true; }
    ],
    currBrowser: null,
    codes: {
        downTriangle: ["\u25BC", "\u25BE"],
        downArrow: ["\u2193", "\u2193"],
        bentArrowLeft: ["\u2190", "\u21A9"],
        bentArrowRight: ["\u2192", "\u21AA"]
    }
};

//--
//-- Shadow tiddlers
//--

config.shadowTiddlers = {
    StyleSheet: "",
    TabTimeline: '<<timeline>>',
    TabAll: '<<list all>>',
    TabTags: '<<allTags excludeLists>>',
    TabMoreMissing: '<<list missing>>',
    TabMoreOrphans: '<<list orphans>>',
    TabMoreShadowed: '<<list shadowed>>',
    TopRightCorner: "",
    AdvancedOptions: '<<options>>',
    PluginManager: '<script label="Reload with PluginManager">window.location = UrlInclude("PluginManager.xml")</script>',
    ToolbarCommands: '|~ViewToolbar|closeTiddler closeOthers +editTiddler rescueTiddler > reload copyTiddler excludeTiddler fields syncing permalink references jump|\n|~MiniToolbar|closeTiddler|\n|~EditToolbar|+saveTiddler -cancelTiddler lockTiddler copyTiddler cutTiddler deleteTiddler revertTiddler truncateTiddler|\n|~SpecialEditToolbar|preview +applyChanges -cancelChanges attributes history copyTiddler|\n|~TextToolbar|preview tag attributes diff help|',
    DefaultTiddlers: "[[PageSetup]]",
    MainMenu: "[[PageSetup]]\n[[SiteMap]]\n[[RecentChanges]]\n[[RecentComments]]",
    SiteUrl: "http://giewiki.appspot.com/",
    SideBarOptions: '<<login edit UserMenu "My stuff" m>><<slider chkSliderSearchPanel SearchPanel "search \u00bb" "Search page or site">><<closeAll>><<menu edit EditingMenu "Editing menu" e "!readOnly && config.owner">><<slider chkSliderOptionsPanel OptionsPanel "options \u00bb" "Change TiddlyWiki advanced options">>',
    SearchPanel: '<<search>>',
    SearchOptionsPanel: "!!!Page search: [[N.B.|PageSearchFAQ]]\n<<option chkRegExpSearch>> Use regular expression\n<<option chkCaseSensitiveSearch>> Case-sensitive\n<<option chkIncrementalSearch>> Key-by-key search\n!!!Area or Site search:\n<<option chkSearchViewSnippets>> Show snippets of results\n<<option chkSearchViewDate>> Show date in results\n<<option chkShowManyResults>> Show many results\nSearchHistory | AdvancedSearch",
    SideBarTabs: '<<tabs txtMainTab "When" "Timeline" TabTimeline "All" "All tiddlers" TabAll "Tags" "All tags" TabTags "~js:config.deprecatedCount~Deprecated" "Deprecated tiddlers" "js;DeprecatedTiddlers" "~.." "More lists" TabMore>>',
    TabMore: '<<tabs txtMoreTab "Missing" "Missing tiddlers" TabMoreMissing "Orphans" "Orphaned tiddlers" TabMoreOrphans "Special" "Special tiddlers" TabMoreShadowed>>'
};

// Strings in "double quotes" should be translated; strings in 'single quotes' should be left alone
config.patches = { // Special case
	FixedIndex: "<div id='sidebarTabs' refresh='content' force='true' tiddler='SideBarTabs'></div>",
	FoldOutIndex: "<div id='sidebarTabs' refresh='macro' force='true' macro='slider chkSideBarTabs SideBarTabs \"index \u00bb\" \"display lists of tiddlers\"'></div>"
};	

config.messages.dates.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
config.messages.dates.days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
config.messages.dates.shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
config.messages.dates.shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// suffixes for dates, eg "1st","2nd","3rd"..."30th","31st"
config.messages.dates.daySuffixes = ["st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th",
        "th", "th", "th", "th", "th", "th", "th", "th", "th", "th",
        "st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th",
        "st"];
config.messages.dates.am = "am";
config.messages.dates.pm = "pm";

config.macros.list.all.prompt = "All tiddlers in alphabetical order";
config.macros.list.missing.prompt = "Tiddlers that have links to them but are not defined";
config.macros.list.orphans.prompt = "Tiddlers that are not linked to from any other tiddlers";
config.macros.list.shadowed.prompt = "Special purpose tiddlers with default contents";
config.macros.list.touched.prompt = "Tiddlers that have been modified locally";

config.tagLinks = {};
config.tagLinksAdd = function(tag,link) {
	if (link.page == window.location.pathname)
		return;
	if (config.tagLinks[tag] === undefined)
		config.tagLinks[tag] = [];
	for (var i = 0; i < config.tagLinks[tag].length; i++)
		if (config.tagLinks[tag][i].link == link.link)
			return;
	config.tagLinks[tag].push(link);
};
//--
//-- Main
//--

var params = null; // Command line parameters
var store = null; // TiddlyWiki storage
var story = null; // Main story
var formatter = null; // Default formatters for the wikifier
var anim = typeof Animator == "function" ? new Animator() : null; // Animation engine
var readOnly = false; // Whether we're in readonly mode
var highlightHack = null; // Embarrassing hack department...

var hadConfirmExit = false; // Don't warn more than once
var safeMode = false; // Disable all plugins and cookies
var installedPlugins = {}; // Information filled in when plugins are executed
var startingUp = false; // Whether we're in the process of starting up
var pluginInfo, tiddler; // Used to pass information to plugins in loadPlugins()

config.read = function () {
	if (this.access == "none" || this.access == "view" || this.access == "comment")
		readOnly = true;
	var pglt = {};
	for (var pgi = this.pages.length - 1; pgi >= 0; pgi--)
		pglt[this.pages[pgi].p.split('/').pop()] = this.pages[pgi]; // build wikipage lookup table
	this.pages = pglt;
	this.tiddlerTags = this.tiddlerTags ? this.tiddlerTags.readBracketedList() : [];
	var st = store.getTiddler('SiteTitle');
	if (!st || st.hasShadow)
		this.shadowTiddlers.SiteTitle = this.sitetitle;
	st = store.getTiddler('SiteSubtitle');
	if (!st || st.hasShadow)
		this.shadowTiddlers.SiteSubtitle = this.subtitle;
	if (config.admin)
		if (!config.serverType.startsWith('Development'))
			this.shadowTiddlers.UserMenu = this.shadowTiddlers.UserMenu.replace("http://localhost:8000/datastore?kind=Page", "https://appengine.google.com/datastore/explorer?app_id=" + config.appId);
	if (this.noSuchTiddlers)
		this.NoSuchTiddlers = this.NoSuchTiddlers.concat(this.noSuchTiddlers.split('\n'))
}

config.isLoggedIn = function() {
	return config.options.rat != false;
}

// Starting up
function main() {
    startingUp = true;
    if (window.location.search.startsWith("?debugger"))
		debugger;
	window.onbeforeunload = function (e) { if (window.confirmExit) return confirmExit(); };
	window.onunload = function (e) {
		for (var lock in config.editLocks)
			if (lock)
				http.unlockTiddler({ "key": lock });
	};
    params = getParameters();
    if (params)
        params = params.parseParams("open", null, false);
    authors = [];
    store = new TiddlyWiki();
    invokeParamifier(params, "oninit");
    story = new Story("tiddlerDisplay", "tiddler");
    addEvent(document, "click", Popup.onDocumentClick);
    for (var s = 0; s < config.notifyTiddlers.length; s++)
        store.addNotification(config.notifyTiddlers[s].name, config.notifyTiddlers[s].notify);
    loadShadowTiddlers(false);
    store.loadFromDiv("storeArea", "store", true);
    config.read();
    invokeParamifier(params, "onload");

    var pluginProblem = loadPlugins();
    loadShadowTiddlers(true);
	if (config.foldIndex) {
		var pt = store.getTiddler('PageTemplate');
		pt.text = pt.text.replace( config.patches.FixedIndex, config.patches.FoldOutIndex);
	}
    formatter = new Formatter(config.formatters);
    invokeParamifier(params, "onconfig");
    story.switchTheme(config.options.txtTheme);
    store.notifyAll();
    restart();
	if (readOnly && !config.showByline)
		setStylesheet('.subtitle { display: none }');

    refreshDisplay();
    if (pluginProblem) {
		if (!config.macros.plugins)
			window.location = UrlInclude("PluginManager.xml");
        story.displayTiddler(null, "PluginManager");
        displayMessage(config.messages.customConfigError);
    }
    else if (config.warnings)
		displayMessage(config.warnings);
    for (var m in config.macros) {
        if (config.macros[m].init)
            config.macros[m].init();
    }
    startingUp = false;
}

// Restarting
function restart() {
	store.fetchFromServer = true;
	if (window.location.search.startsWith(csqHighLight))
		highlightHack = new RegExp(decodeURIComponent(window.location.search.substring(csqHighLight.length)).escapeRegExp(), "img");
	invokeParamifier(params, "onstart");
	highlightHack = null;
    if (story.isEmpty())
        story.displayDefaultTiddlers();
    window.scrollTo(0, 0);
}

function loadShadowTiddlers(again) {
	var ms = function(t) { 
		t.version = t.currentVer = 0; 
		t.hasShadow = true; 
		t.modifier = config.views.wikified.shadowModifier; 
		t.created = t.modified = new Date(0);
		if (!again)
			config.shadowTiddlers[t.title] = t.text;
		return t; 
	} 
	for(var t in config.shadowTiddlers) {
		var et = store.getTiddler(t);
		if (et) {
			if (et.hasShadow) { // replace shadow tiddler
				if (et.ovs) 
					et.ovs[0].text = config.shadowTiddlers[t];
				else
					et.text = config.shadowTiddlers[t];
			} else {
				et.hasShadow = true;
				if (!et.ovs)
					et.ovs = [];
				et.ovs[0] = ms(new Tiddler(t, 0, config.shadowTiddlers[t]));
			}
		}
		else
			store.addTiddler(ms(new Tiddler(t, 0, config.shadowTiddlers[t])));
		if (again)
			delete config.shadowTiddlers[t];
	}
	if (!again)
		store.loadFromDiv("shadowArea", "shadows", true, ms);
}

function loadPlugins() {
    if (safeMode)
        return false;
    var tiddlers = store.getTaggedTiddlers("systemConfig",undefined,true,true);
    var toLoad = [];
    var nLoaded = 0;
    var map = {};
    var nPlugins = tiddlers.length;
    for (var i = 0; i < nPlugins; i++) {
        var p = getPluginInfo(tiddlers[i]);
		if (!installedPlugins[p.title]) {
			installedPlugins[p.title] = p;
			var n = p.Name;
			if (n)
				map[n] = p;
			n = p.Source;
			if (n)
				map[n] = p;
		}
    }
    var visit = function(p) {
        if (!p || p.done)
            return;
        p.done = 1;
        var reqs = p.Requires;
        if (reqs) {
            reqs = reqs.readBracketedList();
            for (var i = 0; i < reqs.length; i++)
                visit(map[reqs[i]]);
        }
        toLoad.push(p);
    };
    for (var atn in installedPlugins)
        visit(installedPlugins[atn]);
    for (i = 0; i < toLoad.length; i++) {
        p = toLoad[i];
        pluginInfo = p;
        tiddler = p.tiddler;
        if (isPluginExecutable(p)) {
            if (isPluginEnabled(p)) {
                p.executed = true;
                var startTime = new Date();
                try {
					if (tiddler.tags.indexOf('systemScript') >= 0)
						p.log.push("Loaded as an external script");
                    else if (tiddler.text)
                        window.eval(tiddler.text);
                    nLoaded++;
                } catch (ex) {
					//displayMessage("Failed to execute " + p.title + '<br>' + exceptionText(ex));
                    p.log.push(config.messages.pluginError.format([exceptionText(ex)]));
                    p.error = true;
                }
                pluginInfo.startupTime = String((new Date()) - startTime) + "ms";
            } else {
                nPlugins--;
            }
        } else {
            p.warning = true;
        }
    }
    return nLoaded != nPlugins;
}

function getPluginInfo(tiddler) {
    var p = store.getTiddlerSlices(tiddler.title, ["Name", "Description", "Version", "Requires", "CoreVersion", "Date", "Source", "Author", "License", "Browsers"]);
    p.tiddler = tiddler;
    p.title = tiddler.title;
    p.log = [];
    return p;
}

// Check that a particular plugin is valid for execution
function isPluginExecutable(plugin) {
    if (plugin.tiddler.isTagged("systemConfigForce")) {
        plugin.log.push(config.messages.pluginForced);
        return true;
    }
    if (plugin["CoreVersion"]) {
        var coreVersion = plugin["CoreVersion"].split(".");
        var w = parseInt(coreVersion[0], 10) - version.major;
        if (w == 0 && coreVersion[1])
            w = parseInt(coreVersion[1], 10) - version.minor;
        if (w == 0 && coreVersion[2])
            w = parseInt(coreVersion[2], 10) - version.revision;
        if (w > 0) {
            plugin.log.push(config.messages.pluginVersionError);
            return false;
        }
    }
    return true;
}

function isPluginEnabled(plugin) {
    if (plugin.tiddler.isTagged("systemConfigDisable")) {
        plugin.log.push(config.messages.pluginDisabled);
        return false;
    }
    return true;
}

function invokeMacro(place, macro, params, wikifier, tiddler) {
    try {
        var m = config.macros[macro];
		if (m === undefined && store.getTiddler(macro + " macro")) // possible source not yet loaded
			m = config.macros[macro];
		else if (m && m.handler === undefined) {
			if (m.tiddler) {
				if (!store.getTiddler(m.tiddler))
					return createTiddlyError(place, config.messages.macroError.format([macro]), "Cannot get resource tiddler");
			}
		}
        if (m && m.handler) {
        	var tiddlerElem = story.findContainingTiddler(place);
        	window.tiddler = tiddlerElem ? store.getTiddler(tiddlerElem.getAttribute("tiddler")) : null;
        	window.place = place;
        	return m.handler(place, macro, params.readMacroParams(), wikifier, params, tiddler);
        }
       	createTiddlyError(place, config.messages.macroError.format([macro]), config.messages.macroErrorDetails.format([macro, config.messages.missingMacro]));
    } catch (ex) {
		var msg = ex.message || ex.toString();
        createTiddlyError(place, config.messages.macroError.format([macro]), config.messages.macroErrorDetails.format([macro, msg]));
    }
}

//--
//-- Paramifiers
//--

function getParameters() {
    var p = null;
    if (window.location.hash) {
        p = decodeURIComponent(window.location.hash.substr(1));
    }
    return p;
}

function invokeParamifier(params,handler) {
	if(!params || params.length == undefined || params.length <= 1)
		return;
	for(var i=1; i<params.length; i++) {
		var p = config.paramifiers[params[i].name];
		if(p && p[handler] instanceof Function)
			p[handler](params[i].value);
		else {
			var h = config.optionHandlers[params[i].name.substr(0,3)];
			if(h && h.set instanceof Function)
				h.set(params[i].name,params[i].value);
		}
	}
}

config.paramifiers = {};

config.paramifiers.start = {
    oninit: function(v) {
        safeMode = v.toLowerCase() == "safe";
    }
};

config.paramifiers.open = {
    onstart: function(v) {
		if (!readOnly || store.tiddlerExists(v) || store.isShadowTiddler(v) || TryGetTiddler(v))
			TiddlerLinkHandler('bottom',v);
	}
};

config.paramifiers.story = {
    onstart: function(v) {
        var list = store.getTiddlerText(v, "").parseParams("open", null, false);
        invokeParamifier(list, "onstart");
    }
};

config.paramifiers.search = {
    onstart: function(v) {
        story.search(v, false, false);
    }
};

config.paramifiers.searchRegExp = {
    onstart: function(v) {
        story.prototype.search(v, false, true);
    }
};

config.paramifiers.tag = {
    onstart: function(v) {
        story.displayTiddlers(null, store.filterTiddlers("[tag[" + v + "]]"), null, false, null);
    }
};

config.paramifiers.newTiddler = {
    onstart: function(v) {
        if (!readOnly) {
            story.displayTiddler(null, v, DEFAULT_EDIT_TEMPLATE);
            story.focusTiddler(v, "text");
        }
    }
};

config.paramifiers.newJournal = {
    onstart: function(v) {
        if (!readOnly) {
            var now = new Date();
            var title = now.formatString(v.trim());
            story.displayTiddler(null, title, DEFAULT_EDIT_TEMPLATE);
            story.focusTiddler(title, "text");
        }
    }
};

config.paramifiers.readOnly = {
    onconfig: function(v) {
        var p = v.toLowerCase();
        readOnly = p == "yes" ? true : (p == "no" ? false : readOnly);
    }
};

config.paramifiers.theme = {
    onconfig: function(v) {
        story.switchTheme(v);
    }
};

config.paramifiers.recent = {
    onstart: function(v) {
        var titles = [];
        var tiddlers = store.getTiddlers("modified", "excludeLists").reverse();
        for (var i = 0; i < v && i < tiddlers.length; i++)
            titles.push(tiddlers[i].title);
        story.displayTiddlers(null, titles);
    }
};

config.paramifiers.filter = {
    onstart: function(v) {
        story.displayTiddlers(null, store.filterTiddlers(v), null, false);
    }
};

//--
//-- Formatter helpers
//--

function Formatter(formatters) {
    this.formatters = [];
    var pattern = [];
    for (var n = 0; n < formatters.length; n++) {
        pattern.push("(" + formatters[n].match + ")");
        this.formatters.push(formatters[n]);
    }
    this.formatterRegExp = new RegExp(pattern.join("|"), "mg");
}

config.formatterHelpers = {

    createElementAndWikify: function(w) {
        w.subWikifyTerm(createTiddlyElement(w.output, this.element), this.termRegExp);
    },

    inlineCssHelper: function(w) {
        var styles = [];
        config.textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
        var lookaheadMatch = config.textPrimitives.cssLookaheadRegExp.exec(w.source);
        while (lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
            var s, v;
            if (lookaheadMatch[1]) {
                s = lookaheadMatch[1].unDash();
                v = lookaheadMatch[2];
            } else {
                s = lookaheadMatch[3].unDash();
                v = lookaheadMatch[4];
            }
            if (s == "bgcolor")
                s = "backgroundColor";
            styles.push({ style: s, value: v });
            w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
            config.textPrimitives.cssLookaheadRegExp.lastIndex = w.nextMatch;
            lookaheadMatch = config.textPrimitives.cssLookaheadRegExp.exec(w.source);
        }
        return styles;
    },

    applyCssHelper: function(e, styles) {
        for (var t = 0; t < styles.length; t++) {
            try {
                e.style[styles[t].style] = styles[t].value;
            } catch (ex) {
            }
        }
    },

    enclosedTextHelper: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
            var text = lookaheadMatch[1];
            if (config.browser.isIE)
                text = text.replace(/\n/g, "\r");
            createTiddlyElement(w.output, this.element, null, null, text);
            w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
        }
    },

    isExternalLink: function(link) {
        if (store.tiddlerExists(link) || store.isShadowTiddler(link)) {
            return false;
        }
        var urlRegExp = new RegExp(config.textPrimitives.urlPattern, "mg");
        if (urlRegExp.exec(link)) {
            return true;
        }
        var ssp = link.indexOf("/");
		if (ssp > 0) {
			var ttn = link.substring(0,ssp);
			if (config.tiddlerTemplates.indexOf(ttn) != -1)
				return false;
		}
        if (link.indexOf(".") != -1 || link.indexOf("\\") != -1 || ssp != -1 || link.indexOf("#") != -1) {
            return true;
        }
        return false;
    }

};

//--
//-- Standard formatters
//--

config.formatters = [
{
    name: "table",
    match: "^\\|(?:[^\\n]*)\\|(?:[fhck]?)$",
    lookaheadRegExp: /^\|([^\n]*)\|([fhck]?)$/mg,
    rowTermRegExp: /(\|(?:[fhck]?)$\n?)/mg,
    cellRegExp: /(?:\|([^\n\|]*)\|)|(\|[fhck]?$\n?)/mg,
    cellTermRegExp: /((?:\x20*)\|)/mg,
    rowTypes: { "c": "caption", "h": "thead", "": "tbody", "f": "tfoot" },
    handler: function(w) {
        var table = createTiddlyElement(w.output, "table", null, "twtable");
        var prevColumns = [];
        var currRowType = null;
        var rowContainer;
        var rowCount = 0;
        w.nextMatch = w.matchStart;
        this.lookaheadRegExp.lastIndex = w.nextMatch;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        while (lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
            var nextRowType = lookaheadMatch[2];
            if (nextRowType == "k") {
                table.className = lookaheadMatch[1];
                w.nextMatch += lookaheadMatch[0].length + 1;
            } else {
                if (nextRowType != currRowType) {
                    rowContainer = createTiddlyElement(table, this.rowTypes[nextRowType]);
                    currRowType = nextRowType;
                }
                if (currRowType == "c") {
                    // Caption
                    w.nextMatch++;
                    if (rowContainer != table.firstChild)
                        table.insertBefore(rowContainer, table.firstChild);
                    rowContainer.setAttribute("align", rowCount == 0 ? "top" : "bottom");
                    w.subWikifyTerm(rowContainer, this.rowTermRegExp);
                } else {
                    var theRow = createTiddlyElement(rowContainer, "tr", null, (rowCount & 1) ? "oddRow" : "evenRow");
                    theRow.onmouseover = function() { addClass(this, "hoverRow"); };
                    theRow.onmouseout = function() { removeClass(this, "hoverRow"); };
                    this.rowHandler(w, theRow, prevColumns);
                    rowCount++;
                }
            }
            this.lookaheadRegExp.lastIndex = w.nextMatch;
            lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        }
    },
    rowHandler: function(w, e, prevColumns) {
        var col = 0;
        var colSpanCount = 1;
        var prevCell = null;
        this.cellRegExp.lastIndex = w.nextMatch;
        var cellMatch = this.cellRegExp.exec(w.source);
        while (cellMatch && cellMatch.index == w.nextMatch) {
            if (cellMatch[1] == "~") {
                // Rowspan
                var last = prevColumns[col];
                if (last) {
                    last.rowSpanCount++;
                    last.element.setAttribute("rowspan", last.rowSpanCount);
                    last.element.setAttribute("rowSpan", last.rowSpanCount); // Needed for IE
                    last.element.valign = "center";
                }
                w.nextMatch = this.cellRegExp.lastIndex - 1;
            } else if (cellMatch[1] == ">") {
                // Colspan
                colSpanCount++;
                w.nextMatch = this.cellRegExp.lastIndex - 1;
            } else if (cellMatch[2]) {
                // End of row
                if (prevCell && colSpanCount > 1) {
                    prevCell.setAttribute("colspan", colSpanCount);
                    prevCell.setAttribute("colSpan", colSpanCount); // Needed for IE
                }
                w.nextMatch = this.cellRegExp.lastIndex;
                break;
            } else {
                // Cell
                w.nextMatch++;
                var styles = config.formatterHelpers.inlineCssHelper(w);
                var spaceLeft = false;
                var chr = w.source.substr(w.nextMatch, 1);
                while (chr == " ") {
                    spaceLeft = true;
                    w.nextMatch++;
                    chr = w.source.substr(w.nextMatch, 1);
                }
                var cell;
                if (chr == "!") {
                    cell = createTiddlyElement(e, "th");
                    w.nextMatch++;
                } else {
                    cell = createTiddlyElement(e, "td");
                }
                prevCell = cell;
                prevColumns[col] = { rowSpanCount: 1, element: cell };
                if (colSpanCount > 1) {
                    cell.setAttribute("colspan", colSpanCount);
                    cell.setAttribute("colSpan", colSpanCount); // Needed for IE
                    colSpanCount = 1;
                }
                config.formatterHelpers.applyCssHelper(cell, styles);
                w.subWikifyTerm(cell, this.cellTermRegExp);
                if (w.matchText.substr(w.matchText.length - 2, 1) == " ") // spaceRight
                    cell.align = spaceLeft ? "center" : "left";
                else if (spaceLeft)
                    cell.align = "right";
                w.nextMatch--;
            }
            col++;
            this.cellRegExp.lastIndex = w.nextMatch;
            cellMatch = this.cellRegExp.exec(w.source);
        }
    }
},

{
    name: "heading",
    match: "^!{1,6}",
    termRegExp: /(\n)/mg,
    handler: function(w) {
        w.subWikifyTerm(createTiddlyElement(w.output, "h" + w.matchLength), this.termRegExp);
    }
},

{
    name: "list",
    match: "^(?:[\\*#;:]+)",
    lookaheadRegExp: /^(?:(?:(\*)|(#)|(;)|(:))+)/mg,
    termRegExp: /(\n)/mg,
    handler: function(w) {
        var stack = [w.output];
        var currLevel = 0, currType = null;
        var listLevel, listType, itemType, baseType;
        w.nextMatch = w.matchStart;
        this.lookaheadRegExp.lastIndex = w.nextMatch;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        while (lookaheadMatch && lookaheadMatch.index == w.nextMatch) {
            if (lookaheadMatch[1]) {
                listType = "ul";
                itemType = "li";
            } else if (lookaheadMatch[2]) {
                listType = "ol";
                itemType = "li";
            } else if (lookaheadMatch[3]) {
                listType = "dl";
                itemType = "dt";
            } else if (lookaheadMatch[4]) {
                listType = "dl";
                itemType = "dd";
            }
            if (!baseType)
                baseType = listType;
            listLevel = lookaheadMatch[0].length;
            w.nextMatch += lookaheadMatch[0].length;
            var t;
            if (listLevel > currLevel) {
                for (t = currLevel; t < listLevel; t++) {
                    var target = (currLevel == 0) ? stack[stack.length - 1] : stack[stack.length - 1].lastChild;
                    stack.push(createTiddlyElement(target, listType));
                }
            } else if (listType != baseType && listLevel == 1) {
                w.nextMatch -= lookaheadMatch[0].length;
                return;
            } else if (listLevel < currLevel) {
                for (t = currLevel; t > listLevel; t--)
                    stack.pop();
            } else if (listLevel == currLevel && listType != currType) {
                stack.pop();
                stack.push(createTiddlyElement(stack[stack.length - 1].lastChild, listType));
            }
            currLevel = listLevel;
            currType = listType;
            var e = createTiddlyElement(stack[stack.length - 1], itemType);
            w.subWikifyTerm(e, this.termRegExp);
            this.lookaheadRegExp.lastIndex = w.nextMatch;
            lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        }
    }
},

{
    name: "quoteByBlock",
    match: "^<<<\\n",
    termRegExp: /(^<<<(\n|$))/mg,
    element: "blockquote",
    handler: config.formatterHelpers.createElementAndWikify
},

{
    name: "quoteByLine",
    match: "^>+",
    lookaheadRegExp: /^>+/mg,
    termRegExp: /(\n)/mg,
    element: "blockquote",
    handler: function(w) {
        var stack = [w.output];
        var currLevel = 0;
        var newLevel = w.matchLength;
        var t;
        do {
            if (newLevel > currLevel) {
                for (t = currLevel; t < newLevel; t++)
                    stack.push(createTiddlyElement(stack[stack.length - 1], this.element));
            } else if (newLevel < currLevel) {
                for (t = currLevel; t > newLevel; t--)
                    stack.pop();
            }
            currLevel = newLevel;
            w.subWikifyTerm(stack[stack.length - 1], this.termRegExp);
            createTiddlyElement(stack[stack.length - 1], "br");
            this.lookaheadRegExp.lastIndex = w.nextMatch;
            var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
            var matched = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
            if (matched) {
                newLevel = lookaheadMatch[0].length;
                w.nextMatch += lookaheadMatch[0].length;
            }
        } while (matched);
    }
},

{
    name: "rule",
    match: "^----+$\\n?|<hr ?/?>\\n?",
    handler: function (w) {
        createTiddlyElement(w.output, "hr");
    }
},

{
    name: "monospacedByLine",
    match: "^(?:/\\*\\{\\{\\{\\*/|\\{\\{\\{|//\\{\\{\\{|<!--\\{\\{\\{-->)\\n",
    element: "pre",
    handler: function(w) {
        switch (w.matchText) {
            case "/*{{{*/\n": // CSS
                this.lookaheadRegExp = /\/\*\{\{\{\*\/\n*((?:^[^\n]*\n)+?)(\n*^\/\*\}\}\}\*\/$\n?)/mg;
                break;
            case "{{{\n": // monospaced block
                this.lookaheadRegExp = /^\{\{\{\n((?:^[^\n]*\n)+?)(^\}\}\}$\n?)/mg;
                break;
            case "//{{{\n": // plugin
                this.lookaheadRegExp = /^\/\/\{\{\{\n\n*((?:^[^\n]*\n)+?)(\n*^\/\/\}\}\}$\n?)/mg;
                break;
            case "<!--{{{-->\n": //template
                this.lookaheadRegExp = /<!--\{\{\{-->\n*((?:^[^\n]*\n)+?)(\n*^<!--\}\}\}-->$\n?)/mg;
                break;
            default:
                break;
        }
        config.formatterHelpers.enclosedTextHelper.call(this, w);
    }
},

{
    name: "wikifyComment",
    match: "^(?:/\\*\\*\\*|<!---)\\n",
    handler: function(w) {
        var termRegExp = (w.matchText == "/***\n") ? (/(^\*\*\*\/\n)/mg) : (/(^--->\n)/mg);
        w.subWikifyTerm(w.output, termRegExp);
    }
},

{
    name: "macro",
    match: "<<",
    lookaheadRegExp: /<<([^>\s]+)(?:\s*)((?:[^>]|(?:>(?!>)))*)>>/mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart && lookaheadMatch[1]) {
            w.nextMatch = this.lookaheadRegExp.lastIndex;
            invokeMacro(w.output, lookaheadMatch[1], lookaheadMatch[2], w, w.tiddler);
        }
    }
},

{
    name: "prettyLink",
    match: "\\[\\[",
    lookaheadRegExp: /\[\[(.*?)(?:\|(~)?(.*?))?\]\]/mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
            var e;
            var text = lookaheadMatch[1];
            if (lookaheadMatch[3]) {
                // Pretty bracketed link
                var link = lookaheadMatch[3];
				var cpq = link.indexOf(csqHighLight);
				if ((!lookaheadMatch[2]) && config.formatterHelpers.isExternalLink(link))
					e = createExternalLink(w.output, link);
				else if (cpq >= 0)
					e = createTiddlyLink(w.output, decodeURIComponent(link.substring(0,cpq)), false, null, w.isStatic, w.tiddler, false, 
										 decodeURIComponent(link.substring(cpq + csqHighLight.length)));
				else
					e = createTiddlyLink(w.output, decodeURIComponent(link), false, null, w.isStatic, w.tiddler);
            } else {
                // Simple bracketted link
                e = createTiddlyLink(w.output, decodeURIComponent(text), false, null, w.isStatic, w.tiddler);
            }
            createTiddlyText(e, text);
            w.nextMatch = this.lookaheadRegExp.lastIndex;
        }
    }
},

{
    name: "wikiLink",
    match: config.textPrimitives.unWikiLink + "?" + config.textPrimitives.wikiLink,
    handler: function(w) {
        if (w.matchText.substr(0, 1) == config.textPrimitives.unWikiLink) {
            w.outputText(w.output, w.matchStart + 1, w.nextMatch);
            return;
        }
        if (w.matchStart > 0) {
            var preRegExp = new RegExp(config.textPrimitives.anyLetterStrict, "mg");
            preRegExp.lastIndex = w.matchStart - 1;
            var preMatch = preRegExp.exec(w.source);
            if (preMatch.index == w.matchStart - 1) {
                w.outputText(w.output, w.matchStart, w.nextMatch);
                return;
            }
        }
        if (w.autoLinkWikiWords || store.isShadowTiddler(w.matchText)) {
            var link = createTiddlyLink(w.output, w.matchText, false, null, w.isStatic, w.tiddler);
            w.outputText(link, w.matchStart, w.nextMatch);
        } else {
            w.outputText(w.output, w.matchStart, w.nextMatch);
        }
    }
},

{
    name: "urlLink",
    match: config.textPrimitives.urlPattern,
    handler: function(w) {
        w.outputText(createExternalLink(w.output, w.matchText), w.matchStart, w.nextMatch);
    }
},

{
    name: "image",
    match: "\\[[<>]?[Ii][Mm][Gg]\\[",
    lookaheadRegExp: /\[([<]?)(>?)[Ii][Mm][Gg]\[(?:([^\|\]]+)\|)?([^\[\]\|]+)\](?:\[([^\]]*)\])?\]/mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
            var e = w.output;
            if (lookaheadMatch[5]) {
                var link = lookaheadMatch[5];
                e = config.formatterHelpers.isExternalLink(link) ? createExternalLink(w.output, link) : createTiddlyLink(w.output, link, false, null, w.isStatic, w.tiddler);
                addClass(e, "imageLink");
            }
            var img = createTiddlyElement(e, "img");
            if (lookaheadMatch[1])
                img.align = "left";
            else if (lookaheadMatch[2])
                img.align = "right";
            if (lookaheadMatch[3]) {
                img.title = lookaheadMatch[3];
                img.setAttribute("alt", lookaheadMatch[3]);
            }
            img.src = lookaheadMatch[4];
            w.nextMatch = this.lookaheadRegExp.lastIndex;
        }
    }
},

{
    name: "html",
    match: "<[Hh][Tt][Mm][Ll]>",
    lookaheadRegExp: /<[Hh][Tt][Mm][Ll]>((?:.|\n)*?)<\/[Hh][Tt][Mm][Ll]>/mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
            createTiddlyElement(w.output, "span").innerHTML = lookaheadMatch[1];
            w.nextMatch = this.lookaheadRegExp.lastIndex;
        }
    }
},

{
    name: "commentByBlock",
    match: "/%",
    lookaheadRegExp: /\/%((?:.|\n)*?)%\//mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart)
            w.nextMatch = this.lookaheadRegExp.lastIndex;
    }
},

{
    name: "characterFormat",
    match: "''|//|__|\\^\\^|~~|--(?!\\s|$)|\\{\\{\\{",
    handler: function(w) {
        switch (w.matchText) {
            case "''":
                w.subWikifyTerm(w.output.appendChild(document.createElement("strong")), /('')/mg);
                break;
            case "//":
                w.subWikifyTerm(createTiddlyElement(w.output, "em"), /(\/\/)/mg);
                break;
            case "__":
                w.subWikifyTerm(createTiddlyElement(w.output, "u"), /(__)/mg);
                break;
            case "^^":
                w.subWikifyTerm(createTiddlyElement(w.output, "sup"), /(\^\^)/mg);
                break;
            case "~~":
                w.subWikifyTerm(createTiddlyElement(w.output, "sub"), /(~~)/mg);
                break;
            case "--":
                w.subWikifyTerm(createTiddlyElement(w.output, "strike"), /(--)/mg);
                break;
            case "{{{":
                var lookaheadRegExp = /\{\{\{((?:.|\n)*?)\}\}\}/mg;
                lookaheadRegExp.lastIndex = w.matchStart;
                var lookaheadMatch = lookaheadRegExp.exec(w.source);
                if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
                    createTiddlyElement(w.output, "code", null, null, lookaheadMatch[1]);
                    w.nextMatch = lookaheadRegExp.lastIndex;
                }
                break;
        }
    }
},

{
    name: "customFormat",
    match: "@@|\\{\\{",
    handler: function(w) {
        switch (w.matchText) {
            case "@@":
                var e = createTiddlyElement(w.output, "span");
                var styles = config.formatterHelpers.inlineCssHelper(w);
                if (styles.length == 0)
                    e.className = "marked";
                else
                    config.formatterHelpers.applyCssHelper(e, styles);
                w.subWikifyTerm(e, /(@@)/mg);
                break;
            case "{{":
                var lookaheadRegExp = /\{\{[\s]*([\w]+[\s\w]*)[\s]*\{(\n?)/mg;
                lookaheadRegExp.lastIndex = w.matchStart;
                var lookaheadMatch = lookaheadRegExp.exec(w.source);
                if (lookaheadMatch) {
                    w.nextMatch = lookaheadRegExp.lastIndex;
                    e = createTiddlyElement(w.output, lookaheadMatch[2] == "\n" ? "div" : "span", null, lookaheadMatch[1]);
                    w.subWikifyTerm(e, /(\}\}\})/mg);
                }
                break;
        }
    }
},

{
    name: "mdash",
    match: "--",
    handler: function(w) {
        createTiddlyElement(w.output, "span").innerHTML = "&mdash;";
    }
},

{
    name: "lineBreak",
    match: "\\n|<br ?/?>",
    handler: function(w) {
        createTiddlyElement(w.output, "br");
    }
},

{
    name: "rawText",
    match: "\\\"{3}|<nowiki>",
    lookaheadRegExp: /(?:\"{3}|<nowiki>)((?:.|\n)*?)(?:\"{3}|<\/nowiki>)/mg,
    handler: function(w) {
        this.lookaheadRegExp.lastIndex = w.matchStart;
        var lookaheadMatch = this.lookaheadRegExp.exec(w.source);
        if (lookaheadMatch && lookaheadMatch.index == w.matchStart) {
            createTiddlyElement(w.output, "span", null, null, lookaheadMatch[1]);
            w.nextMatch = this.lookaheadRegExp.lastIndex;
        }
    }
},

{
    name: "htmlEntitiesEncoding",
    match: "(?:(?:&#?[a-zA-Z0-9]{2,8};|.)(?:&#?(?:x0*(?:3[0-6][0-9a-fA-F]|1D[c-fC-F][0-9a-fA-F]|20[d-fD-F][0-9a-fA-F]|FE2[0-9a-fA-F])|0*(?:76[89]|7[7-9][0-9]|8[0-7][0-9]|761[6-9]|76[2-7][0-9]|84[0-3][0-9]|844[0-7]|6505[6-9]|6506[0-9]|6507[0-1]));)+|&#?[a-zA-Z0-9]{2,8};)",
    handler: function(w) {
        createTiddlyElement(w.output, "span").innerHTML = w.matchText;
    }
}

];

//--
//-- Wikifier
//--

function getParser(tiddler, format) {
    if (tiddler) {
        if (!format)
            format = tiddler.fields["wikiformat"];
        var i;
        if (format) {
            for (i in config.parsers) {
                if (format == config.parsers[i].format)
                    return config.parsers[i];
            }
        } else {
            for (i in config.parsers) {
                if (tiddler.isTagged(config.parsers[i].formatTag))
                    return config.parsers[i];
            }
        }
    }
    return formatter;
}

function wikify(source, output, highlightRegExp, tiddler) {
    if (source) {
        var wikifier = new Wikifier(source, getParser(tiddler), highlightRegExp, tiddler);
        var t0 = new Date();
        wikifier.subWikify(output);
        if (tiddler && config.options.chkDisplayInstrumentation)
            displayMessage("wikify:" + tiddler.title + " in " + (new Date() - t0) + " ms");
    }
}

function wikifyStatic(source, highlightRegExp, tiddler, format) {
    var e = createTiddlyElement(document.body, "pre");
    e.style.display = "none";
    var html = "";
    if (source && source != "") {
        if (!tiddler)
            tiddler = new Tiddler("temp");
        var wikifier = new Wikifier(source, getParser(tiddler, format), highlightRegExp, tiddler);
        wikifier.isStatic = true;
        wikifier.subWikify(e);
        html = e.innerHTML;
        removeNode(e);
    }
    return html;
}

function wikifyPlain(title, theStore, limit) {
    if (!theStore)
        theStore = store;
    if (theStore.tiddlerExists(title) || theStore.isShadowTiddler(title)) {
        return wikifyPlainText(theStore.getTiddlerText(title), limit, tiddler);
    } else {
        return "";
    }
}

function wikifyPlainText(text, limit, tiddler) {
    if (limit > 0)
        text = text.substr(0, limit);
    var wikifier = new Wikifier(text, formatter, null, tiddler);
    return wikifier.wikifyPlain();
}

function highlightify(source, output, highlightRegExp, tiddler) {
    if (source) {
        var wikifier = new Wikifier(source, formatter, highlightRegExp, tiddler);
        wikifier.outputText(output, 0, source.length);
    }
}

function Wikifier(source, formatter, highlightRegExp, tiddler) {
    this.source = source;
    this.output = null;
    this.formatter = formatter;
    this.nextMatch = 0;
    this.autoLinkWikiWords = tiddler && tiddler.autoLinkWikiWords() == false ? false : true;
    this.highlightRegExp = highlightRegExp;
    this.highlightMatch = null;
    this.isStatic = false;
    if (highlightRegExp) {
        highlightRegExp.lastIndex = 0;
        this.highlightMatch = highlightRegExp.exec(source);
    }
    this.tiddler = tiddler;
}

Wikifier.prototype.wikifyPlain = function() {
    var e = createTiddlyElement(document.body, "div");
    e.style.display = "none";
    this.subWikify(e);
    var text = getPlainText(e);
    removeNode(e);
    return text;
};

Wikifier.prototype.subWikify = function(output, terminator) {
    try {
        if (terminator)
            this.subWikifyTerm(output, new RegExp("(" + terminator + ")", "mg"));
        else
            this.subWikifyUnterm(output);
    } catch (ex) {
        showException(ex);
    }
};

Wikifier.prototype.subWikifyUnterm = function(output) {
    var oldOutput = this.output;
    this.output = output;
    this.formatter.formatterRegExp.lastIndex = this.nextMatch;
    var formatterMatch = this.formatter.formatterRegExp.exec(this.source);
    while (formatterMatch) {
        // Output any text before the match
        if (formatterMatch.index > this.nextMatch)
            this.outputText(this.output, this.nextMatch, formatterMatch.index);
        // Set the match parameters for the handler
        this.matchStart = formatterMatch.index;
        this.matchLength = formatterMatch[0].length;
        this.matchText = formatterMatch[0];
        this.nextMatch = this.formatter.formatterRegExp.lastIndex;
        for (var t = 1; t < formatterMatch.length; t++) {
            if (formatterMatch[t]) {
                this.formatter.formatters[t - 1].handler(this);
                this.formatter.formatterRegExp.lastIndex = this.nextMatch;
                break;
            }
        }
        formatterMatch = this.formatter.formatterRegExp.exec(this.source);
    }
    if (this.nextMatch < this.source.length) {
        this.outputText(this.output, this.nextMatch, this.source.length);
        this.nextMatch = this.source.length;
    }
    this.output = oldOutput;
};

Wikifier.prototype.subWikifyTerm = function(output, terminatorRegExp) {
    var oldOutput = this.output;
    this.output = output;
    terminatorRegExp.lastIndex = this.nextMatch;
    var terminatorMatch = terminatorRegExp.exec(this.source);
    this.formatter.formatterRegExp.lastIndex = this.nextMatch;
    var formatterMatch = this.formatter.formatterRegExp.exec(terminatorMatch ? this.source.substr(0, terminatorMatch.index) : this.source);
    while (terminatorMatch || formatterMatch) {
        if (terminatorMatch && (!formatterMatch || terminatorMatch.index <= formatterMatch.index)) {
            if (terminatorMatch.index > this.nextMatch)
                this.outputText(this.output, this.nextMatch, terminatorMatch.index);
            this.matchText = terminatorMatch[1];
            this.matchLength = terminatorMatch[1].length;
            this.matchStart = terminatorMatch.index;
            this.nextMatch = this.matchStart + this.matchLength;
            this.output = oldOutput;
            return;
        }
        if (formatterMatch.index > this.nextMatch)
            this.outputText(this.output, this.nextMatch, formatterMatch.index);
        this.matchStart = formatterMatch.index;
        this.matchLength = formatterMatch[0].length;
        this.matchText = formatterMatch[0];
        this.nextMatch = this.formatter.formatterRegExp.lastIndex;
        for (var t = 1; t < formatterMatch.length; t++) {
            if (formatterMatch[t]) {
                this.formatter.formatters[t - 1].handler(this);
                this.formatter.formatterRegExp.lastIndex = this.nextMatch;
                break;
            }
        }
        terminatorRegExp.lastIndex = this.nextMatch;
        terminatorMatch = terminatorRegExp.exec(this.source);
        formatterMatch = this.formatter.formatterRegExp.exec(terminatorMatch ? this.source.substr(0, terminatorMatch.index) : this.source);
    }
    if (this.nextMatch < this.source.length) {
        this.outputText(this.output, this.nextMatch, this.source.length);
        this.nextMatch = this.source.length;
    }
    this.output = oldOutput;
};

Wikifier.prototype.outputText = function(place, startPos, endPos) {
    while (this.highlightMatch && (this.highlightRegExp.lastIndex > startPos) && (this.highlightMatch.index < endPos) && (startPos < endPos)) {
        if (this.highlightMatch.index > startPos) {
            createTiddlyText(place, this.source.substring(startPos, this.highlightMatch.index));
            startPos = this.highlightMatch.index;
        }
        var highlightEnd = Math.min(this.highlightRegExp.lastIndex, endPos);
        var theHighlight = createTiddlyElement(place, "span", null, "highlight", this.source.substring(startPos, highlightEnd));
        startPos = highlightEnd;
        if (startPos >= this.highlightRegExp.lastIndex)
            this.highlightMatch = this.highlightRegExp.exec(this.source);
    }
    if (startPos < endPos) {
        createTiddlyText(place, this.source.substring(startPos, endPos));
    }
};

//--
//-- Macro definitions
//--

config.macros.today.handler = function(place, macroName, params) {
    var now = new Date();
    var text = params[0] ? now.formatString(params[0].trim()) : now.toLocaleString();
    createTiddlyElement(place, "span", null, null, text);
};

config.macros.version.handler = function(place) {
    createTiddlyElement(place, "span", null, null, formatVersion());
};

config.macros.giewikiversion.handler = function(place) {
    createTiddlyElement(place, "span", null, null, formatVersion(giewikiVersion));
};

config.macros.list.handler = function(place, macroName, params) {
    var type = params[0] || "all";
    var list = document.createElement("ul");
    place.appendChild(list);
    if (this[type].prompt)
        createTiddlyElement(list, "li", null, "listTitle", this[type].prompt);
    var results;
    if (this[type].handler)
        results = this[type].handler(params);
	var ffs = store.fetchFromServer;
	store.fetchFromServer = false; // performance forbids
    for (var t = 0; t < results.length; t++) {
        var li = document.createElement("li");
        list.appendChild(li);
        createTiddlyLink(li, typeof results[t] == "string" ? results[t] : results[t].title, true);
    }
	store.fetchFromServer = ffs;
};

config.macros.list.all.handler = function(params) {
	var lazies = [];
	for (at in lazyLoadAll)
		lazies.push({ title: at });
	return store.reverseLookup("tags", "excludeLists", false, "title", lazies);
};

config.macros.list.missing.handler = function(params) {
    return store.getMissingLinks();
};

config.macros.list.orphans.handler = function(params) {
    return store.getOrphans();
};

config.macros.list.shadowed.handler = function(params) {
    return store.getShadowed();
};

config.macros.list.touched.handler = function(params) {
    return store.getTouched();
};

config.macros.list.filter.handler = function(params) {
    var filter = params[1];
    var results = [];
    if (filter) {
        var tiddlers = store.filterTiddlers(filter);
        for (var t = 0; t < tiddlers.length; t++)
            results.push(tiddlers[t].title);
    }
    return results;
};

config.macros.allTags.handler = function(place, macroName, params) {
    var tags = store.getTags(params[0]);
    var ul = createTiddlyElement(place, "ul");
    if (tags.length == 0)
        createTiddlyElement(ul, "li", null, "listTitle", this.noTags);
    for (var t = 0; t < tags.length; t++) {
        var title = tags[t][0];
        var info = getTiddlyLinkInfo(title);
        var li = createTiddlyElement(ul, "li");
        var btn = createTiddlyButton(li, title + " (" + tags[t][1] + ")", this.tooltip.format([title]), onClickTag, info.classes);
        btn.setAttribute("tag", title);
        btn.setAttribute("refresh", "link");
        btn.setAttribute("tiddlyLink", title);
    }
};

config.macros.timeline.handler = function(place, macroName, params) {
    var field = params[0] || "modified";
	var lazies = [];
	for (at in lazyLoadAll)
		lazies.push({ title: at, modified: Date.convertFromYYYYMMDDHHMM(lazyLoadAll[at]) });

    var tiddlers = store.reverseLookup("tags", "excludeLists", false, field, lazies);
    var lastDay = "";
    var last = params[1] ? tiddlers.length - Math.min(tiddlers.length, parseInt(params[1])) : 0;
    var dateFormat = params[2] || this.dateFormat;
    for (var t = tiddlers.length - 1; t >= last; t--) {
        var tiddler = tiddlers[t];
        var theDay = tiddler[field].convertToLocalYYYYMMDDHHMM().substr(0, 8);
        if (theDay != lastDay) {
            var ul = document.createElement("ul");
            place.appendChild(ul);
            createTiddlyElement(ul, "li", null, "listTitle", tiddler[field].formatString(dateFormat));
            lastDay = theDay;
        }
        createTiddlyElement(ul, "li", null, "listLink").appendChild(createTiddlyLink(place, tiddler.title, true));
    }
};

config.macros.tiddler.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
    params = paramString.parseParams("name", null, true, false, true);
    var names = params[0]["name"];
    var tiddlerName = names[0];
    var className = names[1] || null;
    var args = params[0]["with"];
    var wrapper = createTiddlyElement(place, "span", null, className);
    if (!args) {
        wrapper.setAttribute("refresh", "content");
        wrapper.setAttribute("tiddler", tiddlerName);
    }
    var text = store.getTiddlerText(tiddlerName);
    if (text) {
        var stack = config.macros.tiddler.tiddlerStack;
        if (stack.indexOf(tiddlerName) !== -1)
            return;
        stack.push(tiddlerName);
        try {
            var n = args ? Math.min(args.length, 9) : 0;
            for (var i = 0; i < n; i++) {
                var placeholderRE = new RegExp("\\$" + (i + 1), "mg");
                text = text.replace(placeholderRE, args[i]);
            }
            config.macros.tiddler.renderText(wrapper, text, tiddlerName, params);
        } finally {
            stack.pop();
        }
    }
};

config.macros.tiddler.renderText = function(place, text, tiddlerName, params) {
    wikify(text, place, null, store.getTiddler(tiddlerName));
};

config.macros.tiddler.tiddlerStack = [];

config.macros.tag.handler = function(place, macroName, params) {
    createTagButton(place, params[0], null, params[1], params[2]);
};

config.macros.tags.handler = function (place, macroName, params, wikifier, paramString, tiddler) {
	params = paramString.parseParams("anon", null, true, false, false);
	var ul = document.createElement("ul");
	var title = getParam(params, "anon", "");
	if (title && store.tiddlerExists(title))
		tiddler = store.getTiddler(title);
	var sep = getParam(params, "sep", " ");
	var lingo = config.views.wikified.tag;
	var lt = createTiddlyElement(ul, "li", null, "listTitle");
	OfferServersideTagSearch(lingo.labelTags, lt, null, tiddler.tags);
	var nts = 0;
	for (var t = 0; t < tiddler.tags.length; t++) {
		if (visibleTag(tiddler.tags[t])) {
			nts++;
			createTagButton(createTiddlyElement(ul, "li"), tiddler.tags[t], tiddler.title);
			if (t < tiddler.tags.length - 1)
				createTiddlyText(ul, sep);
		}
	}
	if (nts > 0)
		place.appendChild(ul);
	else
		removeNode(place);
};

config.macros.tagging.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
	params = paramString.parseParams('anon', null, true, false, false);
	var ul = createTiddlyElement(place, 'ul');
	var title = getParam(params, 'anon', "");
	if (title == "" && tiddler instanceof Tiddler)
		title = tiddler.title;
	var sep = getParam(params, 'sep', " ");
	ul.setAttribute('title', this.tooltip.format([title]));
	var tagged = store.getTaggedTiddlers(title);
	var prompt = tagged.length == 0 ? this.labelNotTag : this.label;
	createTiddlyElement(ul, 'li', null, 'listTitle', prompt.format([title, tagged.length]));
	for (var t = 0; t < tagged.length; t++) {
		createTiddlyLink(createTiddlyElement(ul, 'li'), tagged[t].title, true);
		if (t < tagged.length - 1)
			createTiddlyText(ul, sep);
	}
	var lt = createTiddlyElement(ul, "li", null, "listTitle");
	OfferServersideTagSearch("Site-wide..", ul, title);
};

function DoServerSideTagSearch(ev) {
	var tli = resolveTarget(ev || window.event).parentNode;
	var tiddlerElem = story.findContainingTiddler(tli);
	var tn = tiddlerElem.getAttribute("tiddler");
	var st = tn ? store.getTiddler(tn) : null;

	var ulp = tli.parentNode;
	var tags = tli.getAttribute('tags');
	var lta = { };
	if (tags)
		lta.tags = tags.split('\n');
	else
		lta.tag = tli.getAttribute('tag');
	if (st)
		lta.excl = st.id;

	var ttr = http.listTiddlersTagged(lta);
	if (ttr.success) {
		if (ttr.mt) {
			for (var te = tli.parentNode.firstChild; te; te = te.nextSibling) {
				if (te.nodeType != 1 || te.firstChild == null)
					continue;
				var tec = te.firstChild;
				if (tec.nodeType == 1 && tec.getAttribute('class') == 'button') {
					for (var i = 0; i < ttr.tl.length; i++)
						if (ttr.tl[i].tag == tec.firstChild.nodeValue) {
							createTiddlyText(tec,"*");
							config.tagLinksAdd(tec.firstChild.nodeValue, ttr.tl[i]);
						}
				}
			}
		}
		else
			for (var etl = 0; etl < ttr.tl.length; etl++) {
				createTiddlyText(createExternalLink(createTiddlyElement(ulp, "li"), ttr.tl[etl].link),ttr.tl[etl].page + ": " + ttr.tl[etl].title);
			}
		tli.parentNode.removeChild(tli);
	}
}

function OfferServersideTagSearch(label, swli, tag, tags)
{
	var tt = "Server-side search for ";
	if (tags) {
		swli.setAttribute('tags',tags.join('\n'));
		tt = tt + "tags";
	} else {
		swli.setAttribute('tag',tag);
		tt = tt + "tag '" + tag + "'";
	}
	createTiddlyButton(swli,label, tt, DoServerSideTagSearch, 'tagmenu');
}

config.macros.closeAll.handler = function(place) {
    createTiddlyButton(place, this.label, this.prompt, this.onClick);
};

config.macros.button = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		if (eval(params[0]) == false)
			return;
		var attrs = false;
		if (params.length > 7)
			attrs = eval(params[7]);
		else if (params[4] && params[4].indexOf('externalLink') >= 0)
			attrs = { target: '_blank' };
		createTiddlyButton(place, params[1], params[2], params[3], params[4], params[5], params[6], attrs);
	}
};

config.macros.closeAll.onClick = function(e) {
    story.closeAllTiddlers();
    return false;
};

config.macros.permaview.handler = function(place)
{
	createTiddlyButton(place,this.label,this.prompt,this.onClick);
};

config.macros.permaview.onClick = function(e)
{
	story.permaView();
	return false;
};

function onAddTagClick(ev) {
	var target = resolveTarget(ev || window.event);
	var where = target.parentNode.parentNode.parentNode;
	var tiddlerElem = story.findContainingTiddler(target);
	var title = tiddlerElem.getAttribute('tiddler');
	var st = store.getTiddler(title);
	
    var wrapper1 = createTiddlyElement(where,'fieldset');
    createTiddlyElement(wrapper1,'legend',null,null,"Add tags");
    e = createTiddlyElement(wrapper1, 'textarea',null,'commentArea',null,{rows: 1, edit: 'tags'});
	efs = createTiddlyElement(wrapper1,'span',null,'editorFooter');
	createTiddlyText(efs,config.views.editor.tagPrompt);
	config.macros.tagChooser.handler(efs, null, null, null, null, st);
    createTiddlyElement(wrapper1,'HR');
    var wrtb = createTiddlyElement(wrapper1,'div',null,'toolbar');
	var onSave = function(e) {
		var tg = resolveTarget(e || window.event);
		var afi = [];
		if (getElementsByClassName('commentArea',null,where,afi)) {
			var ars = http.addTags({id: st.id, version: st.version, atag: afi[0].value.readBracketedList() });
			if (ars.success) {
				st.tags = ars.tags.readBracketedList();
				store.notify(title,true);
			}
		}
		story.displayTiddler(null, title, DEFAULT_VIEW_TEMPLATE);
	};
	var onCancel = function(e) {
		wrapper1.parentNode.removeChild(wrapper1);
	};
    
    var smbtn = createTiddlyButton(wrtb,"submit","Save comment",onSave,"defaultCommand");
    addClass(smbtn,"button");
    var ccbtn = createTiddlyButton(wrtb,"cancel","Cancel comment",onCancel,"cancelCommand");
    addClass(ccbtn,"button");
	var kph = function(ev) {
		var e = ev || window.event;
			switch (e.keyCode) {
				case 27: // Esc
					onCancel(e);
					return false;
				default:
					return true;
		}
	};
	e[window.event ? "onkeydown" : "onkeypress"] = kph;
	e.focus();
	return e;
}

config.macros.comments.addToolbar = function(cmc,ced,tiddler) {
	if (tiddler.comments)
		var ccb = createTiddlyButton(ced, cmc.listLabel.format([tiddler.comments]), cmc.listPrompt, cmc.onListClick);
	if (tiddler.messages)
		createTiddlyButton(ced, cmc.messagesLabel.format([tiddler.messages]), cmc.notesPrompt, cmc.onMessagesClick);
	if (tiddler.Notes())
		createTiddlyButton(ced, cmc.notesLabel.format([tiddler.Notes()]), cmc.notesPrompt, cmc.onNotesClick);

	if (config.access == "view") return;
	createTiddlyButton(ced, cmc.addCommentLabel, cmc.addCommentPrompt, cmc.onAddCommentClick);
	createTiddlyButton(ced, cmc.addMessageLabel, cmc.addMessagePrompt, cmc.onAddMessageClick);
	createTiddlyButton(ced, cmc.addNoteLabel, cmc.addNotePrompt, cmc.onAddNoteClick);
	if (config.access == "comment") return;
	createTiddlyButton(ced, cmc.addTagLabel, cmc.addTagPrompt, onAddTagClick);
};

config.macros.comments.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
	if (tiddler.from && !tiddler.from.startsWith('/')) // cannot comment on foreign tiddlers	
		return;
	this.addToolbar(this,createTiddlyElement(place,"div",null,"commentToolbar"),tiddler);
	var cl = CommentList[tiddler.title];
	if (cl) {
		config.macros.comments.onListClick(null,place,cl);
	} 
};

function PreNextCommentRow(tre) {
	for (var nxs = tre.nextSibling; nxs && nxs.firstChild.className != 'dateColumn'; nxs = nxs.nextSibling)
		tre = nxs;
	return tre;
}

config.macros.comments.showReplies = function (ev) {
	var target = resolveTarget(ev || window.event);
	var tde = target.parentNode;
	var tr = tde.parentNode.parentNode;
	var ndt = tr.firstChild.firstChild.firstChild.nodeValue;
	if (target.getAttribute('shown') == 'true') {
		var nri = null;
		for (var ri = tr.nextSibling; ri; ri = nri) {
			nri = ri.nextSibling;
			if (ri.getAttribute('ref') == ndt)
				ri.parentNode.removeChild(ri);
		}
		target.setAttribute('shown', 'false');
	}
	else {
		var rowClass = tr.className;
		var tidlr = story.findContainingTiddler(target);
		var t = store.getTiddler(tidlr.getAttribute("tiddler"));
		config.macros.comments.listComments(tidlr, t.getComments(), true,
			function () { return rowClass },
			function (c) { return c.ref == ndt },
			PreNextCommentRow(tr));
		target.setAttribute('shown', 'true');
	}
}

config.macros.comments.CclassPicker = function(r) { return r & 1 ? "oddRowComment":"evenRowComment" };
config.macros.comments.MclassPicker = function(r) { return r & 1 ? "oddRowMessage":"evenRowMessage" };
config.macros.comments.NclassPicker = function(r) { return r & 1 ? "oddRowNote":"evenRowNote" };
config.macros.comments.onListClick = function(ev,tg,comments) {
    var target = tg || resolveTarget(ev || window.event);
    var tidlr = story.findContainingTiddler(target);
    var t = store.getTiddler(tidlr.getAttribute("tiddler"));
    config.macros.comments.listComments(tidlr,comments || t.getComments(),false,config.macros.comments.CclassPicker,function(t) { return t.ref == "" || t.ref === undefined; });
};

config.macros.comments.onNotesClick = function(ev) {
    var target = resolveTarget(ev || window.event);
    var tidlr = story.findContainingTiddler(target);
    var t = store.getTiddler(tidlr.getAttribute("tiddler"));
    config.macros.comments.listComments(tidlr,t.notes,false,config.macros.comments.NclassPicker,function(t) { return true; });
}

config.macros.comments.onMessagesClick = function(ev) {
    var target = resolveTarget(ev || window.event);
    var tidlr = story.findContainingTiddler(target);
    var t = store.getTiddler(tidlr.getAttribute("tiddler"));
    config.macros.comments.listComments(tidlr,t.getMessages(),false,config.macros.comments.MclassPicker,function(t) { return true; });
}

function findOrCreateChildElement(parent, element, id, className, text, attribs, preserve) {
	for (var cni = 0; cni < parent.childNodes.length; cni++)
		if (parent.childNodes[cni].className == className) {
			if (preserve)
				return parent.childNodes[cni];
			else {
				parent.removeChild(parent.childNodes[cni]);
				break;
			}
		}
	if (element)
		return createTiddlyElement(parent, element, id, className, text, attribs);
}

function insertAfter(referenceNode, newNode)
{
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	return newNode;
}

config.macros.comments.repliesMessage = function(n)
{
	if (n == 1)
		return "1 reply";
	if (n > 1)
		return n + " replies";
	return "";
};

config.macros.comments.addCommentTableRow = function (tbe, className, after, when, who, replies, row, id, ref) {
	var trc = className ? className(row) : (row & 1 ? "oddRow" : "evenRow");
	var allowEdit = config.options.txtUserName == who && row > 0;
	var tda = {};
	var tr = createTiddlyElement(null, "tr", id, trc);
	if (after) {
		insertAfter(after, tr);
		var pie = parseInt(after.getAttribute("sub")) + 1;
	}
	else {
		tbe.appendChild(tr);
		var pie = 0;
	}
	if (ref)
		tr.setAttribute('ref', ref);
	tr.setAttribute('sub', pie);
	var tdd = createTiddlyElement(tr, "td", null, "dateColumn", null, tda);
	var led = createTiddlyButton(tdd, config.macros.comments.formatDateTime(when), "Click to reply", config.macros.comments.replyClick, "dateOfComment");
	tdd.setAttribute('timestamp', when);
	var aue = createTiddlyElement(tr, "td", null, null, who, tda);
	if (pie)
		aue.style.paddingLeft = pie + "em";
	createTiddlyElement(aue, "br");
	var nobr = createTiddlyElement(aue, 'nobr');
	createTiddlyButton(nobr,
			config.macros.comments.repliesMessage(replies),
			"Show replies", config.macros.comments.showReplies, 'btnReplies');
	if (allowEdit) {
		createTiddlyButton(nobr, "edit", "edit comment", config.macros.comments.editHandler, 'btnCommentTool');
		createTiddlyButton(nobr, "delete", "delete this", config.macros.comments.purgeHandler, 'btnCommentTool');
	}
	var tde = createTiddlyElement(tr, 'td', null, 'commentText');
	if (pie)
		tde.style.paddingLeft = pie + "em";
	return tde;
};

CommentList = [];

config.macros.comments.listComments = function (where, list, preserve, className, filter, after) {
	var sarr = [];
	if (getElementsByClassName('comments', null, where, sarr) == 1) {
		var cte = sarr[0];
		var twe = findOrCreateChildElement(cte, 'div', null, 'tableWrapper', null, null, preserve);
		if (!twe.firstChild)
			twe.innerHTML = "<table class='commentTable'><col style='width:5.3em'/><col style='width: 4.5em'/></table>"; // IE fix
		var tae = twe.firstChild;

		var tbe = findOrCreateChildElement(tae, 'tbody', null, 'commentTableBody', null, null, true);
		var rc = 0;
		var title = where.getAttribute('tiddler');
		if (!CommentList[title])
			CommentList[title] = []

		var lister = function (aco) {
			if (typeof (aco) == 'object') {
				CommentList[title][aco.id] = aco;
				if (filter(aco)) {
					var tde = config.macros.comments.addCommentTableRow(tbe, className, after, aco.created, aco.author, aco.refs, ++rc, aco.id, aco.ref);
					wikify(aco.text, tde);
				}
			}
		};

		for (var i in list)
			lister(list[i]);
	}
}

config.macros.comments.formatDateTime = function(dt) {
	if (typeof dt == 'string')
		return dt.substr(0,19);
	else
		return dt.formatString("YYYY-0MM-0DD 0hh:0mm:0ss");
}

config.macros.comments.onShowClick = function(e) {
    displayMessage("show comments");
    return false;
};

config.macros.comments.createInputBox = function(where, caption, onSave, onCancel, cid) {
    var wrapper1 = createTiddlyElement(where,"fieldset");
    createTiddlyElement(wrapper1,"legend",null,null,caption);
    e = createTiddlyElement(wrapper1, "textarea",null,"commentArea",null,{rows: 5});
    createTiddlyElement(wrapper1,"HR");
    var wrtb = createTiddlyElement(wrapper1, "div",null,"toolbar");
    
    var smbtn = createTiddlyButton(wrtb,"submit","Save comment",onSave,"defaultCommand",cid);
    addClass(smbtn,"button");
    var ccbtn = createTiddlyButton(wrtb,"cancel","Cancel comment",onCancel,"cancelCommand");
    addClass(ccbtn,"button");
	var kph = function(ev) {
		var e = ev || window.event;
			var tar = resolveTarget(e);
			var capp = tar.parentNode;
			var ise = capp.firstChild.innerText == "Edit comment";
			switch (e.keyCode) {
				case 27: // Esc
					onCancel(e);
					return false;
				default:
					return true;
		}
	};
	e[window.event ? "onkeydown" : "onkeypress"] = kph;
	e.focus();
	return e;
}

config.macros.comments.onAddCommentClick = function(ev) {
    var target = resolveTarget(ev || window.event);
    config.macros.comments.createInputBox(target.parentNode.parentNode.parentNode, "Your comment",config.macros.comments.onSaveCommentClick,config.macros.comments.onCancelCommentClick);
    return false;
};

config.macros.comments.onAddMessageClick = function(ev) {
    var target = resolveTarget(ev || window.event);
    config.macros.comments.createInputBox(target.parentNode.parentNode.parentNode, "Your message",config.macros.comments.onSaveMessageClick,config.macros.comments.onCancelCommentClick);
    return false;
};

config.macros.comments.onAddNoteClick = function(ev) {
    var target = resolveTarget(ev || window.event);
    config.macros.comments.createInputBox(target.parentNode.parentNode.parentNode, "Your note",config.macros.comments.onSaveNoteClick,config.macros.comments.onCancelCommentClick);
    return false;
};

config.macros.comments.onSaveCommentClick = function(ev) { return config.macros.comments.onSaveClick(ev,'C',config.macros.comments.CclassPicker); }
config.macros.comments.onSaveMessageClick = function(ev) { return config.macros.comments.onSaveClick(ev, 'M',config.macros.comments.MclassPicker); }
config.macros.comments.onSaveNoteClick = function(ev) { return config.macros.comments.onSaveClick(ev, 'N',config.macros.comments.NclassPicker); }

config.macros.comments.onSaveClick = function (ev, type, cp) {
	var target = resolveTarget(ev || window.event);
	var tnv = target.parentNode.parentNode.childNodes[1].value;
	var tidlr = story.findContainingTiddler(target);
	var tna = tidlr.getAttribute("tiddler");
	var t = store.getTiddler(tna);
	var sr = t.addComment(tnv, type);
	if (sr && sr.success) {
		var sarr = [];
		if (getElementsByClassName('commentToolbar',null,tidlr,sarr) == 1) {
			var cte = sarr[0];
			removeChildren(cte);
			config.macros.comments.addToolbar(this,cte,t);
		}
		config.macros.comments.onCancelCommentClick(ev);
		config.macros.comments.listComments(tidlr, [sr], true, cp, function (c) { return true; });
	}
}

config.macros.comments.onCancelCommentClick = function(ev) {
	config.macros.comments.removeCommentPrompt(ev);
}

config.macros.comments.removeCommentPrompt = function(ev) {
    var e = ev || window.event;
    var t = resolveTarget(e);
    for (var p = t.parentNode; t.tagName != "FIELDSET"; p = p.parentNode)
        t = p;
    p.removeChild(t);
    return p;
};

config.macros.comments.onSaveReplyClick = function (ev) {
	var e = ev || window.event;
	var target = resolveTarget(e);
	var cid = target.id;
	var tidlr = story.findContainingTiddler(target);
	var tna = tidlr.getAttribute("tiddler");
	var tnv = target.parentNode.parentNode.childNodes[1].value;
	var t = store.getTiddler(tna);
	var td = config.macros.comments.removeCommentPrompt(ev);
	var tr = td.parentNode;
	var sr = http.submitComment({ text: tnv, tiddler: t.id, version: t.currentVer, ref: td.id });
	if (sr.success) {
		CommentList[t.title][sr.id] = sr;
		tr.setAttribute('id', sr.id);
		tr.firstChild.firstChild.innerText = config.macros.comments.formatDateTime(sr.created);
		var rc2 = tr.firstChild.nextSibling;
		createTiddlyElement(rc2, "br");
		var nobr = createTiddlyElement(rc2, 'nobr');
		createTiddlyButton(nobr, "edit", "edit reply", config.macros.comments.editHandler, 'btnCommentTool');
		tr.removeChild(td);
		var cel = document.getElementById(cid);
		createTiddlyElement(tr, "td", null, "commentText", tnv);

		var tcl = t.commentList;
		for (var i = 0; i < tcl.length; i++) {
			if (tcl[i].created.startsWith(td.id)) {
				tcl[i].refs++;
				var mea = [];
				if (getElementsByClassName('btnReplies', null, cel, mea))
					mea[0].innerText = config.macros.comments.repliesMessage(tcl[i].refs);
				break;
			}
		}
	}
};

config.macros.comments.replyClick = function(ev) {
    var t = resolveTarget(ev || window.event);
    var tre = t.parentNode.parentNode;
    var ref = tre.firstChild.innerText;
	var tdc = config.macros.comments.addCommentTableRow(null,
		function() { return tre.className },
		PreNextCommentRow(tre),
		new Date(),config.options.txtUserName,0,0);
	tdc.id = ref;
	var cah = function(ev) {
	var t = resolveTarget(ev || window.event);
		for (var pe = t.parentNode; pe.tagName != 'TBODY'; pe = npe) {
			var npe = pe.parentNode;
			npe.removeChild(pe);
		}
	};
	config.macros.comments.createInputBox(tdc, "Your reply",config.macros.comments.onSaveReplyClick,cah,tre.id);
};

config.macros.comments.purgeHandler = function(ev,tiddler) {
	var tae = resolveTarget(ev || window.event);
	var tse = tae.parentElement.parentElement.previousSibling;
	var tre = tse.parentElement;
	if (tse.className == "dateColumn") {
		var ct = story.findContainingTiddler(tre);
		var tn = ct.getAttribute('tiddler');
		var t = store.fetchTiddler(tn);
		var dcr = http.deleteComment({comment: tre.id, tiddlerId: t.id });
		if (dcr.success) {
			t.comments--;
			var sarr = [];
			if (getElementsByClassName('commentToolbar',null,ct,sarr) == 1)
				sarr[0].childNodes[0].innerText = t.comments + " comments";
			config.macros.comments.listComments(ct,t.getComments(false,dcr),false,config.macros.comments.CclassPicker,function(t) { return t.ref == "" });
		}
	}
};

config.macros.comments.editHandler = function(ev,tiddler) {
	var tae = resolveTarget(ev || window.event);
	var tte = tae.parentElement.parentElement;
	var tse = tte.previousSibling;
	var tre = tse.parentElement;
	if (tse.className == "dateColumn") {
		var cid = tre.getAttribute('id');
		var ct = story.findContainingTiddler(tre);
		var tn = ct.getAttribute('tiddler');
		var cca = CommentList[tn];
		var cx = cca[cid];
		var ate = [];
		if (getElementsByClassName('commentText','*',tre,ate))
		{
			var twe = ate[0];
			var ctx = { tco: cx, cls: twe.className };
			var rest = function(ev,text) {
				var awn = [];
				if (getElementsByClassName('commentText','*',ctx.pe,awn)) {
					var pe = awn[0].parentElement;
					pe.removeChild(awn[0]);
					var tde = createTiddlyElement(pe,'td',null,'commentText');
					wikify(text,tde);
					var ne = pe.nextSibling;
					removeChildren(ne);
				}
			};
			var onSave = function(ev) {
				http.alterComment({ comment: ctx.tco.id, text: ctx.ee.value });
				var ct = story.findContainingTiddler(resolveTarget(ev || window.event));
				var tn = ct.getAttribute('tiddler');
				var tcl = store.getTiddler(tn).commentList;
				for (var i = 0; i < tcl.length; i++) {
					if (tcl[i].id == ctx.tco.id) {
						tcl[i].text = ctx.ee.value; break;
					}
				}
				rest(ev,ctx.ee.value);
			};
			var onCancel = function(ev) {
				if (ctx.ee.value != ctx.tco.text)
					if (!window.confirm("Cancel..?"))
						return;
				rest(ev,ctx.tco.text);
			};
			var twn = tte.nextSibling;
			removeChildren(twn.firstChild);
			removeChildren(twe);
			var ee = config.macros.comments.createInputBox(twe,"Edit comment",onSave, onCancel);
			ee.value = cx.text;
			ctx.ee = ee;
			ctx.pe = twe.parentElement;
		}
	}
};

config.macros.slider.onClickSlider = function(ev) {
    var e = ev || window.event;
    var n = this.nextSibling;
    var cookie = n.getAttribute("cookie");
    var isOpen = n.style.display != "none";
    if (config.options.chkAnimate && anim && typeof Slider == "function")
        anim.startAnimating(new Slider(n, !isOpen, null, "none"));
    else
        n.style.display = isOpen ? "none" : "block";
    config.options[cookie] = !isOpen;
    return false;
};

config.macros.slider.createSlider = function(place, cookie, title, tooltip) {
    var c = cookie || "";
    var btn = createTiddlyButton(place, title, tooltip, this.onClickSlider);
    var panel = createTiddlyElement(null, "div", null, "sliderPanel");
    panel.setAttribute("cookie", c);
    panel.style.display = config.options[c] ? "block" : "none";
    place.appendChild(panel);
    return panel;
};

config.macros.slider.handler = function(place, macroName, params) {
    var panel = this.createSlider(place, params[0], params[2], params[3]);
    var text = store.getTiddlerText(params[1]);
    panel.setAttribute("refresh", "content");
    panel.setAttribute("tiddler", params[1]);
    if (text)
        wikify(text, panel, null, store.getTiddler(params[1]));
};

// <<gradient [[tiddler name]] vert|horiz rgb rgb rgb rgb... >>
config.macros.gradient.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
    var panel = wikifier ? createTiddlyElement(place, "div", null, "gradient") : place;
    panel.style.position = "relative";
    panel.style.overflow = "hidden";
    panel.style.zIndex = "0";
    if (wikifier) {
        var styles = config.formatterHelpers.inlineCssHelper(wikifier);
        config.formatterHelpers.applyCssHelper(panel, styles);
    }
    params = paramString.parseParams("color");
    var locolors = [], hicolors = [];
    for (var t = 2; t < params.length; t++) {
        var c = new RGB(params[t].value);
        if (params[t].name == "snap") {
            hicolors[hicolors.length - 1] = c;
        } else {
            locolors.push(c);
            hicolors.push(c);
        }
    }
    drawGradient(panel, params[1].value != "vert", locolors, hicolors);
    if (wikifier)
        wikifier.subWikify(panel, ">>");
    if (document.all) {
        panel.style.height = "100%";
        panel.style.width = "100%";
    }
};

config.macros.message.handler = function(place, macroName, params) {
    if (params[0]) {
        var names = params[0].split(".");
        var lookupMessage = function(root, nameIndex) {
            if (names[nameIndex] in root) {
                if (nameIndex < names.length - 1)
                    return (lookupMessage(root[names[nameIndex]], nameIndex + 1));
                else
                    return root[names[nameIndex]];
            } else
                return null;
        };
        var m = lookupMessage(config, 0);
        if (m == null)
            m = lookupMessage(window, 0);
        createTiddlyText(place, m.toString().format(params.splice(1)));
    }
};


config.macros.view.views = {
    text: function(value, place, params, wikifier, paramString, tiddler) {
        highlightify(value, place, highlightHack, tiddler);
    },
    link: function(value, place, params, wikifier, paramString, tiddler) {
        createTiddlyLink(place, value, true);
    },
    wikified: function(value, place, params, wikifier, paramString, tiddler) {
        if (params[2])
            value = params[2].unescapeLineBreaks().format([value]);
        wikify(value, place, highlightHack, tiddler);
    },
    bool: function (value, place, params, wikifier, paramString, tiddler) {
		var se = createTiddlyElement(place,'span');
		se.innerHTML = value && value != 'false' ? '&#10003' : '<b>-</b>';
	},
    date: function(value, place, params, wikifier, paramString, tiddler) {
		if (value == null) return;
        value = Date.convertFromYYYYMMDDHHMM(value);
        createTiddlyText(place, value.formatString(params[2] ? params[2] : config.views.wikified.dateFormat));
    }
};

config.macros.view.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
	var fn = params[0];
    if ((tiddler instanceof Tiddler) && fn) {
        var value = store.getValue(tiddler, fn);
		if (!value && fn == 'title') // workaround for newTiddler.title being ""
			value = tiddler.caption || "New tiddler";
        if (value) {
			if (params[3]) createTiddlyText(place,params[3]);
            var type = params[1] || config.macros.view.defaultView;
            var handler = config.macros.view.views[type];
            if (handler)
                handler(value, place, params, wikifier, paramString, tiddler);
        }
    }
};

config.macros.edit.handler = function (place, macroName, params, wikifier, paramString, tiddler) {
	var fa = params[1];
	if (fa && isNaN(fa))
		return config.macros.input.handler(place, macroName, params, wikifier, paramString, tiddler);

	var field = params[0];
	var rows = fa || 0;

	var defVal = params[2] || '';
	if ((tiddler instanceof Tiddler) && field) {
		story.setDirty(tiddler.title, true);
		var e, v;
		if (field != "text" && !rows) {
			e = createTiddlyElement(null, "input");
			if (tiddler.isReadOnly())
				e.setAttribute("readOnly", "readOnly");
			e.setAttribute("edit", field);
			e.setAttribute("type", "text");
			e.value = store.getValue(tiddler, field) || defVal;
			e.setAttribute("size", "40");
			e.setAttribute("autocomplete", "off");
			place.appendChild(e);
		} else {
			var wrapper1 = createTiddlyElement(null, "fieldset", null, "fieldsetFix");
			var wrapper2 = createTiddlyElement(wrapper1, "div");
			e = createTiddlyElement(wrapper2, "textarea");
			if (tiddler.isReadOnly())
				e.setAttribute("readOnly", "readOnly");
			e.value = v = store.getValue(tiddler, field) || defVal;
			rows = rows || 10;
			var lines = v.match(/\n/mg);
			var maxLines = Math.max(parseInt(config.options.txtMaxEditRows), 5);
			if (lines != null && lines.length > rows)
				rows = lines.length + 5;
			rows = Math.min(rows, maxLines);
			e.setAttribute("rows", rows);
			e.setAttribute("edit", field);
			place.appendChild(wrapper1);
		}
		return e;
	}
};

config.macros.tagChooser.onClick = function(ev) {
    var e = ev || window.event;
    var lingo = config.views.editor.tagChooser;
    var popup = Popup.create(this);
	var preList = [];
	for (var i = 0; i < config.tiddlerTags.length; i++)
		preList.push([config.tiddlerTags[i],0])
    var tags = store.getTags("excludeLists",preList);
    if (tags.length == 0)
        createTiddlyText(createTiddlyElement(popup, "li"), lingo.popupNone);
    for (var t = 0; t < tags.length; t++) {
        var tag = createTiddlyButton(createTiddlyElement(popup, "li"), tags[t][0], lingo.tagTooltip.format([tags[t][0]]), config.macros.tagChooser.onTagClick);
        tag.setAttribute("tag", tags[t][0]);
        tag.setAttribute("tiddler", this.getAttribute("tiddler"));
    }
    Popup.show();
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
    return false;
};

config.macros.tagChooser.onTagClick = function(ev) {
    var e = ev || window.event;
    if (e.metaKey || e.ctrlKey) stopEvent(e); //# keep popup open on CTRL-click
    var tag = this.getAttribute("tag");
    var title = this.getAttribute("tiddler");
    if (!readOnly)
        story.setTiddlerTag(title, tag, 0);
    return false;
};

config.macros.tagChooser.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
    if (tiddler instanceof Tiddler) {
        var lingo = config.views.editor.tagChooser;
        var btn = createTiddlyButton(place, lingo.text, lingo.tooltip, this.onClick);
        btn.setAttribute("tiddler", tiddler.title);
    }
};

config.macros.refreshDisplay.handler = function(place) {
    createTiddlyButton(place, this.label, this.prompt, this.onClick);
};

config.macros.refreshDisplay.onClick = function(e) {
    refreshAll();
    return false;
};

config.macros.annotations.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
    var title = tiddler ? tiddler.title : null;
    var a = title ? config.annotations[title] : null;
    if (!tiddler || !title || !a)
        return;
    var text = a.format([title]);
    wikify(text, createTiddlyElement(place, "div", null, "annotation"), null, tiddler);
};

//--
//-- NewTiddler and NewJournal macros
//--

config.macros.newTiddler.createNewTiddlerButton = function(place, title, params, label, prompt, accessKey, newFocus, isJournal) {
    var tags = [];
    for (var t = 1; t < params.length; t++) {
        if ((params[t].name == "anon" && t != 1) || (params[t].name == "tag"))
            tags.push(params[t].value);
    }
    label = getParam(params, "label", label);
    prompt = getParam(params, "prompt", prompt);
    accessKey = getParam(params, "accessKey", accessKey);
    newFocus = getParam(params, "focus", newFocus);
    var customFields = getParam(params, "fields", "");
    if (!customFields && !store.isShadowTiddler(title))
        customFields = String.encodeHashMap(config.defaultCustomFields);
    var btn = createTiddlyButton(place, label, prompt, this.onClickNewTiddler, null, null, accessKey);
    btn.setAttribute("newTitle", title);
    btn.setAttribute("isJournal", isJournal ? "true" : "false");
    if (tags.length > 0)
        btn.setAttribute("params", tags.join("|"));
    btn.setAttribute("newFocus", newFocus);
    btn.setAttribute("newTemplate", getParam(params, "template", DEFAULT_EDIT_TEMPLATE));
    if (customFields !== "")
        btn.setAttribute("customFields", customFields);
    var text = getParam(params, "text");
    if (text !== undefined)
        btn.setAttribute("newText", text);
    return btn;
};

config.macros.newTiddler.onClickNewTiddler = function() {
    var title = this.getAttribute("newTitle");
    if (this.getAttribute("isJournal") == "true") {
        title = new Date().formatString(title.trim());
    }
    var params = this.getAttribute("params");
    var tags = params ? params.split("|") : [];
    var focus = this.getAttribute("newFocus");
    var template = this.getAttribute("newTemplate");
    var customFields = this.getAttribute("customFields");
    if (!customFields && !store.isShadowTiddler(title))
        customFields = String.encodeHashMap(config.defaultCustomFields);
    story.displayTiddler(null, title, template, false, null, null);
    var tiddlerElem = story.getTiddler(title);
    if (customFields)
        story.addCustomFields(tiddlerElem, customFields);
    var text = this.getAttribute("newText");
    if (typeof text == "string")
        story.getTiddlerField(title, "text").value = text.format([title]);
    for (var t = 0; t < tags.length; t++)
        story.setTiddlerTag(title, tags[t], +1);
    story.focusTiddler(title, focus);
    return false;
};

config.macros.newTiddler.handler = function(place, macroName, params, wikifier, paramString) {
    if (!readOnly) {
        params = paramString.parseParams("anon", null, true, false, false);
        var title = params[1] && params[1].name == "anon" ? params[1].value : this.title;
        title = getParam(params, "title", title);
        this.createNewTiddlerButton(place, title, params, this.label, this.prompt, this.accessKey, "title", false);
    }
};

config.macros.newJournal.handler = function(place, macroName, params, wikifier, paramString) {
    if (!readOnly) {
        params = paramString.parseParams("anon", null, true, false, false);
        var title = params[1] && params[1].name == "anon" ? params[1].value : config.macros.timeline.dateFormat;
        title = getParam(params, "title", title);
        config.macros.newTiddler.createNewTiddlerButton(place, title, params, this.label, this.prompt, this.accessKey, "text", true);
    }
};

//--
//-- Search macro
//--

config.macros.search.handler = function (place, macroName, params) {
	var searchTimeout = null;
	var txt = createTiddlyElement(place, "input", null, "txtOptionInput searchField");
	config.macros.search.inputBox = txt;
	createTiddlyElement(place, 'br');
	createTiddlyText(place, "in ");
	createTiddlyButton(place, this.pageLabel, this.prompt, this.onClick, "searchButton");
	if (location.pathname.indexOf('/',1) > 0)
		createTiddlyButton(place, this.areaLabel, "Sibling pages and folders", this.searchSite, "searchButton");
	createTiddlyButton(place, this.siteLabel, "All pages and folders", this.searchSite, "searchButton");
	createTiddlyText(place, " | ");
	var bto = createTiddlyButton(place, "options", "Search options", this.onOptions, "searchButton");
	if (params[0])
		txt.value = params[0];
	txt.onkeyup = this.onKeyPress;
	txt.onfocus = this.onFocus;
	txt.setAttribute("size", this.sizeTextbox);
	txt.setAttribute("accessKey", this.accessKey);
	txt.setAttribute("autocomplete", "off");
	txt.setAttribute("lastSearchText", "");
	if (config.browser.isSafari) {
		txt.setAttribute("type", "search");
		txt.setAttribute("results", "5");
	}
};

config.macros.search.syntaxCheck = function (a) {
	var qq = a.split('"');
	if (qq.length % 2 == 0)
		return displayMessage("Unmatched \" found!") && false;
	for (var pi = 0; pi < qq.length; pi += 2) {// check segments outside of "
		if (qq[pi].indexOf(',') >= 0)
			if (qq.length == 1) // no quotes already, so just quote all
				return '"' + a + '"';
			else
				return displayMessage("Query containing ',' must be in quotes") && false;
	}
	return a;
};

config.macros.search.searchSite = function (toe, offs, path) {
	if (typeof (toe) == 'string')
		var q = { text: toe, offset: offs, path: path };
	else if (toe && toe.updateaccess) { // Advanced search
		var qs = [];
		var spath = toe.path;
		for (var an in toe) {
			if (!(an == 'controls' || an == 'updateaccess' || an == 'path')) {
				var qrs = config.macros.search.syntaxCheck(toe[an]);
				if (typeof (qrs) != 'string')
					return;
				else if (qrs.length)
					qs.push(an + ':' + qrs);
			}
		}
		var q = {
			text: qs.join(' AND '),
			path: path ? spath : '/'
		}
	}
	else {
		var target = resolveTarget(toe || window.event);
		var q = {
			text: config.macros.search.syntaxCheck(config.macros.search.inputBox.value.toLowerCase()),
			path: target.innerText == config.macros.search.areaLabel ? window.location.pathname : "/"
		};
		if (typeof (q.text) != 'string')
			return;
	}
	q.snippets = config.options.chkSearchViewSnippets;
	q.date = config.options.chkSearchViewDate;
	if (config.options.chkShowManyResults)
		q.limit = 40;
	q.many = config.options.chkShowManyResults;
	var srtt = "SearchResult: " + q.text;
	config.NoSuchTiddlers.push(srtt);
	story.closeTiddler(srtt, true);
	var res = http.searchText(q);
	if (res.success) {
		var offset = parseInt(res.offset);
		var limit = parseInt(res.limit);
		var hits = parseInt(res.hits);
		var last = Math.min(offset + limit, hits);
		var status = (hits ? "(" + (1 + offset) + "-" + last + " of " + hits : "(No") + " hits in " + res.path + ")"
		var r = [status];
		var sniprow = '|>|>|<html>';
		var tht = "|page|title|";
		var tft = '|>| '
		if (config.options.chkSearchViewDate) {
			tht = "|date" + tht;
			tft = '|>' + tft;
			sniprow = '|>' + sniprow;
		}
		if (hits)
			r.push(tht);
		for (var i = 0; i < res.result.length; i++) {
			var ri = res.result[i];
			var link = ri.title;
			if (ri.page.startsWith('/ '))
				ri.page = ri.page.substring(1).replace(/ /g, '/');
			if (ri.page != location.pathname)
				link = link + '|' + ri.page + csqHighLight + encodeURIComponent(q.text) + '#' + encodeURIComponent(String.encodeTiddlyLink(ri.title));
			else
				link = link + '|' + link + csqHighLight + encodeURIComponent(q.text);

			var dcd = config.options.chkSearchViewDate ? '|' + ri.date : "";
			r.push(dcd + '|' + ri.page + '|[[' + link + ']]|')
			if (ri.text_snippet !== undefined) {
				r.push(sniprow + ri.text_snippet.replace(/\n/g, '<br>') + '</html>|')
			}
		}
		if (last < hits || offset > 0) {
			if (offset > 0) {
				tft += '<script label="previous">config.macros.search.searchSite(' + q.text.toJSONString() + ',' + res.prevpage + ',"' + res.path + '")</script> ';
			}
			if (last < hits) {
				offset += limit;
				tft += ' <script label="next">config.macros.search.searchSite(' + q.text.toJSONString() + ',' + offset + ',"' + res.path + '")</script> ';
			}
			tft += '|';
			r.push(tft);
		}
		var srt = new Tiddler(srtt, 0, r.join('\n'));
		story.displayTiddler(null, srt, 'ViewOnlyTemplate', true);
	}
};

config.macros.search.onOptions = function (ev) {
	var target = resolveTarget(ev || window.event);
	var p = target.parentElement;
	var panid = config.macros.search.optionsPanel;
	var panel = document.getElementById(panid);
	if (panel == null) {
		var panel = createTiddlyElement(p, "div", panid);
		//p.removeChild(target);
		wikify(store.getTiddlerText(config.macros.search.optionsPanel, ""), panel);
	}
}

// Global because there's only ever one outstanding incremental search timer
config.macros.search.timeout = null;

config.macros.search.doSearch = function(txt) {
    if (txt.value.length > 0) {
        story.search(txt.value, config.options.chkCaseSensitiveSearch, config.options.chkRegExpSearch);
        txt.setAttribute("lastSearchText", txt.value);
    }
};

config.macros.search.onClick = function(e) {
	config.macros.search.doSearch(config.macros.search.inputBox);
    return false;
};

config.macros.search.onKeyPress = function(ev) {
    var e = ev || window.event;
    switch (e.keyCode) {
        case 13: // Ctrl-Enter
        case 10: // Ctrl-Enter on IE PC
            config.macros.search.doSearch(this);
            break;
        case 27: // Escape
            this.value = "";
            clearMessage();
            break;
    }
    if (config.options.chkIncrementalSearch) {
        if (this.value.length > 2) {
            if (this.value != this.getAttribute("lastSearchText")) {
                if (config.macros.search.timeout)
                    clearTimeout(config.macros.search.timeout);
                var txt = this;
                config.macros.search.timeout = setTimeout(function() { config.macros.search.doSearch(txt); }, 500);
            }
        } else {
            if (config.macros.search.timeout)
                clearTimeout(config.macros.search.timeout);
        }
    }
};

config.macros.search.onFocus = function(e) {
    this.select();
};

//--
//-- Tabs macro
//--

config.macros.tabs.handler = function(place, macroName, params) {
    var cookie = params[0];
    var numTabs = (params.length - 1) / 3;
    var wrapper = createTiddlyElement(null, "div", null, "tabsetWrapper " + cookie);
    var tabset = createTiddlyElement(wrapper, "div", null, "tabset");
    tabset.setAttribute("cookie", cookie);
    var validTab = false;
    for (var t = 0; t < numTabs; t++) {
        var label = params[t * 3 + 1];
        var prompt = params[t * 3 + 2];
        var content = params[t * 3 + 3];
        var skip = false;
        if (label.startsWith('~')) {
			if (label.startsWith('~js:')) {
				var lps = label.substr(4).split('~')[0];
				skip = eval(lps) == 0;
				label = label.substr(5 + lps.length); 
			}
			else if (readOnly)
				skip = true;
			else
				label = label.substring(1);
		}
		if (skip == false) {
			var tab = createTiddlyButton(tabset, label, prompt, this.onClickTab, "tab tabUnselected");
			tab.setAttribute("tab", label);
			tab.setAttribute("content", content);
			tab.title = prompt;
			if (config.options[cookie] == label)
				validTab = true;
		}
    }
    if (!validTab)
        config.options[cookie] = params[1];
    place.appendChild(wrapper);
    this.switchTab(tabset, config.options[cookie]);
};

config.macros.tabs.onClickTab = function(e) {
    config.macros.tabs.switchTab(this.parentNode, this.getAttribute("tab"));
    return false;
};

config.macros.tabs.switchTab = function(tabset, tab) {
	if (tabset.nextSibling && tabset.nextSibling.childNodes.length > 0) {
		var nct = tabset.nextSibling.childNodes[0];
		if (nct.nodeType == 1) {
			var fn = nct.getAttribute("tiddler");
			if (fn) {
				var st = store.getTiddler(fn);
				var fields = {};
				story.gatherSaveFields(nct, fields);
				var et = st.text;
				if (!(fields.text === undefined) && fields.text != st.text) {
					if (window.confirm("Cancel changes to " + fn))
						store.notify(fn,true);
					else
						return;
				}
			}
		}
	}
    var cookie = tabset.getAttribute("cookie");
    var theTab = null;
    var nodes = tabset.childNodes;
    for (var t = 0; t < nodes.length; t++) {
        if (nodes[t].getAttribute && nodes[t].getAttribute("tab") == tab) {
            theTab = nodes[t];
            theTab.className = "tab tabSelected";
        } else {
            nodes[t].className = "tab tabUnselected";
        }
    }
    if (theTab) {
        if (tabset.nextSibling && tabset.nextSibling.className == "tabContents")
            removeNode(tabset.nextSibling);
        var tabContent = createTiddlyElement(null, 'div', null, 'tabContents');
        tabset.parentNode.insertBefore(tabContent, tabset.nextSibling);
        var content = theTab.getAttribute('content');
		if (content.startsWith('js;')) {
			var jxa = content.split(';');
			var evx = eval(jxa[1]);
			if (typeof(evx) == 'function')
				evx(tabContent,jxa,theTab);
		}
		else
	        wikify(store.getTiddlerText(content), tabContent, null, store.getTiddler(content));
        if (cookie) {
            config.options[cookie] = tab;
        }
    }
};

//--
//-- Tiddler toolbar
//--

// Create a toolbar command button
config.macros.toolbar.createCommand = function(place, commandName, tiddler, className) {
    if (typeof commandName != "string") {
        var c = null;
        for (var t in config.commands) {
            if (config.commands[t] == commandName)
                c = t;
        }
        commandName = c;
    }
    
    if ((tiddler instanceof Tiddler) && (typeof commandName == "string")) {
        var command = config.commands[commandName];
        if (command.isEnabled ? command.isEnabled(tiddler) : this.isCommandEnabled(command, tiddler)) {
            var text = command.getText ? command.getText(tiddler) : this.getCommandText(command, tiddler);
            var tooltip = command.getTooltip ? command.getTooltip(tiddler) : this.getCommandTooltip(command, tiddler);
            var cmd;
            switch (command.type) {
                case "popup":
                    cmd = this.onClickPopup;
                    break;
                case "command":
                default:
                    cmd = this.onClickCommand;
                    break;
            }
            var btn = createTiddlyButton(null, text, tooltip, cmd);
            btn.setAttribute("commandName", commandName);
            btn.setAttribute("tiddler", tiddler.title);
            if (className)
                addClass(btn, className);
            place.appendChild(btn);
        }
    }
};

config.macros.toolbar.isCommandEnabled = function(command, tiddler) {
    var title = tiddler.title;
    var ro = tiddler.isReadOnly();
    var shadow = store.isShadowTiddler(title) && !store.tiddlerExists(title);
    return (!ro || (ro && !command.hideReadOnly)) && !(shadow && command.hideShadow);
};

config.macros.toolbar.getCommandText = function(command, tiddler) {
    return tiddler.isReadOnly() && command.readOnlyText || command.text;
};

config.macros.toolbar.getCommandTooltip = function(command, tiddler) {
    return tiddler.isReadOnly() && command.readOnlyTooltip || command.tooltip;
};

config.macros.toolbar.onClickCommand = function(ev) {
    var e = ev || window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
    var command = config.commands[this.getAttribute("commandName")];
    return command.handler(e, this, this.getAttribute("tiddler"));
};

config.macros.toolbar.onClickPopup = function(ev) {
    var e = ev || window.event;
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
    var popup = Popup.create(this);
    var command = config.commands[this.getAttribute("commandName")];
    var title = this.getAttribute("tiddler");
    popup.setAttribute("tiddler", title);
    command.handlePopup(popup, title);
    Popup.show();
    return false;
};

// Invoke the first command encountered from a given place that is tagged with a specified class
config.macros.toolbar.invokeCommand = function(place, className, event) {
    var children = place.getElementsByTagName("a");
    for (var t = 0; t < children.length; t++) {
        var c = children[t];
        if (hasClass(c, className) && c.getAttribute && c.getAttribute("commandName")) {
            if (c.onclick instanceof Function)
                c.onclick.call(c, event);
            break;
        }
    }
};

config.macros.toolbar.onClickMore = function(ev) {
    var e = this.nextSibling;
    e.style.display = "inline";
    removeNode(this);
    return false;
};

config.macros.toolbar.handler = function(place, macroName, params, wikifier, paramString, tiddler) {
    for (var t = 0; t < params.length; t++) {
        var c = params[t];
        switch (c) {
            case '>':
                var btn = createTiddlyButton(place, this.moreLabel, this.morePrompt, config.macros.toolbar.onClickMore);
                addClass(btn, "moreCommand");
                var e = createTiddlyElement(place, "span", null, "moreCommand");
                e.style.display = "none";
                place = e;
                break;
            default:
                var className = "";
                switch (c.substr(0, 1)) {
                    case "+":
                        className = "defaultCommand";
                        c = c.substr(1);
                        break;
                    case "-":
                        className = "cancelCommand";
                        c = c.substr(1);
                        break;
                }
                if (c in config.commands)
                    this.createCommand(place, c, tiddler, className);
                break;
        }
    }
};

//--
//-- Menu and toolbar commands
//--

config.commands.closeTiddler.handler = function(event, src, title) {
    if (story.isDirty(title) && !readOnly) {
        if (!confirm(config.commands.cancelTiddler.warning.format([title])))
            return false;
    }
    story.setDirty(title, false);
    story.closeTiddler(title, true);
    return false;
};

config.commands.closeOthers.handler = function(event, src, title) {
    story.closeAllTiddlers(title);
    return false;
};

config.editLocks = {};

config.commands.editTiddler.handler = function (event, src, title) {
	clearMessage();
	var tiddlerElem = story.getTiddler(title);
	var fields = tiddlerElem.getAttribute("tiddlyFields");
	var st = store.getTiddler(title);
	if (st && st.from) {
		var ics = (st.from.startsWith('http:') || st.from.startsWith('/')) ? ['[[', st.from, '|', st.from, ']]'].join('') : '~' + st.from;
		config.annotations[title] = ["Included from ", ics, '. <script label="Copy it here">config.commands.editTiddler.copy("', st.from, '","', title, '");</script> to edit this tiddler'].join('');
	}
	if (!st)
		st = TryGetTiddler(title);
	if (st && st.id && (!st.from)) {
		var editVer = -1; // most recent
		if (st.version != st.currentVer) {
			if (window.confirm("Version " + st.version + " is not the current version!\nProceed to edit starting with this version?") == false)
				return;
			else
				editVer = st.version;
		}
		if (st.fields.autosaved_by)
			if (!confirm("This has been autosaved by " + st.fields.autosaved_by + " - proceed anyway?"))
				return;
		if (config.options.txtLockDuration != "") {
			var eta = { id: st.id, version: editVer, hasVersion: st.version, duration: config.options.txtLockDuration };
			var reply = http.editTiddler(eta);
			st.key = reply.key;
			config.editLocks[st.key] = title;
			if (reply.success) {
				st.lock = reply.now;
				st.until = reply.until;
				if (reply.title) {
					st.title = reply.title;
					st.text = reply.text;
					st.tags = reply.tags.readBracketedList();
					displayMessage("NB: This was modified since you last retrieved it.");
				}
			}
			else {
				if (!window.confirm(reply.Message + " - proceed anyway?")) {
					return;
				}
			}
		}
	}
	if (st)
		config.commands.revertTiddler.tooltip = st.version != st.currentVer ? "revert to this version" : "revert last edit";
	story.displayTiddler(null, title, DEFAULT_EDIT_TEMPLATE, false, null, fields);
	story.focusTiddler(title, config.options.txtEditorFocus || "text");
	return false;
};

config.commands.editTiddler.copy = function(tsource, title) {
	var t = store.getTiddler(title);
	t.detach = true;
	t.readOnly = false;
	delete config.annotations[title];
	story.refreshTiddler(title, DEFAULT_EDIT_TEMPLATE, true);
	t.readOnly = true;
}

function KeepTiddlers(st,title) {
	var keeper = function(st) {
		var t = new Tiddler();
		fields = {};
		delete st.success;
		for (var name in st) {
			switch (name) {
				case "vercnt": 
					t.vercnt = st.vercnt;
					break;
				case "currentVer":
					break;
				case "from": 
					t.from = st.from;
					break;
				default:
					if (!TiddlyWiki.isStandardField(name))
						fields[name] = st[name];
			}
		}
		t.assign(st.title, st.text, st.modifier,
			Date.convertFromYYYYMMDDHHMM(st.modified), st.tags,
			Date.convertFromYYYYMMDDHHMM(st.created),
			fields, parseInt(st.currentVer || st.version));
		t.templates[DEFAULT_VIEW_TEMPLATE] = st.viewtemplate;
		t.templates[DEFAULT_EDIT_TEMPLATE] = st.edittemplate;
		t.id = st.id;
		store.addTiddler(t);
		if (lazyLoadAll[title])
			delete lazyLoadAll[title];
		if (config.NoSuchTiddlers.contains(st.title))
			delete config.NoSuchTiddlers[st.title];
		for (var i = 0; i < t.tags.length; i++) {
			var lztl = lazyLoadTags[t.tags[i]];
			if (lztl)
				lztl.remove(title);
		}
		return t;
	};
	if (st.tiddlers) {
		var rt = null;
		for (var i = 0; i < st.tiddlers.length; i++)
		{
			var nt = keeper(st.tiddlers[i]);
			if (nt.title == title)
				rt = nt;
		}
		loadPlugins();
		return rt;
	}
	else {
		var rt = keeper(st);
		if (rt.tags.contains('systemConfig'))
			loadPlugins();
		return rt;
	}
}

var tryGetWhatTiddler = null;

function TryGetTiddler(title) {
	if (title == tryGetWhatTiddler) // debugging aid
		Debugger("Try get " + title);
	if (config.NoSuchTiddlers.contains(title))
		return null;
	st = http.getTiddler({'title': title});
	if (st && st.success)
		return KeepTiddlers(st,title);
	else
		config.NoSuchTiddlers.push(title);
	return null;
}

function DisplayNonLocalTiddler(from, url)
{
	var st = http.getTiddler({'url': url });
	if (st && st.success)
		ShowExternalTiddler(from,st);
	else
		displayMessage(url + " not found");
}

function ShowExternalTiddler(from, st)
{
	var t = new Tiddler();
	t.assign(st.title,st.text,st.modifier,
		Date.convertFromYYYYMMDDHHMM(st.modified),st.tags,
		Date.convertFromYYYYMMDDHHMM(st.created),
		null, parseInt(st.version));
	t.currentVer = t.version;
	t.key = st.key;
	story.displayTiddler(from, t);
	return t;
}

config.commands.saveTiddler.handler = function(event, src, title) {
	try {
		var newTitle = story.saveTiddler(title, event.shiftKey);
		if (newTitle)
			story.displayTiddler(null, newTitle);
		return false;
	} catch (x) {
		if (x == TIDDLER_NOT_SAVED)
			story.focusTiddler(title, "text");
		else if (x)
			displayMessage(x);
	}
};

config.commands.applyChanges.handler = function(event, src, title) {
	try {
		var newTitle = story.saveTiddler(title, event.shiftKey, null);
		return false;
	} catch (x) {
		if (x)
			displayMessage(x);
	}
};

config.commands.cancelChanges.handler = function(event, src, title) {
	try {
		story.refreshTiddler(title, SPECIAL_EDIT_TEMPLATE, true);
		store.notify(title,true);
	} catch (x) {
		if (x)
			displayMessage(x);
	}
};

config.commands.editTiddler.isEnabled = function(tdlr) {
	return readOnly == false || config.viewButton;
};

config.commands.lockTiddler.isEnabled = function(tdlr) {
	return !tdlr.from && !readOnly;
};

config.commands.lockTiddler.handler = function(event, src, title) {
    var t = store.getTiddler(title);
    if (t) {
		tr  = http.lockTiddler({tiddlerId: t.id, lock: !t.readOnly})
		if (tr.success) {
			t.readOnly = !t.readOnly;
			story.setDirty(title, false);
			story.displayTiddler(null, title);
			if (t && t.key && t.until)
				http.unlockTiddler({"key": t.key});
		}
	}
};

config.commands.excludeTiddler.isEnabled = function(tdlr) {
	return tdlr.from;
};

config.commands.cutTiddler.handler = function(event, src, title, cbaction) {
	var t = store.getTiddler(title);
	if (cbaction == 'copy' && !t.id && t.hasShadow) {
		var clone = new Tiddler();
		merge(clone, t);
		while (store.getTiddler(clone.title))
			clone.title = '_' + clone.title;
		clone.hasShadow = false;
		if (config.tiddlerTemplates.indexOf(title) > 0 && clone.tags.indexOf('tiddlerTemplate') == -1)
			clone.tags.push('tiddlerTemplate');
		store.addTiddler(clone);
		story.displayTiddler(null, clone, DEFAULT_EDIT_TEMPLATE);
		story.focusTiddler(clone.title, "title");
		displayMessage(title + " is a shadowTiddler and");
		displayMessage("can only be pasted on the same page (done).");
		displayMessage("It was pasted for editing as " + clone.title);
		displayMessage("and is not yet saved.");
	}
	else {
		window.localClipboard = null;
		var ctr = http.clipboard({ action: cbaction || 'cut', tiddler: t.id }); // copy or cut
		if (ctr.success) {
			if (ctr.act == 'cut') {
				delete t.id;
				store.removeTiddler(title);
				story.closeTiddler(title, true);
			}
			displayMessage("The tiddler '" + title + "'<br>was " + ctr.action + " to your clipboard.");
			wikify('<script label="Where">wikify("<<tiddler SiteMap>>",place);\n</script> would you like to paste it?', getMessageDiv());
		}
	}
};

config.commands.cutTiddler.isEnabled =  function(tlr) {
	return readOnly == false && tlr.id && tlr.from === undefined;
};

config.commands.copyTiddler.handler = function(event, src, title) {
	return config.commands.cutTiddler.handler(event,src,title,'copy');
};

config.commands.copyTiddler.isEnabled =  function(tlr) {
	return (tlr.id && tlr.from === undefined) || tlr.hasShadow;
};

config.commands.cancelTiddler.handler = function (event, src, title) {
	var t = store.getTiddler(title);
	var autoSaved = t && t.autoSavedAsVer;
	if ((story.hasChanges(title) || autoSaved)  && !readOnly) {
		if (!confirm(this.warning.format([title])))
			return false;
	}
	if (autoSaved) {
		var dtr = http.dropTiddlerEdit({tiddlerId: t.id, autoSavedAsVer: t.autoSavedAsVer});
		if (dtr.success && t.autoSavedAsVer == 1)
			store.deleteTiddler(t.title);
		else if (t.ovs) {
			var pvs = t.ovs.pop();
			if (pvs)
				merge(t,pvs);
			t.versions = dtr.versions;
		}
		delete t.autoSavedAsVer;
	}
	if (t && t.key && t.until) {
		http.unlockTiddler({ "key": t.key });
		delete config.editLocks[t.key];
		delete t.key;
		delete t.until;
	}
	story.setDirty(title, false);
	if (title)
		story.displayTiddler(null, (t && t.title) || title);
	else
		story.closeTiddler(title);
	return false;
};

config.commands.deleteTiddler.handler = function (event, src, title) {
	var st = store.getTiddler(title);
	if (st) {
		var deleteIt = true;
		if (config.options.chkRequireDeleteConfirm)
			deleteIt = window.confirm(this.warning.format([title]));
		if (deleteIt && config.options.chkRequireDeleteReason) {
			var reason = window.prompt(this.prompt.format([title]), "");
			if (reason == null)
				return false;
		}
		else
			var reason = "No reason";

		st._deleteReason = reason;
	}
	if (st == null || (deleteIt && store.removeTiddler(title))) {
		story.closeTiddler(title, true);
		config.macros.recycleBin.close();
	}
	return false;
};

config.commands.rescueTiddler.isEnabled = function(tlr) {
	return tlr.key;
};

config.commands.rescueTiddler.handler = function(event, src, title) {
	var tiddler = config.commands.rescueTiddler.bin[title];
	if (http.recycleBin({ rescue: tiddler.key }).success) {
		tiddler.key = null;
		if (tiddler.path == window.location.pathname) {
			store.addTiddler(tiddler);
			story.refreshTiddler(tiddler.title,null,true);
		}
		else
			window.location = tiddler.path;
	}
};

config.commands.revertTiddler.handler = function(event, src, title) {
	var revertIt = true;
	var tiddler = store.fetchTiddler(title);
	if (config.options.chkRequireDeleteConfirm)
	{
		if (config.admin && tiddler.version == tiddler.currentVer)
			revertIt = confirm(this.adminWarning.format([title,tiddler.version]));
		else
			revertIt = confirm(this.warning.format([title,tiddler.version]));
	}
	if (revertIt) {
		var pt = http.revertTiddler( { tiddlerId: tiddler.id, key: tiddler.key, version: tiddler.version, historyView: story.getHistoryView(tiddler) } );
		if (pt) {
			tiddler.set(pt.title,pt.text,pt.modifier,pt.modified,pt.tags,pt.created);
			tiddler.versions = pt.versions;
			tiddler.version = pt.version;
			tiddler.currentVer = pt.version;
			story.refreshTiddler(pt.title,null,true);
			story.setDirty(pt.title,false);
		}
    }
    return false;
};

config.commands.revertTiddler.isEnabled = function(t)
{
	return t && t.fields ? 
		eval(t.vercnt) > 1 && (t.currentVer != t.version || (config.admin && !t.fields['reverted'])) : false;
};

config.commands.truncateTiddler.handler = function(event,src,title) {
	var warning = config.admin ? this.adminWarning.format([title]) : this.warning.format([title]);
	if (story.hasChanges(title) && !readOnly) {
		if (!confirm("Save changes and " + warning))
			return false;
		var newTitle = story.saveTiddler(title, event.shiftKey);
	}
	else
		var newTitle = false;

	var tiddler = store.fetchTiddler(title);
	var doit = newTitle || confirm(warning);
	if (doit) {
		if (newTitle)
			delete tiddler.key;
		var res = http.deleteVersions({ tiddlerId: tiddler.id, key: tiddler.key, version: tiddler.version, historyView: story.getHistoryView(tiddler)});
		tiddler.versions = res.versions;
		delete tiddler.key;
		tiddler.vercnt = res.vercnt;
		story.setDirty(tiddler.title, false);
		story.refreshTiddler(tiddler.title,null,true);
	}
};

config.commands.truncateTiddler.isEnabled = function(t)
{
	return t.version > 1 && config.isLoggedIn();
};

config.commands.excludeTiddler.handler = function(event, src, title) {
    store.removeTiddler(title);
    story.closeTiddler(title, true);
};

config.commands.permalink.handler = function(event, src, title) {
    var t = encodeURIComponent(String.encodeTiddlyLink(title));
    if (window.location.hash != t)
        window.location.hash = t;
    return false;
};

config.commands.references.handlePopup = function(popup, title) {
    var references = store.getReferringTiddlers(title);
    var c = false;
    for (var r = 0; r < references.length; r++) {
        if (references[r].title != title && !references[r].isTagged("excludeLists")) {
            createTiddlyLink(createTiddlyElement(popup, "li"), references[r].title, true);
            c = true;
        }
    }
    if (!c)
        createTiddlyText(createTiddlyElement(popup, "li", null, "disabled"), this.popupNone);
};

config.commands.jump.handlePopup = function(popup, title) {
    story.forEachTiddler(function(title, element) {
        createTiddlyLink(createTiddlyElement(popup, "li"), title, true, null, false, null, true);
    });
};

config.commands.help.handlePopup = function(popup, title) {
	for (var i = 0; i < this.topics.length; i++) {
		var pme = createTiddlyElement(createTiddlyElement(popup, "li"), "a",null,null,this.topics[i],{'href':'javascript:;'} );
		pme.onclick = function(ev) {
			var t = resolveTarget(ev || window.event);
			story.displayTiddler(null,"Help On " + t.firstChild.nodeValue);
		};
	}
};

config.commands.tag.handler = function(event, src, title) {
	var aec = displayPart(src,'tag').getElementsByTagName('input');
	if (aec.length)
		aec[0].focus();
};

config.commands.attributes.handlePopup = function(popup, title) {
	var finder = function() {
		var atf = [];
		if (getElementsByClassName('tagFrame','*',story.getTiddler(title),atf))
			return atf[0].getElementsByTagName('input')[0];
	};
	var handler = function(ev) {
		var target = resolveTarget(ev || window.event);
		var tag = target.getAttribute('tag');
		var tee = finder();
		var etl = tee.value.readBracketedList();
		var eti = etl.indexOf(tag);
		if (eti == -1) {
			etl.push(tag);
			for (var pte = tee.parentElement; pte; pte = pte.parentElement)
				if (pte.id == 'tag') { pte.style.display = 'block'; break; }
		}
		else
			etl.remove(tag);
		tee.value = String.encodeTiddlyLinkList(etl);
	};
	var add = function(aLabel,aTag) {
		var act = finder().value.readBracketedList().indexOf(aTag) == -1 ? "mark" : "clear";
		var checked = act == "mark" ? '+ ' : '- ';
		createTiddlyButton(createTiddlyElement(popup, 'li'),checked + aLabel,act + ' ' + aTag,handler,null,null,null,{ tiddler: title, tag: aTag });
	};
	if (config.owner == config.loginName)
		add("private",'isPrivate');
	add("lazy-load",'lazyLoad')
	add("deprecated",'isDeprecated');
	add("exclude from index",'excludeLists');
	add("exclude from search",'excludeSearch');
	add("treat as script",'systemConfig');
	add("disable as script",'systemConfigDisable');
	add("include as special tiddler",'shadowTiddler');
	add("used as template",'tiddlerTemplate');
};

config.commands.preview.handler = function(e, src, title) {
	var pe = displayPart(src,'preview')
	if (pe) {
		pe = pe.childNodes[1];
		var te = displayPart(src).childNodes[1].firstChild.firstChild.firstChild;
		removeChildren(pe);
		wikify(te.value,pe);
		pe.previousSibling.firstChild.nodeValue = "Preview";
	}	
	var dt = story.findContainingTiddler(resolveTarget(window.event));
	var fn = dt.getAttribute("tiddler");
	var fields = {};
	story.gatherSaveFields(dt, fields);
	var et = store.replaceText(fn,fields.text);
	store.notify(fn,true);
	store.replaceText(fn,et);
};

config.commands.diff.handler = function(e, src, title) {
	var pe = displayPart(src,'preview')
	if (pe) {
		pe = pe.childNodes[1];
		var te = displayPart(src).childNodes[1].firstChild.firstChild.firstChild;
		removeChildren(pe);
		var pto = story.findContainingTiddler(resolveTarget(e || window.event));
		if 	(pto) {
			var t = pto.getAttribute('tiddler');
			var tiddler = store.fetchTiddler(t);
			if (!t) return;
			pe.innerHTML = http.tiddlerDiff({ tid: tiddler.id, text: te.value, vn1: tiddler.version });
			pe.previousSibling.firstChild.nodeValue = "Changes";
		}
	}
};

config.commands.history.isEnabled = function(tdlr) {
	return tdlr.fields.vercnt > 0;
};

config.commands.history.handler = function(e, src, title) {
	var pto = story.findContainingTiddler(resolveTarget(e || window.event));
	if (pto) {
		var arr = [];
		if (getElementsByClassName('history','*',pto, arr)) {
			var t = pto.getAttribute('tiddler');
			var tiddler = store.fetchTiddler(t);
			if (!t) return;
			var res = http.tiddlerHistory({ tiddlerId: tiddler.id, shadow: store.isShadowTiddler(t) ? 1 : 0 });
			removeChildren(arr[0]);
			wikify(res.versions,arr[0],null,tiddler);
		}
	}
},

config.commands.reload.handler = function(event, src, title) {
	story.refreshTiddler(title,null,true);
};

function displayPart(src,id)
{
	while (src && src.tagName != 'FIELDSET')
		src = src.parentNode;
	if (src) {
		if (id)
			while (src.id != id)
				src = src.nextSibling;
		src.style.display = 'block';
	}
	return src;
}

config.commands.fields.handlePopup = function(popup, title) {
    var tiddler = store.fetchTiddler(title);
    if (!tiddler)
        return;
    var fields = {};
    store.forEachField(tiddler, function(tiddler, fieldName, value) { if (value != '') fields[fieldName] = value; }, true);
    var items = [];
    for (var t in fields) {
        items.push({ field: t, value: fields[t] });
    }
    items.sort(function(a, b) { return a.field < b.field ? -1 : (a.field == b.field ? 0 : +1); });
    if (items.length > 0)
        ListView.create(popup, items, this.listViewTemplate);
    else
        createTiddlyElement(popup, "div", null, null, this.emptyText);
	if (config.admin) {
		var eh = function(e) { TiddlerLinkHandler(story.getTiddler(title),pfxFields + title); };
		createTiddlyButton(popup,"Edit fields",null,eh,'fieldsLink');
	}
};

//--
//-- Tiddler() object
//--

function Tiddler(title, version, text) {
    this.title = title;
    this.text = text || "";
    this.modifier = null;
    this.created = new Date();
    this.modified = this.created;
    this.links = [];
    this.linksUpdated = false;
    this.tags = [];
    this.fields = {};
    this.templates = []; // added member
    this.currentVer = version;
    return this;
}

Tiddler.prototype.getLinks = function() {
    if (this.linksUpdated == false)
        this.changed();
    return this.links;
};

// Returns the fields that are inherited in string field:"value" field2:"value2" format
Tiddler.prototype.getInheritedFields = function() {
    var f = {};
    for (var i in this.fields) {
        if (i == "server.host" || i == "server.workspace" || i == "wikiformat" || i == "server.type") {
            f[i] = this.fields[i];
        }
    }
    return String.encodeHashMap(f);
};

Tiddler.prototype.getComments = function(forceRead,gcr) {
	if (forceRead || gcr || !this.commentList || this.commentList.incomplete) {
		var cs = this.commentList = gcr || http.getComments({tiddlerId: this.id});
		for (var i = 0; i < cs.length; i++) {
			if (cs[i].refs === undefined)
				cs[i].refs = 0;
			if (cs[i].ref != "")
				for (var j = 0; j < cs.length; j++)
					if (cs[i].ref == cs[j].created.substr(0,19)) {
						if(cs[j].refs)
							cs[j].refs++;
						else
							cs[j].refs = 1;
					}
		}
	}
	return this.commentList;
};

Tiddler.prototype.addComment = function (text, type) {
	var sr = http.submitComment({ text: text, type: type, tiddler: this.id, version: this.currentVer, receiver: this.modifier });
	if (sr && sr.success) {
		if (!this.commentList) {
			this.commentList = [];
			this.commentList.incomplete = true;
		}
		if (this.commentList)
			this.commentList.push(sr);
		var inc = function (a) { return a === undefined ? 1 : a + 1; };
		switch (type) {
			case 'C': this.comments = inc(this.comments); break;
			case 'M': this.messages = inc(this.messages); break;
			case 'N': this.notes = inc(this.notes); break;
		}
		if (sr.mail)
			displayMessage("Mail sent");
		else if (type == 'M')
			displayMessage("Mail could not be sent");
	}
	return sr;
}

Tiddler.prototype.Notes = function() {
	if (!this.notes)
		return false;
	if (typeof(this.notes) != 'object')
		this.notes = http.getNotes({ tiddlerId:this.id });
	return this.notes.length;
}

Tiddler.prototype.getMessages = function(forceRead) {
	if (forceRead || !this.messageList)
		this.messageList = http.getMessages({tiddlerId: this.id});
	return this.messageList;
}

// Increment the changeCount of a tiddler
Tiddler.prototype.incChangeCount = function() {
    var c = this.fields['changecount'];
    c = c ? parseInt(c, 10) : 0;
    this.fields['changecount'] = String(c + 1);
};

// Clear the changeCount of a tiddler
Tiddler.prototype.clearChangeCount = function() {
    if (this.fields['changecount']) {
        delete this.fields['changecount'];
    }
};

Tiddler.prototype.doNotSave = function() {
    return this.fields['doNotSave'];
};

// Returns true if the tiddler has been updated since the tiddler was created or downloaded
Tiddler.prototype.isTouched = function() {
    var changeCount = this.fields['changecount'];
    if (changeCount === undefined)
        changeCount = 0;
    return changeCount > 0;
};

// Stash a version
Tiddler.prototype.stashVersion = function() {
    var version = this.version;
    if (version === undefined)
        return;
    if (this.ovs == undefined)
        this.ovs = [];
    if (this.ovs[version] === undefined) {
        this.ovs[version] = {};
        merge(this.ovs[version], this);
        delete this.ovs[version].versions;
    }
}

// Change the text and other attributes of a tiddler
Tiddler.prototype.set = function(title, text, modifier, modified, tags, created, fields) {
    this.assign(title, text, modifier, modified, tags, created, fields);
    this.changed();
    return this;
};

// Change the text and other attributes of a tiddler without triggered a tiddler.changed() call
Tiddler.prototype.assign = function (title, text, modifier, modified, tags, created, fields, version, id) {
	this.stashVersion();
	if (title != undefined)
		this.title = title;
	if (text != undefined)
		this.text = text;
	if (modifier != undefined)
		this.modifier = modifier;
	if (modified != undefined || modified == null)
		this.modified = modified;
	if (created != undefined || created == null)
		this.created = created;
	if (fields != undefined) {
		this.fields = fields;
		if (fields.requires && !this.requires)
			this.requires =  fields.requires;
	}
	if (version != undefined) {
		this.currentVer = version;
		if (version == 0)
			this.hasShadow = true;
	}
	this.version = this.currentVer;

	if (id != undefined)
		this.id = id;
	if (tags != undefined) {
		this.tags = (typeof tags == "string") ? tags.readBracketedList() : tags;
		if (this.tags.indexOf('tiddlerTemplate') != -1)
			config.tiddlerTemplates.push(title);
	}
	else if (this.tags == undefined)
		this.tags = [];
	return this;
};

function visibleTag(tag) {
	if (readOnly) {
		if (tag.substring(0, 1) != '@')
			return true;
		else
			return false;
	}
	return true;
}

// Get the tags for a tiddler as a string (space delimited, using [[brackets]] for tags containing spaces)
Tiddler.prototype.getTags = function() {
    return String.encodeTiddlyLinkList(this.tags);
};

// Test if a tiddler carries a tag
Tiddler.prototype.isTagged = function(tag) {
    return this.tags.indexOf(tag) != -1;
};

// Static method to convert "\n" to newlines, "\s" to "\"
Tiddler.unescapeLineBreaks = function(text) {
    return text ? text.unescapeLineBreaks() : "";
};

// Convert newlines to "\n", "\" to "\s"
Tiddler.prototype.escapeLineBreaks = function() {
    return this.text.escapeLineBreaks();
};

// Updates the secondary information (like links[] array) after a change to a tiddler
Tiddler.prototype.changed = function() {
    this.links = [];
    var t = this.autoLinkWikiWords() ? 0 : 1;
    var tiddlerLinkRegExp = t == 0 ? config.textPrimitives.tiddlerAnyLinkRegExp : config.textPrimitives.tiddlerForcedLinkRegExp;
    tiddlerLinkRegExp.lastIndex = 0;
    var formatMatch = tiddlerLinkRegExp.exec(this.text);
    while (formatMatch) {
        var lastIndex = tiddlerLinkRegExp.lastIndex;
        if (t == 0 && formatMatch[1] && formatMatch[1] != this.title) {
            // wikiWordLink
            if (formatMatch.index > 0) {
                var preRegExp = new RegExp(config.textPrimitives.unWikiLink + "|" + config.textPrimitives.anyLetter, "mg");
                preRegExp.lastIndex = formatMatch.index - 1;
                var preMatch = preRegExp.exec(this.text);
                if (preMatch.index != formatMatch.index - 1)
                    this.links.pushUnique(formatMatch[1]);
            } else {
                this.links.pushUnique(formatMatch[1]);
            }
        }
        else if (formatMatch[2 - t] && !config.formatterHelpers.isExternalLink(formatMatch[3 - t])) // titledBrackettedLink
            this.links.pushUnique(formatMatch[3 - t]);
        else if (formatMatch[4 - t] && formatMatch[4 - t] != this.title) // brackettedLink
            this.links.pushUnique(formatMatch[4 - t]);
        tiddlerLinkRegExp.lastIndex = lastIndex;
        formatMatch = tiddlerLinkRegExp.exec(this.text);
    }
    this.linksUpdated = true;
};

Tiddler.prototype.getSubtitle = function() {
    var modifier = this.modifier;
    if (!modifier)
        modifier = config.messages.subtitleUnknown;
    var modified = this.modified;
    if (modified)
        modified = modified.toLocaleString();
    else
        modified = config.messages.subtitleUnknown;
    return config.messages.tiddlerLinkTooltip.format([this.title, modifier, modified]);
};

Tiddler.prototype.isReadOnly = function() {
    return readOnly || this.readOnly || config.access == "add" && this.modifier != config.views.wikified.defaultModifier && this.modifier != config.options.txtUserName;
};

Tiddler.prototype.autoLinkWikiWords = function() {
    return !(this.isTagged("systemConfig") || this.isTagged("excludeMissing"));
};

Tiddler.prototype.getServerType = function() {
    var serverType = null;
    if (this.fields['server.type'])
        serverType = this.fields['server.type'];
    if (!serverType)
        serverType = this.fields['wikiformat'];
    if (serverType && !config.adaptors[serverType])
        serverType = null;
    return serverType;
};

Tiddler.prototype.getAdaptor = function() {
    var serverType = this.getServerType();
    return serverType ? new config.adaptors[serverType]() : null;
};

Tiddler.prototype.display = function(target,fields,toggling,hiLite) {
    try {
        if (this.isTagged("javaScript") && !toggling) {
            try {
                var a = window.eval(this.text);
                if (a != "undefined") {
                    var t = this.text;
                    this.text = a;
                    if (story.getTiddler(this.title))
                        story.refreshTiddler(this.title,null,true);
                    else
                        story.displayTiddler(target, this, null, true, null, fields, toggling);
                    this.text = t;
                }
            } catch(x) {
                displayMessage(x.message)
            }
        }
        else
            story.displayTiddler(target, this, null, true, null, fields, toggling, null, hiLite);
    } catch (x) {
        displayMessage(x);
    }
}

//--
//-- TiddlyWiki() object contains Tiddler()s
//--

function TiddlyWiki() {
	var tiddlers = {}; // Hashmap by name of tiddlers
	this.fetchFromServer = false;
    this.tiddlersUpdated = false;
    this.namedNotifications = []; // Array of {name:,notify:} of notification functions
    this.notificationLevel = 0;
    this.slices = {}; // map tiddlerName->(map sliceName->sliceValue). Lazy.
    this.clear = function() {
        tiddlers = {};
        this.setDirty(false);
    };
    this.hasTiddler = function (at, real) {
    	var t = tiddlers[at];
    	return t instanceof Tiddler && (real ? t.id : true);
    };
    this.fetchTiddler = function (title,co) {
    	var t = tiddlers[title];
    	if (!t && title)
			if (this.fetchFromServer && !co) {
				t = TryGetTiddler(title);
			}
		if (t && t.requires) {
			var reqs = t.requires.readBracketedList();
			delete t.requires;
			for (var i = 0; i < reqs.length; i++)
				store.fetchTiddler(reqs[i]);
			
		}
    	return t instanceof Tiddler ? t : null;
    };
    this.deleteTiddler = function(title) {
        var t = tiddlers[title];
        delete tiddlers[title];
        delete this.slices[title];
    };
    this.addTiddler = function(tiddler) {
        delete this.slices[tiddler.title];
        tiddlers[tiddler.title] = tiddler;
    };
	this.addTiddlerAs = function(t,n) {
		delete this.slices[n];
		tiddlers[n] = t;
	};
    this.forEachTiddler = function(callback) {
		var ffs = this.fetchFromServer;
		this.fetchFromServer = false; // performance forbids iterative fetching
        for (var t in tiddlers) {
            var tiddler = tiddlers[t];
            if (tiddler instanceof Tiddler)
                callback.call(this, t, tiddler);
        }
		this.fetchFromServer = ffs;
    };
	this.replaceText = function(title,text) {
		var pet = tiddlers[title].text;
		tiddlers[title].text = text;
		delete this.slices[title];
		return pet;
	};
}

TiddlyWiki.prototype.setDirty = function(dirty) {
    this.dirty = dirty;
};

TiddlyWiki.prototype.isDirty = function() {
    return this.dirty;
};

TiddlyWiki.prototype.tiddlerExists = function(title) {
    var t = this.fetchTiddler(title);
    return t != undefined;
};

TiddlyWiki.prototype.isShadowTiddler = function (title) {
	var t = this.fetchTiddler(title,true);
    return t && t.hasShadow;
};

TiddlyWiki.prototype.createTiddler = function(title) {
    var tiddler = this.fetchTiddler(title);
    if (!tiddler) {
        tiddler = new Tiddler(title, 0);
        this.addTiddler(tiddler);
        this.setDirty(true);
    }
    return tiddler;
};

TiddlyWiki.prototype.getTiddler = function(title) {
    var t = this.fetchTiddler(title);
    if (t != undefined)
        return t;
    return null;
};

TiddlyWiki.prototype.getTiddlerText = function(title, defaultText) {
    if (!title)
        return defaultText;
    var pos = title.indexOf(config.textPrimitives.sectionSeparator);
    var section = null;
    if (pos != -1) {
        section = title.substr(pos + config.textPrimitives.sectionSeparator.length);
        title = title.substr(0, pos);
    }
    pos = title.indexOf(config.textPrimitives.sliceSeparator);
    if (pos != -1) {
        var slice = this.getTiddlerSlice(title.substr(0, pos), title.substr(pos + config.textPrimitives.sliceSeparator.length));
        if (slice)
            return slice;
    }
    var tiddler = this.fetchTiddler(title);
    if (tiddler) {
        if (!section)
            return tiddler.text;
        var re = new RegExp("(^!{1,6}" + section.escapeRegExp() + "[ \t]*\n)", "mg");
        re.lastIndex = 0;
        var match = re.exec(tiddler.text);
        if (match) {
            var t = tiddler.text.substr(match.index + match[1].length);
            var re2 = /^!/mg;
            re2.lastIndex = 0;
            match = re2.exec(t); //# search for the next heading
            if (match)
                t = t.substr(0, match.index - 1); //# don't include final \n
            return t;
        }
        return defaultText;
    }
    if (defaultText != undefined)
        return defaultText;
    return null;
};

TiddlyWiki.prototype.getRecursiveTiddlerText = function(title, defaultText, depth) {
    var bracketRegExp = new RegExp("(?:\\[\\[([^\\]]+)\\]\\])", "mg");
    var text = this.getTiddlerText(title, null);
    if (text == null)
        return defaultText;
    var textOut = [];
    var lastPos = 0;
    do {
        var match = bracketRegExp.exec(text);
        if (match) {
            textOut.push(text.substr(lastPos, match.index - lastPos));
            if (match[1]) {
                if (depth <= 0)
                    textOut.push(match[1]);
                else
                    textOut.push(this.getRecursiveTiddlerText(match[1], "[[" + match[1] + "]]", depth - 1));
            }
            lastPos = match.index + match[0].length;
        } else {
            textOut.push(text.substr(lastPos));
        }
    } while (match);
    return textOut.join("");
};

TiddlyWiki.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1\s*([^\n]+)\s*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|\s*([^\|\n]+)\s*\|$)/gm;

// @internal
TiddlyWiki.prototype.calcAllSlices = function(title) {
    var slices = {};
    var text = this.getTiddlerText(title, "");
    this.slicesRE.lastIndex = 0;
    var m = this.slicesRE.exec(text);
    while (m) {
        if (m[2])
            slices[m[2]] = m[3];
        else
            slices[m[5]] = m[6];
        m = this.slicesRE.exec(text);
    }
    return slices;
};

// Returns the slice of text of the given name
TiddlyWiki.prototype.getTiddlerSlice = function(title, sliceName) {
    var slices = this.slices[title];
    if (!slices) {
        slices = this.calcAllSlices(title);
        this.slices[title] = slices;
    }
    return slices[sliceName];
};

// Build an hashmap of the specified named slices of a tiddler
TiddlyWiki.prototype.getTiddlerSlices = function(title, sliceNames) {
    var r = {};
    for (var t = 0; t < sliceNames.length; t++) {
        var slice = this.getTiddlerSlice(title, sliceNames[t]);
        if (slice)
            r[sliceNames[t]] = slice;
    }
    return r;
};

TiddlyWiki.prototype.suspendNotifications = function() {
    this.notificationLevel--;
};

TiddlyWiki.prototype.resumeNotifications = function() {
    this.notificationLevel++;
};

// Invoke the notification handlers for a particular tiddler
TiddlyWiki.prototype.notify = function(title, doBlanket) {
    if (!this.notificationLevel) {
        for (var t = 0; t < this.namedNotifications.length; t++) {
            var n = this.namedNotifications[t];
            if ((n.name == null && doBlanket) || (n.name == title))
                n.notify(title);
        }
    }
};

// Invoke the notification handlers for all tiddlers
TiddlyWiki.prototype.notifyAll = function() {
    if (!this.notificationLevel) {
        for (var t = 0; t < this.namedNotifications.length; t++) {
            var n = this.namedNotifications[t];
            if (n.name)
                n.notify(n.name);
        }
    }
};

// Add a notification handler to a tiddler
TiddlyWiki.prototype.addNotification = function(title, fn) {
    for (var i = 0; i < this.namedNotifications.length; i++) {
        if ((this.namedNotifications[i].name == title) && (this.namedNotifications[i].notify == fn))
            return this;
    }
    this.namedNotifications.push({ name: title, notify: fn });
    return this;
};

TiddlyWiki.prototype.removeTiddler = function(title) {
	var tiddler = this.fetchTiddler(title);
	if (tiddler) {
		if (tiddler.id) {
			var result = http.deleteTiddler({ tiddlerId: tiddler.id, comment: tiddler._deleteReason });
			if (!result.success)
				return false;
		}
		if (tiddler.hasShadow) {
			if (tiddler.ovs) {
				merge(tiddler,tiddler.ovs[0]);
				for (var i = 1; i < tiddler.ovs.length; i++)
					delete tiddler.ovs[i];
			}
			tiddler.currentVer = 0;
			delete tiddler.id;
			delete tiddler.versions;
		}
		else
			this.deleteTiddler(title);
		this.notify(title, true);
		return true;
	}
};

TiddlyWiki.prototype.setTiddlerTag = function(title, status, tag) {
    var tiddler = this.fetchTiddler(title);
    if (tiddler) {
        var t = tiddler.tags.indexOf(tag);
        if (t != -1)
            tiddler.tags.splice(t, 1);
        if (status)
            tiddler.tags.push(tag);
		http.changeTags({
			tiddlerId: tiddler.id,
			version: tiddler.version,
			tags: String.encodeTiddlyLinkList(tiddler.tags) });

        tiddler.changed();
        tiddler.incChangeCount(title);
        this.notify(title, true);
    }
};

TiddlyWiki.prototype.addTiddlerFields = function(title, fields) {
    var tiddler = this.fetchTiddler(title);
    if (!tiddler)
        return;
    merge(tiddler.fields, fields);
    tiddler.changed();
    tiddler.incChangeCount(title);
    this.notify(title, true);
    this.setDirty(true);
};

TiddlyWiki.prototype.saveTiddler = function (title, newTitle, newBody, modifier, modified, tags, fields, autoSave) {
	var tiddler = this.fetchTiddler(title);
	tags = (typeof (tags) == "string") ? tags : String.encodeTiddlyLinkList(tags);
	if (tiddler) {
		var et = tiddler;
		var created = tiddler.created; // Preserve created date
		var versions = tiddler.versions;
		var fromVersion = tiddler.fromversion;
		if (!fromVersion)
			fromVersion = tiddler.currentVer;
	} else {
		var created = modified;
		fromVersion = 1;
		tiddler = new Tiddler(null, 1);
	}

	if (tiddler.detach) {
		tiddler.id = '';
		delete tiddler.detach;
		delete tiddler.from;
		delete tiddler.readOnly;
	}

	var atags = tags.readBracketedList();
	var m = {
		tiddlerId: tiddler.id,
		tiddlerName: newTitle,
		text: newBody,
		tags: tags,
		atag: atags,
		currentVer: tiddler.currentVer,
		modifier: modifier,
		autoSave: autoSave || false,
		historyView: story.getHistoryView(tiddler),
		shadow: tiddler.hasShadow ? 1 : 0
	}
	if (config.options.chkListPrevious)
		m.fromVer = fromVersion;
	else
		delete tiddler.versions;

	if (!(tiddler.autoSavedAsVer === undefined)) {
		m.autoSavedAsVer = tiddler.autoSavedAsVer;
		delete tiddler.autoSavedAsVer;
	}
	if (modified === undefined)
		m.minorEdit = true;
	if (tags) {
		if (atags.indexOf('isPrivate') > -1)
			m.isPrivate = 'true';
		if (atags.indexOf('isDeprecated') > -1)
			m.deprecated = 'true';
	}
	for (fn in fields) {
		if (m[fn] === undefined) {
			var fv = fields[fn];
			if (typeof (fv) == 'object')
				fv = fv.join('\n');
			m[fn] = fv.escapeLineBreaks();
		}
	}
	if (tiddler.key)
		m.key = tiddler.key;
	else if (m.tiddlerName == '')
		delete m.tiddlerName; // ie. get a server-generated title

	var result = http.saveTiddler(m);
	if (result.success)
		delete result.success
	else
		throw (TIDDLER_NOT_SAVED);
	if (tiddler.key && !autoSave) {
		delete config.editLocks[m.key];
		delete tiddler.key;
	}
	if (!(result.title === undefined))
		newTitle = result.title;
	if (!(result.tags === undefined)) {
		atags = result.tags;
		delete result.tags;
	}
	tiddler.set(newTitle, newBody, modifier, modified || tiddler.modified, atags, created, fields);
	delete result.tags;
	merge(tiddler, result);
	if (result.currentVer)
		tiddler.version = result.currentVer;
	tiddler.fromversion = fromVersion;
	tiddler.vercnt = result.vercnt;

	if (et)
		this.deleteTiddler(title);
	this.addTiddlerAs(tiddler, autoSave ? title : newTitle);
	if (autoSave)
		return tiddler;

	if (title != newTitle)
		this.notify(title, true);

	updateTemplatesOfTiddler(tiddler);
	this.notify(newTitle, true);
	return tiddler;
};

TiddlyWiki.prototype.getLoader = function() {
    if (!this.loader)
        this.loader = new TW21Loader();
    return this.loader;
};

// Load contents of a TiddlyWiki from an HTML DIV
TiddlyWiki.prototype.loadFromDiv = function(src, idPrefix, noUpdate, fn) {
    this.idPrefix = idPrefix;
    var storeElem = (typeof src == "string") ? document.getElementById(src) : src;
    if (!storeElem)
        return;
    var tiddlers = this.getLoader().loadTiddlers(this, storeElem.childNodes, fn);
    removeChildren(storeElem);
    this.setDirty(false);
    if (!noUpdate) {
        for (var i = 0; i < tiddlers.length; i++)
            tiddlers[i].changed();
    }
};

TiddlyWiki.prototype.updateTiddlers = function() {
    this.tiddlersUpdated = true;
    this.forEachTiddler(function(title, tiddler) {
        tiddler.changed();
       });
};

// Return an array of tiddlers matching a search regular expression
TiddlyWiki.prototype.search = function(searchRegExp, sortField, excludeTag, match) {
    var candidates = this.reverseLookup("tags", excludeTag, !!match);
    var results = [];
    for (var t = 0; t < candidates.length; t++) {
        if ((candidates[t].title.search(searchRegExp) != -1) || (candidates[t].text.search(searchRegExp) != -1))
            results.push(candidates[t]);
    }
    if (!sortField)
        sortField = "title";
    results.sort(function(a, b) { return a[sortField] < b[sortField] ? -1 : (a[sortField] == b[sortField] ? 0 : +1); });
    return results;
};

// Returns a list of all tags in use
//   excludeTag - if present, excludes tags that are themselves tagged with excludeTag
// Returns an array of arrays where [tag][0] is the name of the tag and [tag][1] is the number of occurances
TiddlyWiki.prototype.getTags = function (excludeTag, results) {
	if (results === undefined)
		var results = [];
	for (var tn in lazyLoadTags) {
		results.push([tn,lazyLoadTags[tn].length]);
	}
	this.forEachTiddler(function (title, tiddler) {
		for (var g = 0; g < tiddler.tags.length; g++) {
			var tag = tiddler.tags[g];
			if (visibleTag(tag)) {
				var n = true;
				for (var c = 0; c < results.length; c++) {
					if (results[c][0] == tag) {
						n = false;
						results[c][1]++;
					}
				}
				if (n && excludeTag) {
					var t = this.fetchTiddler(tag);
					if (t && t.isTagged(excludeTag))
						n = false;
				}
				if (n)
					results.push([tag, 1]);
			}
		}
	});
	results.sort(function (a, b) { return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : (a[0].toLowerCase() == b[0].toLowerCase() ? 0 : +1); });
	return results;
};

// Return an array of the tiddlers that are tagged with a given tag
TiddlyWiki.prototype.getTaggedTiddlers = function(tag,sortField,ltOnly,shadow) {
	var results = [];
	if (!ltOnly) {
		var lztl = lazyLoadTags[tag];
		if (lztl) {
			for (var i = 0; i < lztl.length; i++)
				results.push({ title: lztl[i] });
		}
	}
	return this.reverseLookup("tags", tag, true, sortField, results, shadow);
};

// Return an array of the tiddlers that link to a given tiddler
TiddlyWiki.prototype.getReferringTiddlers = function(title, unusedParameter, sortField) {
    if (!this.tiddlersUpdated)
        this.updateTiddlers();
    return this.reverseLookup("links", title, true, sortField);
};

// Return an array of the tiddlers that do or do not have a specified entry in the specified storage array (ie, "links" or "tags")
// lookupMatch == true to match tiddlers, false to exclude tiddlers
TiddlyWiki.prototype.reverseLookup = function(lookupField, lookupValue, lookupMatch, sortField, results, shadow) {
	if (!results)
		var results = [];
    this.forEachTiddler(function(title, tiddler) {
        var f = !lookupMatch;
        for (var lookup = 0; lookup < tiddler[lookupField].length; lookup++) {
            if (tiddler[lookupField][lookup] == lookupValue)
                f = lookupMatch;
        }
        if (f && (tiddler.currentVer > 0 || shadow))
            results.push(tiddler);
    });
    if (!sortField)
        sortField = "title";
    results.sort(function(a, b) { return a[sortField] < b[sortField] ? -1 : (a[sortField] == b[sortField] ? 0 : +1); });
    return results;
};

// Return the tiddlers as a sorted array
TiddlyWiki.prototype.getTiddlers = function(field, excludeTag) {
    var results = [];
    this.forEachTiddler(function(title, tiddler) {
        if (excludeTag == undefined || !tiddler.isTagged(excludeTag))
            results.push(tiddler);
    });
    if (field)
        results.sort(function(a, b) { return a[field] < b[field] ? -1 : (a[field] == b[field] ? 0 : +1); });
    return results;
};

// Return array of names of tiddlers that are referred to but not defined
TiddlyWiki.prototype.getMissingLinks = function(sortField) {
    if (!this.tiddlersUpdated)
        this.updateTiddlers();
    var results = [];
    this.forEachTiddler(function(title, tiddler) {
        if (tiddler.isTagged("excludeMissing") || tiddler.isTagged("systemConfig") || tiddler.currentVer == 0)
            return;
        for (var n = 0; n < tiddler.links.length; n++) {
            var link = tiddler.links[n];
            if (this.fetchTiddler(link) == null && !this.isShadowTiddler(link))
                results.pushUnique(link);
        }
    });
    results.sort();
    return results;
};

// Return an array of names of tiddlers that are defined but not referred to
TiddlyWiki.prototype.getOrphans = function() {
    var results = [];
    this.forEachTiddler(function(title, tiddler) {
        if (this.getReferringTiddlers(title).length == 0 && !tiddler.isTagged("excludeLists"))
            if (tiddler.currentVer > 0) results.push(title);
    });
    results.sort();
    return results;
};

// Return an array of names of all the shadow tiddlers
TiddlyWiki.prototype.getShadowed = function() {
    var results = lazyLoadSpecial.slice(0);
    this.forEachTiddler(function(title, tiddler) {
        if (tiddler.hasShadow && lazyLoadSpecial.indexOf(title) == -1)
            results.push(tiddler.title);
    });
    results.sort();
    return results;
};

// Return an array of tiddlers that have been touched since they were downloaded or created
TiddlyWiki.prototype.getTouched = function() {
    var results = [];
    this.forEachTiddler(function(title, tiddler) {
        if (tiddler.isTouched())
            results.push(tiddler);
    });
    results.sort();
    return results;
};

// Resolves a Tiddler reference or tiddler title into a Tiddler object, or null if it doesn't exist
TiddlyWiki.prototype.resolveTiddler = function(tiddler) {
    var t = (typeof tiddler == 'string') ? this.getTiddler(tiddler) : tiddler;
    return t instanceof Tiddler ? t : null;
};

// Filter a list of tiddlers
TiddlyWiki.prototype.filterTiddlers = function(filter) {
    var results = [];
    if (filter) {
        var tiddler;
        var re = /([^\s\[\]]+)|(?:\[([ \w]+)\[([^\]]+)\]\])|(?:\[\[([^\]]+)\]\])/mg;
        var match = re.exec(filter);
        while (match) {
            if (match[1] || match[4]) {
                var title = match[1] || match[4];
                tiddler = this.fetchTiddler(title);
                if (tiddler) {
                    results.pushUnique(tiddler);
                } else if (this.isShadowTiddler(title)) {
                    tiddler = new Tiddler();
                    tiddler.set(title, this.getTiddlerText(title));
                    results.pushUnique(tiddler);
                }
            } else if (match[2]) {
                switch (match[2]) {
                    case "tag":
                        var matched = this.getTaggedTiddlers(match[3]);
                        for (var m = 0; m < matched.length; m++)
                            results.pushUnique(matched[m]);
                        break;
                    case "sort":
                        results = this.sortTiddlers(results, match[3]);
                        break;
                }
            }
            match = re.exec(filter);
        }
    }
    return results;
};

// Sort a list of tiddlers
TiddlyWiki.prototype.sortTiddlers = function(tiddlers, field) {
    var asc = +1;
    switch (field.substr(0, 1)) {
        case "-":
            asc = -1;
            // Note: this fall-through is intentional
            /*jsl:fallthru*/
        case "+":
            field = field.substr(1);
            break;
    }
    if (TiddlyWiki.standardFieldAccess[field])
        tiddlers.sort(function(a, b) { return a[field] < b[field] ? -asc : (a[field] == b[field] ? 0 : asc); });
    else
        tiddlers.sort(function(a, b) { return a.fields[field] < b.fields[field] ? -asc : (a.fields[field] == b.fields[field] ? 0 : +asc); });
    return tiddlers;
};

// Returns true if path is a valid field name (path),
// i.e. a sequence of identifiers, separated by '.'
TiddlyWiki.isValidFieldName = function(name) {
    var match = /[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*/.exec(name);
    return match && (match[0] == name);
};

// Throws an exception when name is not a valid field name.
TiddlyWiki.checkFieldName = function(name) {
    if (!TiddlyWiki.isValidFieldName(name))
        throw config.messages.invalidFieldName.format([name]);
};

function StringFieldAccess(n, readOnly, prior) {
    this.set = readOnly ?
        function(t, v) { if (v != t[n]) throw config.messages.fieldCannotBeChanged.format([n]); } :
        function(t, v) { if (v != t[n]) { t[n] = v; return true; } };
    this.get = 
        function(t) { return t[n]; };
}

function DateFieldAccess(n) {
    this.set = function(t, v) {
        var d = v instanceof Date ? v : Date.convertFromYYYYMMDDHHMM(v);
        if (d != t[n]) {
            t[n] = d; return true;
        }
    };
    this.get = function(t) { return t[n] ? t[n].convertToYYYYMMDDHHMM() : undefined; };
}

function LinksFieldAccess(n,i) {
    this.set = function(t, v) {
        var s = (typeof v == "string") ? v.readBracketedList() : v;
        if (s.toString() != t[n].toString()) {
            t[n] = s; return true;
        }
    };
    this.get = function(t,i) { return i === undefined ? String.encodeTiddlyLinkList(t[n]) : t[n][i]; };
}

TiddlyWiki.standardFieldAccess = {
    // The set functions return true when setting the data has changed the value.
    "title": new StringFieldAccess("title", true, true),
    // Handle the "tiddler" field name as the title
    "tiddler": new StringFieldAccess("title", true, true),
    "text": new StringFieldAccess("text", false, true),
    "modifier": new StringFieldAccess("modifier"),
    "modified": new DateFieldAccess("modified"),
    "created": new DateFieldAccess("created"),
    "versions": new StringFieldAccess("versions"),
    "id": new StringFieldAccess("id"),
    "version": new StringFieldAccess("version"),
    "comments": new StringFieldAccess("comments"),
    "tags": new LinksFieldAccess("tags")
};

TiddlyWiki.isStandardField = function(name) {
    return TiddlyWiki.standardFieldAccess[name] != undefined;
};

// Sets the value of the given field of the tiddler to the value.
// Setting an ExtendedField's value to null or undefined removes the field.
// Setting a namespace to undefined removes all fields of that namespace.
// The fieldName is case-insensitive.
// All values will be converted to a string value.
TiddlyWiki.prototype.setValue = function(tiddler, fieldName, value) {
    TiddlyWiki.checkFieldName(fieldName);
    var t = this.resolveTiddler(tiddler);
    if (!t)
        return;
    fieldName = fieldName.toLowerCase();
    var isRemove = (value === undefined) || (value === null);
    var accessor = TiddlyWiki.standardFieldAccess[fieldName];
    if (accessor) {
        if (isRemove)
        // don't remove StandardFields
            return;
        var h = TiddlyWiki.standardFieldAccess[fieldName];
        if (!h.set(t, value))
            return;
    } else {
        var oldValue = t.fields[fieldName];
        if (isRemove) {
            if (oldValue !== undefined) {
                // deletes a single field
                delete t.fields[fieldName];
            } else {
                // no concrete value is defined for the fieldName
                // so we guess this is a namespace path.
                // delete all fields in a namespace
                var re = new RegExp('^' + fieldName + '\\.');
                var dirty = false;
                for (var n in t.fields) {
                    if (n.match(re)) {
                        delete t.fields[n];
                        dirty = true;
                    }
                }
                if (!dirty)
                    return;
            }
        } else {
            // the "normal" set case. value is defined (not null/undefined)
            // For convenience provide a nicer conversion Date->String
            value = value instanceof Date ? value.convertToYYYYMMDDHHMMSSMMM() : String(value);
            if (oldValue == value)
                return;
            t.fields[fieldName] = value;
        }
    }
    // When we are here the tiddler/store really was changed.
    this.notify(t.title, true);
    if (!fieldName.match(/^temp\./))
        this.setDirty(true);
};

// Returns the value of the given field of the tiddler.
// The fieldName is case-insensitive.
// Will only return String values (or undefined).
TiddlyWiki.prototype.getValue = function (tiddler, fieldName, i) {
	var t = this.resolveTiddler(tiddler);
	if (!t)
		return undefined;
	fieldName = fieldName.toLowerCase();
	var accessor = TiddlyWiki.standardFieldAccess[fieldName];
	if (accessor) {
		return accessor.get(t, i);
	}
	var fv = t.fields[fieldName];
	if (typeof(fv) == 'string')
		fv = fv.split('\n');
	if (typeof(fv) == 'object')
		return fv[i || 0];
	else
		return "";
};

// Calls the callback function for every field in the tiddler.
// When callback function returns a non-false value the iteration stops
// and that value is returned.
// The order of the fields is not defined.
// @param callback a function(tiddler,fieldName,value).
TiddlyWiki.prototype.forEachField = function(tiddler, callback, onlyExtendedFields) {
    var t = this.resolveTiddler(tiddler);
    if (!t)
        return undefined;
    var n, result;
    for (n in t.fields) {
        result = callback(t, n, t.fields[n]);
        if (result)
            return result;
    }
    if (onlyExtendedFields)
        return undefined;
    for (n in TiddlyWiki.standardFieldAccess) {
        if (n == "tiddler")
        // even though the "title" field can also be referenced through the name "tiddler"
        // we only visit this field once.
            continue;
        result = callback(t, n, TiddlyWiki.standardFieldAccess[n].get(t));
        if (result)
            return result;
    }
    return undefined;
};

//--
//-- Story functions
//--

function Story(containerId, idPrefix) {
	this.container = containerId;
	this.containers = {};
	this.containers[containerId] = null;
    this.idPrefix = idPrefix;
    this.highlightRegExp = null;
    this.tiddlerId = function(title) {
        var id = this.idPrefix + title;
        return id == this.container ? this.idPrefix + "_" + title : id;
    };
    this.containerId = function() {
        return this.container;
    };
}

Story.prototype.getTiddler = function(title) {
    return document.getElementById(this.tiddlerId(title));
};

Story.prototype.getContainer = function() {
    return document.getElementById(this.containerId());
};

Story.prototype.itor = function (p, fn) {
	if (!p)
		return;
	var e = p.firstChild;
	while (e) {
		var n = e.nextSibling;
		try {
			var title = null;
			title = e.getAttribute("tiddler");
			fn.call(this, title, e);
		}
		catch (e) {
			if (title)
				displayMessage("Story/'" + title + "' fails: " + e);
		}
		e = n;
	}
};

Story.prototype.forEachTiddler = function (fn) {
	for (var ci in this.containers) {
		if (this.containers[ci] == null)
			this.containers[ci] = document.getElementById(ci);
		this.itor(this.containers[ci], fn);
	}
};

Story.prototype.displayDefaultTiddlers = function() {
	var dts = store.filterTiddlers(store.getTiddlerText("DefaultTiddlers"));
	if (dts.length > 0 && dts[0].title == 'PageSetup' && config.access != 'admin')
		dts.pop();
	this.displayTiddlers(null, dts);
};

Story.prototype.displayTiddlers = function(srcElement, titles, template, animate, unused, customFields, toggle) {
	var chkState = config.options.chkAutoSyncAddress;
	config.options.chkAutoSyncAddress = false; // cuz updating the address bar is too expensive to do in a loop
    for (var t = titles.length - 1; t >= 0; t--)
        this.displayTiddler(srcElement, titles[t], template, animate, unused, customFields);
	if (config.options.chkAutoSyncAddress != chkState) {
		this.permaView();
		config.options.chkAutoSyncAddress = chkState;
	}
};

Story.prototype.specialCases = [];
Story.prototype.displayTiddler = function (srcElement, tiddler, template, animate, unused, customFields, toggle, animationSrc, hiLite) {
	if (tiddler instanceof Tiddler) {
		var title = tiddler.title;
		var fields = tiddler.fields;
	}
	else {
		var title = tiddler;
		tiddler = store.getTiddler(title);
		var fields = tiddler ? tiddler.fields : null;
	}
	var sch = this.specialCases[title];
	if (sch && sch(title))
		return;
	if (hiLite) {
		var hlgs = highlightHack;
		highlightHack = hiLite;
	}
	var tiddlerElem = this.getTiddler(title);
	if (tiddlerElem) {
		if (toggle)
			this.closeTiddler(title, true);
		else
			this.refreshTiddler(title, template, false, customFields);
	} else {
		var place = this.getContainer();
		var before = this.positionTiddler(srcElement);
		if (fields && fields.space) {
			var want = document.getElementById(fields.space);
			if (want) {
				place = want;
				this.containers[fields.space] = want;
				srcElement = null;
				before = null;
			}
		}
		tiddlerElem = this.createTiddler(place, before, title, template, customFields, tiddler instanceof Tiddler ? tiddler : null);
	}
	if (hiLite)
		highlightHack = hlgs;
	var acas = [];
	if (getElementsByClassName('cxtoggle', 'a', tiddlerElem, acas)) {
		acas[0].onclick = function (ev) {
			var target = resolveTarget(ev || window.event);
			var trtxt = target.parentElement.parentElement.parentElement.children[1];
			trtxt.parentElement.removeChild(trtxt);
			target.parentElement.children[1].style.display = 'block';
			target.style.display = 'none';
			target.appendChild(trtxt);
		};
		acas[1].onclick = function (ev) {
			var target = resolveTarget(ev || window.event);
			var stasha = target.parentElement.children[0];
			var children = stasha.children;
			var trbody = target.parentElement.parentElement.parentElement;
			trbody.appendChild(children[0]);
			target.parentElement.children[0].style.display = 'block';
			target.style.display = 'none';
		};
	}
	if (animationSrc && typeof animationSrc !== "string") {
		srcElement = animationSrc;
	}
	if (!startingUp && config.options.chkAutoSyncAddress && title != "LoginDialog")
		this.permaView();
	if (srcElement && typeof srcElement !== "string") {
		if (config.options.chkAnimate && (animate == undefined || animate == true) && anim && typeof Zoomer == "function" && typeof Scroller == "function")
			anim.startAnimating(new Zoomer(title, srcElement, tiddlerElem), new Scroller(tiddlerElem));
		else
			window.scrollTo(0, ensureVisible(tiddlerElem));
	}
};

Story.prototype.positionTiddler = function(srcElement) {
    var place = this.getContainer();
    var before = null;
    if (typeof srcElement == "string") {
        switch (srcElement) {
            case "top":
                before = place.firstChild;
                break;
            case "bottom":
                before = null;
                break;
        }
    } else {
        var after = this.findContainingTiddler(srcElement);
        if (after == null) {
            before = place.firstChild;
        } else if (after.nextSibling) {
            before = after.nextSibling;
            if (before.nodeType != 1)
                before = null;
        }
    }
    return before;
};

Story.prototype.createTiddler = function(place, before, title, template, customFields, tiddler) {
    var tiddlerElem = createTiddlyElement(null, "div", this.tiddlerId(title), "tiddler");
    tiddlerElem.setAttribute("refresh", "tiddler");
    if (customFields)
        tiddlerElem.setAttribute("tiddlyFields", customFields);
    place.insertBefore(tiddlerElem, before);
    var defaultText = null;
    this.refreshTiddler(title, template, false, customFields, defaultText, tiddler);
    return tiddlerElem;
};

Story.prototype.chooseTemplateForTiddler = function(title, template) {
    if (!template)
        template = DEFAULT_VIEW_TEMPLATE;
    if (!isNaN(template)) {
        var tiddler = store.getTiddler(title);
        if (tiddler && tiddler.templates[template])
            template = tiddler.templates[template];
        else
            template = config.tiddlerTemplates[template];
    }
    return template;
};

Story.prototype.getTemplateForTiddler = function(title, template, tiddler) {
    return store.getRecursiveTiddlerText(template, null, 10);
};

Story.prototype.getHistoryView = function(tiddler) {
	var view = tiddler.fields.historyview;
	if (!view) {
		var tpt = store.fetchTiddler(this.chooseTemplateForTiddler(tiddler.title));
		if (tpt) {
			var tphv = tpt.fields.historyview;
			if (tphv)
				view = tphv;
		}
	}
	return view;
}

Story.prototype.refreshTiddler = function (title, template, force, customFields, defaultText, tdlr) {
	if (title == "" && template == DEFAULT_VIEW_TEMPLATE) {
		this.closeTiddler(title);
		return null;
	}
	var tiddlerElem = this.getTiddler(title);
	if (tiddlerElem) {
		if (tiddlerElem.getAttribute("dirty") == "true" && !force)
			return tiddlerElem;
		var tpln = this.chooseTemplateForTiddler(title, template);
		var currTemplate = tiddlerElem.getAttribute("template");
		if ((tpln != currTemplate) || force) {
			var tiddler = tdlr || store.getTiddler(title);
			var isEdit = template == DEFAULT_EDIT_TEMPLATE || (tiddler && template == tiddler.fields["edittemplate"]);
			if (!tiddler) {
				tiddler = new Tiddler();
				if (store.isShadowTiddler(title)) {
					tiddler.set(title, store.getTiddlerText(title), config.views.wikified.shadowModifier, version.date, [], version.date);
				} else {
					var text = isEdit ?
								config.views.editor.defaultText.format([title]) :
								config.views.wikified.defaultText.format([title]);
					text = defaultText || text;
					var fields = customFields ? customFields.decodeHashMap() : null;
					tiddler.set(title, text, config.views.wikified.defaultModifier, version.date, [], version.date, fields);
				}
			}
			else if (currTemplate == "EditTemplate") {
				if (tiddler.key && tiddler.until) {
					var r = http.unlockTiddler({ key: tiddler.key });
					delete tiddler.key;
				}
			}
			tiddlerElem.setAttribute("tags", tiddler.tags.join(" "));
			tiddlerElem.setAttribute("tiddler", title);
			tiddlerElem.setAttribute("template", tpln);
			tiddlerElem.onmouseover = this.onTiddlerMouseOver;
			tiddlerElem.onmouseout = this.onTiddlerMouseOut;
			tiddlerElem.ondblclick = this.onTiddlerDblClick;
			tiddlerElem[window.event ? "onkeydown" : "onkeypress"] = this.onTiddlerKeyPress;
			tiddlerElem.innerHTML = this.getTemplateForTiddler(title, tpln, tiddler);
			applyHtmlMacros(tiddlerElem, tiddler);
			if (store.getTaggedTiddlers(title).length > 0)
				addClass(tiddlerElem, "isTag");
			else
				removeClass(tiddlerElem, "isTag");
			if (store.tiddlerExists(title)) {
				removeClass(tiddlerElem, "shadow");
				removeClass(tiddlerElem, "missing");
			} else {
				addClass(tiddlerElem, store.isShadowTiddler(title) ? "shadow" : "missing");
			}
			if (customFields)
				this.addCustomFields(tiddlerElem, customFields);
			if (isEdit) {
				if (config.options.chkAutoSave)
					this.setTimer(config.autoSaveAfter);
				var atf = [];
				if (getElementsByClassName('tagFrame', 'fieldset', tiddlerElem, atf))
					atf[0].style.display = tiddler.tags.length > 0 ? "block" : "none";
			}
			forceReflow();
		}
	}
	return tiddlerElem;
};

Story.prototype.addCustomFields = function(place, customFields) {
    var fields = customFields.decodeHashMap();
    var w = document.createElement("div");
    w.style.display = "none";
    place.appendChild(w);
    for (var t in fields) {
        var e = document.createElement("input");
        e.setAttribute("type", "text");
        e.setAttribute("value", fields[t]);
        w.appendChild(e);
        e.setAttribute("edit", t);
    }
};

Story.prototype.refreshAllTiddlers = function(force) {
    var e = this.getContainer().firstChild;
    while (e) {
        var template = e.getAttribute("template");
        if (template && e.getAttribute("dirty") != "true") {
            this.refreshTiddler(e.getAttribute("tiddler"), force ? null : template, true);
        }
        e = e.nextSibling;
    }
};

Story.prototype.onTiddlerMouseOver = function(e) {
    if (window.addClass instanceof Function)
        addClass(this, "selected");
};

Story.prototype.onTiddlerMouseOut = function(e) {
    if (window.removeClass instanceof Function)
        removeClass(this, "selected");
};

Story.prototype.onTiddlerDblClick = function(ev) {
    var e = ev || window.event;
    var target = resolveTarget(e);
    if (target && target.nodeName.toLowerCase() != "input" && target.nodeName.toLowerCase() != "textarea") {
        if (document.selection && document.selection.empty)
            document.selection.empty();
        config.macros.toolbar.invokeCommand(this, "defaultCommand", e);
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
        return true;
    }
    return false;
};

Story.prototype.onTiddlerKeyPress = function(ev) {
    var e = ev || window.event;
    clearMessage();
	story.keyPressTime = new Date();
    var consume = false;
    var title = this.getAttribute("tiddler");
    var target = resolveTarget(e);
    switch (e.keyCode) {
        case 9: // Tab
            if (config.options.chkInsertTabs && target.tagName.toLowerCase() == "textarea") {
                replaceSelection(target, String.fromCharCode(9));
                consume = true;
            }
            if (config.isOpera) {
                target.onblur = function() {
                    this.focus();
                    this.onblur = null;
                };
            }
            break;
        case 13: // Ctrl-Enter
        case 10: // Ctrl-Enter on IE PC
        case 77: // Ctrl-Enter is "M" on some platforms
            if (e.ctrlKey) {
                blurElement(this);
                config.macros.toolbar.invokeCommand(this, "defaultCommand", e);
                consume = true;
            }
            break;
        case 27: // Escape
            blurElement(this);
            config.macros.toolbar.invokeCommand(this, "cancelCommand", e);
            consume = true;
            break;
    }
    e.cancelBubble = consume;
    if (consume) {
        if (e.stopPropagation) e.stopPropagation(); // Stop Propagation
        e.returnValue = true; // Cancel The Event in IE
        if (e.preventDefault) e.preventDefault(); // Cancel The Event in Moz
    }
    return !consume;
};

Story.prototype.getTiddlerField = function(title, field) {
    var tiddlerElem = this.getTiddler(title);
    var e = null;
    if (tiddlerElem) {
        var children = tiddlerElem.getElementsByTagName("*");
        for (var t = 0; t < children.length; t++) {
            var c = children[t];
            if (c.tagName.toLowerCase() == "input" || c.tagName.toLowerCase() == "textarea") {
                if (!e)
                    e = c;
                if (c.getAttribute("edit") == field)
                    e = c;
            }
        }
    }
    return e;
};

Story.prototype.focusTiddler = function(title, field) {
    var e = this.getTiddlerField(title, field);
    if (e) {
        e.focus();
        e.select();
    }
};

Story.prototype.blurTiddler = function(title) {
    var tiddlerElem = this.getTiddler(title);
    if (tiddlerElem && tiddlerElem.focus && tiddlerElem.blur) {
        tiddlerElem.focus();
        tiddlerElem.blur();
    }
};

Story.prototype.setTiddlerField = function(title, tag, mode, field) {
    var c = this.getTiddlerField(title, field);
    var tags = c.value.readBracketedList();
    tags.setItem(tag, mode);
    c.value = String.encodeTiddlyLinkList(tags);
};

Story.prototype.setTiddlerTag = function(title, tag, mode) {
    this.setTiddlerField(title, tag, mode, "tags");
};

Story.prototype.closeTiddler = function(title, animate, unused) {
    var tiddlerElem = this.getTiddler(title);
    if (tiddlerElem) {
        this.scrubTiddler(tiddlerElem);
        if (config.options.chkAnimate && animate && anim && typeof Slider == "function")
            anim.startAnimating(new Slider(tiddlerElem, false, null, "tiddler"));
        else {
            removeTiddlerNode(tiddlerElem);
            forceReflow();
        }
    }
};

Story.prototype.scrubTiddler = function(tiddlerElem) {
    tiddlerElem.id = null;
};

Story.prototype.setDirty = function(title, dirty) {
    var tiddlerElem = this.getTiddler(title);
    if (tiddlerElem)
        tiddlerElem.setAttribute("dirty", dirty ? "true" : "false");
};

Story.prototype.isDirty = function(title) {
    var tiddlerElem = this.getTiddler(title);
    if (tiddlerElem)
        return tiddlerElem.getAttribute("dirty") == "true";
    return null;
};

Story.prototype.areAnyDirty = function() {
    var r = false;
    this.forEachTiddler(function(title, element) {
        if (title != 'PageSetup' && this.hasChanges(title))
            r = true;
    });
    return r;
};

Story.prototype.closeAllTiddlers = function(exclude) {
    clearMessage();
	var chkState = config.options.chkAutoSyncAddress;
	config.options.chkAutoSyncAddress = false;
	this.forEachTiddler(function(title, element) {
		if ((title != exclude) && element.getAttribute("dirty") != "true")
			this.closeTiddler(title);
	});
	window.scrollTo(0, ensureVisible(this.container));
	config.options.chkAutoSyncAddress = chkState;
	if (chkState)
		story.permaView();
};

Story.prototype.isEmpty = function() {
    var place = this.getContainer();
    return place && place.firstChild == null;
};

Story.prototype.search = function(text, useCaseSensitive, useRegExp) {
    this.closeAllTiddlers();
    highlightHack = new RegExp(useRegExp ? text : text.escapeRegExp(), useCaseSensitive ? "mg" : "img");
    var matches = store.search(highlightHack, "title", "excludeSearch");
    this.displayTiddlers(null, matches);
    highlightHack = null;
    var q = useRegExp ? "/" : "'";
    if (matches.length > 0)
        displayMessage(config.macros.search.successMsg.format([matches.length.toString(), q + text + q]));
    else
        displayMessage(config.macros.search.failureMsg.format([q + text + q]));
};

Story.prototype.findContainingTiddler = function(e) {
    while (e && !hasClass(e, "tiddler"))
        e = e.parentNode;
    return e;
};

Story.prototype.getters = {
	checkbox: function (e) { return e.checked.toString(); },
	select: function (e) {
		var v = e.firstChild.nodeValue;
		var vs = e.getAttribute('values').split('|');
		if (v == vs[0] && v.startsWith('(') && v.endsWith(')')) // just a prompt
			v = "";
		return v;
	},
	text: function (e) {
		var v = e.value;
		if (v === undefined)
			Debugger("Type: " + typeof(e),"");
		else
			return e.value.replace(/\r/mg, "");
	}
};

Story.prototype.gatherSaveFields = function (e, fields) {
	if (e && e.getAttribute) {
		var f = e.getAttribute('edit');
		var i = e.getAttribute('index');
		if (f) {
			var gtr = this.getters[e.type];
			if (!gtr || f == 'text')
				gtr = this.getters.text;
			var v = gtr(e);
			if (i != null) {
				if (fields[f] === undefined)
					fields[f] = [];
				fields[f][i] = v;
			}
			else
				fields[f] = v;
		}
		if (e.hasChildNodes()) {
			var c = e.childNodes;
			for (var t = 0; t < c.length; t++)
				this.gatherSaveFields(c[t], fields);
		}
	}
};

Story.prototype.hasChanges = function(title) {
    var e = this.getTiddler(title);
    if (e) {
        var fields = {};
        this.gatherSaveFields(e, fields);
        var tiddler = store.fetchTiddler(title);
        if (!tiddler) {
			for (var n in fields) {
				if (!n.startsWith('server.') && fields[n])
					return true;
			}
		}
		else {
			for (var n in fields) {
				if (store.getValue(title, n) != fields[n]) { 
					//displayMessage("The " + n + " of " + title + " changed from '" + store.getValue(title, n) + "' to '" + fields[n] + "'");
					return true;
				}
			}
		}
    }
    return false;
};

function doAutoSave()
{
	delete story.timerId;
	var kpt = story.keyPressTime;
	if (kpt && (new Date()).getTime() - kpt.getTime() < Math.min(5000,story.saveDelay) && story.saveDelay > 1000) {
		story.saveDelay = story.saveDelay / 2;
		window.setTimeout(doAutoSave, story.saveDelay);
	}
	else if (story.autoSave())
		story.setTimer();
}

Story.prototype.setTimer = function(ai)
{
	if (ai)
		config.autoSaveInterval = ai;

	if (config.autoSaveInterval && this.timerId === undefined)
		this.timerId = window.setTimeout(doAutoSave, story.saveDelay = config.autoSaveInterval * 1000);
};

Story.prototype.autoSave = function()
{
	var r = false;
	if (config.options.chkAutoSave) this.forEachTiddler(function(title,element) {
		try {
			r = true;
			if(title != "PageSetup" && this.hasChanges(title)) {
				this.saveTiddler(title,false,null,true);
				displayMessage("autoSaved " + title);
			}
		}
		catch (x) {
				displayMessage("autoSaving " + title + " failed: " + exceptionText(x));
			
		}
	});
	return r;
};

Story.prototype.saveTiddler = function(title, minorUpdate, newTemplate, autoSave) {
    var tiddlerElem = this.getTiddler(title);
    if (tiddlerElem) {
        var fields = {};
        this.gatherSaveFields(tiddlerElem, fields);
        var newTitle = fields.title || title;
        if (!store.tiddlerExists(newTitle))
            newTitle = newTitle.trim();
		if (store.tiddlerExists(newTitle) && newTitle != title) {
			if (autoSave || !confirm(config.messages.overwriteWarning.format([newTitle.toString()])))
				return null;
		}
		if (newTitle != title)
			this.closeTiddler(newTitle, false);
		if (!autoSave) {
			tiddlerElem.id = this.tiddlerId(newTitle);
			tiddlerElem.setAttribute("tiddler", newTitle);
		}
		if (newTemplate === undefined)
			newTemplate = DEFAULT_VIEW_TEMPLATE;
		if (newTemplate != null)
			tiddlerElem.setAttribute("template", newTemplate);
		tiddlerElem.setAttribute("dirty", "false");
		if (config.options.chkForceMinorUpdate)
			minorUpdate = !minorUpdate;
		if (!store.tiddlerExists(newTitle))
			minorUpdate = false;
		var newDate = new Date();
		var extendedFields = store.tiddlerExists(newTitle) ? store.fetchTiddler(newTitle).fields :
			(newTitle != title && store.tiddlerExists(title) ? store.fetchTiddler(title).fields
															 : merge({},config.defaultCustomFields));
		for (var n in fields) {
			if (!TiddlyWiki.isStandardField(n))
				extendedFields[n] = fields[n];
		}

		var tiddler = store.saveTiddler(title, newTitle, fields.text, minorUpdate ? undefined : config.options.txtUserName, minorUpdate ? undefined : newDate, fields.tags, extendedFields, autoSave);
		if ((tiddler.isTagged("systemConfig") || tiddler.isTagged("systemScript")) && config.options.chkAutoReloadOnSystemConfigSave && !autoSave)
			window.location.reload();
        return newTitle || tiddler.title;
    }
    return null;
};

Story.prototype.viewState = function(axcl) {
    var links = [];
    this.forEachTiddler(function(title, element) {
		if (axcl == undefined || axcl.contains(title) == false)
			links.push(String.encodeTiddlyLink(title));
    });
    return encodeURIComponent(links.join(' '));
};

Story.prototype.permaView = function() {
	var t = this.viewState();
    if (t == '')
        t = '#';
    if (window.location.hash != t)
        window.location.hash = t;
};

Story.prototype.switchTheme = function(theme) {
    if (safeMode)
        return;

    var isAvailable = function(title) {
        var s = title ? title.indexOf(config.textPrimitives.sectionSeparator) : -1;
        if (s != -1)
            title = title.substr(0, s);
        return store.tiddlerExists(title) || store.isShadowTiddler(title);
    };

    var getSlice = function(theme, slice) {
        var r;
        if (readOnly)
            r = store.getTiddlerSlice(theme, slice + "ReadOnly") || store.getTiddlerSlice(theme, "Web" + slice);
        r = r || store.getTiddlerSlice(theme, slice);
        if (r && r.indexOf(config.textPrimitives.sectionSeparator) == 0)
            r = theme + r;
        return isAvailable(r) ? r : slice;
    };

    var replaceNotification = function(i, name, theme, slice) {
        var newName = getSlice(theme, slice);
        if (name != newName && store.namedNotifications[i].name == name) {
            store.namedNotifications[i].name = newName;
            return newName;
        }
        return name;
    };

    var pt = config.refresherData.pageTemplate;
    var vi = DEFAULT_VIEW_TEMPLATE;
    var vt = config.tiddlerTemplates[vi];
    var ei = DEFAULT_EDIT_TEMPLATE;
    var et = config.tiddlerTemplates[ei];

    for (var i = 0; i < config.notifyTiddlers.length; i++) {
        var name = config.notifyTiddlers[i].name;
        switch (name) {
            case "PageTemplate":
                config.refresherData.pageTemplate = replaceNotification(i, config.refresherData.pageTemplate, theme, name);
                break;
            case "StyleSheet":
                removeStyleSheet(config.refresherData.styleSheet);
                config.refresherData.styleSheet = replaceNotification(i, config.refresherData.styleSheet, theme, name);
                break;
            case "ColorPalette":
                config.refresherData.colorPalette = replaceNotification(i, config.refresherData.colorPalette, theme, name);
                break;
            default:
                break;
        }
    }
    config.tiddlerTemplates[vi] = getSlice(theme, "ViewTemplate");
    config.tiddlerTemplates[ei] = getSlice(theme, "EditTemplate");
    if (!startingUp) {
        if (config.refresherData.pageTemplate != pt || config.tiddlerTemplates[vi] != vt || config.tiddlerTemplates[ei] != et) {
            refreshAll();
            this.refreshAllTiddlers(true);
        } else {
            setStylesheet(store.getRecursiveTiddlerText(config.refresherData.styleSheet, "", 10), config.refreshers.styleSheet);
        }
        config.options.txtTheme = theme;
    }
};

//--
//-- Message area
//--

function getMessageDiv() {
    var msgArea = document.getElementById("messageArea");
    if (!msgArea)
        return null;
    if (!msgArea.hasChildNodes())
        createTiddlyButton(createTiddlyElement(msgArea, "div", null, "messageToolbar"),
        config.messages.messageClose.text,
        config.messages.messageClose.tooltip,
        clearMessage);
    msgArea.style.display = "block";
    return createTiddlyElement(msgArea, "div");
}

var displayedMessage;

function displayMessage(text, linkText) {
	displayedMessage = text;
    var e = getMessageDiv();
    if (!e) {
        alert(text);
        return;
    }
    if (linkText) {
        var link = createTiddlyElement(e, "a", null, null, text);
        link.href = linkText;
        link.target = "_blank";
    } else {
        e.innerHTML = text; //e.appendChild(document.createTextNode(text));
    }
	return text;
}

function clearMessage(m) {
	if (typeof m == 'string' && m != displayedMessage)
		return;
	displayedMessage = null;
    var msgArea = document.getElementById('messageArea');
    if (msgArea) {
        removeChildren(msgArea);
        msgArea.style.display = 'none';
    }
    return false;
}

//--
//-- Refresh mechanism
//--

config.notifyTiddlers = [
{ name: "StyleSheetLayout", notify: refreshStyles },
{ name: "StyleSheetColors", notify: refreshStyles },
{ name: "StyleSheet", notify: refreshStyles },
{ name: "StyleSheetPrint", notify: refreshStyles },
{ name: "PageTemplate", notify: refreshPageTemplate },
{ name: "SiteTitle", notify: refreshPageTitle },
{ name: "SiteSubtitle", notify: refreshPageTitle },
{ name: "ColorPalette", notify: refreshColorPalette },
{ name: null, notify: refreshTemplateList },
{ name: null, notify: refreshDisplay }
];

config.refreshers = {
    link: function(e, changeList) {
        var title = e.getAttribute("tiddlyLink");
        refreshTiddlyLink(e, title);
        return true;
    },

    tiddler: function(e, changeList) {
        var title = e.getAttribute("tiddler");
        var template = e.getAttribute("template");
        if (changeList && changeList.indexOf(title) != -1 && !story.isDirty(title))
            story.refreshTiddler(title, template, true);
        else
            refreshElements(e, changeList);
        return true;
    },

    content: function(e, changeList) {
        var title = e.getAttribute("tiddler");
        var force = e.getAttribute("force");
        if (force != null || changeList == null || changeList.indexOf(title) != -1) {
            removeChildren(e);
            wikify(store.getTiddlerText(title, ""), e, null, store.fetchTiddler(title));
            return true;
        } else
            return false;
    },

    macro: function(e, changeList) {
        var macro = e.getAttribute("macroName");
        var params = e.getAttribute("params");
        if (macro)
            macro = config.macros[macro];
        if (macro && macro.refresh)
            macro.refresh(e, params);
        return true;
    }
};

config.refresherData = {
    styleSheet: "StyleSheet",
    defaultStyleSheet: "StyleSheet",
    pageTemplate: "PageTemplate",
    defaultPageTemplate: "PageTemplate",
    colorPalette: "ColorPalette",
    defaultColorPalette: "ColorPalette"
};

function refreshElements(root, changeList) {
    var nodes = root.childNodes;
    for (var c = 0; c < nodes.length; c++) {
        var e = nodes[c], type = null;
        if (e.getAttribute && (e.tagName ? e.tagName != "IFRAME" : true))
            type = e.getAttribute("refresh");
        var refresher = config.refreshers[type];
        var refreshed = false;
        if (refresher != undefined)
            refreshed = refresher(e, changeList);
        if (e.hasChildNodes() && !refreshed)
            refreshElements(e, changeList);
    }
}

function applyHtmlMacros(root, tiddler) {
    var e = root.firstChild;
    while (e) {
        var nextChild = e.nextSibling;
        if (e.getAttribute) {
            var macro = e.getAttribute("macro");
            if (macro) {
                e.removeAttribute("macro");
                var params = "";
                var p = macro.indexOf(" ");
                if (p != -1) {
                    params = macro.substr(p + 1);
                    macro = macro.substr(0, p);
                }
                invokeMacro(e, macro, params, null, tiddler);
            }
        }
        if (e.hasChildNodes())
            applyHtmlMacros(e, tiddler);
        e = nextChild;
    }
}

function refreshPageTemplate(title) {
    var stash = createTiddlyElement(document.body, "div");
    stash.style.display = "none";
    var display = story.getContainer();
    var nodes, t;
    if (display) {
        nodes = display.childNodes;
        for (t = nodes.length - 1; t >= 0; t--)
            stash.appendChild(nodes[t]);
    }
    var wrapper = document.getElementById("contentWrapper");

    var isAvailable = function(title) {
        var s = title ? title.indexOf(config.textPrimitives.sectionSeparator) : -1;
        if (s != -1)
            title = title.substr(0, s);
        return store.tiddlerExists(title) || store.isShadowTiddler(title);
    };
    if (!title || !isAvailable(title))
        title = config.refresherData.pageTemplate;
    if (!isAvailable(title))
        title = config.refresherData.defaultPageTemplate; //# this one is always avaialable
    wrapper.innerHTML = store.getRecursiveTiddlerText(title, null, 10);
    applyHtmlMacros(wrapper);
    refreshElements(wrapper);
    display = story.getContainer();
    removeChildren(display);
    if (!display)
        display = createTiddlyElement(wrapper, "div", story.containerId());
    nodes = stash.childNodes;
    for (t = nodes.length - 1; t >= 0; t--)
        display.appendChild(nodes[t]);
    removeNode(stash);
}

function refreshTemplateList(title) {
	var t = store.getTiddler(title);
	if (t && t.tags.indexOf('tiddlerTemplate') != -1) {
		if (config.tiddlerTemplates.indexOf(title) == -1)
			config.tiddlerTemplates.push(title);
		refreshAll();
	}
}

function refreshDisplay(hint) {
    if (typeof hint == "string")
        hint = [hint];
    var e = document.getElementById("contentWrapper");
    refreshElements(e, hint);
}

function refreshPageTitle() {
    document.title = getPageTitle();
}

function getPageTitle() {
    var st = wikifyPlain("SiteTitle");
    var ss = wikifyPlain("SiteSubtitle");
    return st + ((st == "" || ss == "") ? "" : " - ") + ss;
}

function refreshStyles(title, doc) {
    setStylesheet(title == null ? "" : store.getRecursiveTiddlerText(title, "", 10), title, doc || document);
}

function refreshColorPalette(title) {
    if (!startingUp)
        refreshAll();
}

function refreshAll() {
    refreshPageTemplate();
    refreshDisplay();
    refreshStyles("StyleSheetLayout");
    refreshStyles("StyleSheetColors");
    refreshStyles(config.refresherData.styleSheet);
    refreshStyles("StyleSheetPrint");
}

config.optionHandlers = {
	'txt': {
		get: function(name) {return config.options[name].toString();},
		set: function(name,value) {config.options[name] = value;}
	},
	'chk': {
		get: function(name) {return config.options[name] ? "true" : "false";},
		set: function(name,value) {config.options[name] = value == "true";}
	}
};

// Implements the TiddlyWiki function saveOptionCookie(name) but saves the option server-side like other giewiki user options, not as a cookie
function saveOptionCookie(name)
{
	if (safeMode)
		return;
	var optType = name.substr(0,3);
	var handlers = config.optionHandlers;
	if (handlers[optType] && handlers[optType].get) {
		args = {};
		args[name] = handlers[optType].get(name);
		http.userProfile(args);
	}
}

config.macros.option.genericCreate = function(place, type, opt, className, desc) {
    var typeInfo = config.macros.option.types[type];
    var c = document.createElement(typeInfo.elementType);
    if (typeInfo.typeValue)
        c.setAttribute("type", typeInfo.typeValue);
    c[typeInfo.eventName] = typeInfo.onChange;
    c.setAttribute("option", opt);
    c.className = className || typeInfo.className;
    if (config.optionsDesc[opt])
        c.setAttribute("title", config.optionsDesc[opt]);
    place.appendChild(c);
    if (desc != "no")
        createTiddlyText(place, config.optionsDesc[opt] || opt);
    c[typeInfo.valueField] = config.options[opt];
    return c;
};

config.macros.option.onChangeHandlers = {
	txtUserName: function(e) {
		if (config.isLoggedIn())
			return confirm("This actually changes your penname");
		else {
			alert("Cannot be changed unless you are logged in!");
			return false;
		}
	}
};

config.macros.option.genericOnChange = function(e) {
    var opt = this.getAttribute("option");
    if (opt) {
		var cha = config.macros.option.onChangeHandlers[opt];
		if (cha)
			if (!cha())
				return;
        var optType = opt.substr(0, 3);
        var handler = config.macros.option.types[optType];
        if (handler.elementType && handler.valueField) {
			args = {};
			args[opt] = this[handler.valueField];
			http.userProfile(args);
            config.macros.option.propagateOption(opt, handler.valueField, this[handler.valueField], handler.elementType, this);
        }
    }
    return true;
};

config.macros.option.types = {
    'txt': {
        elementType: "input",
        valueField: "value",
        eventName: "onchange",
        className: "txtOptionInput",
        create: config.macros.option.genericCreate,
        onChange: config.macros.option.genericOnChange
    },
    'chk': {
        elementType: "input",
        valueField: "checked",
        eventName: "onclick",
        className: "chkOptionInput",
        typeValue: "checkbox",
        create: config.macros.option.genericCreate,
        onChange: config.macros.option.genericOnChange
    }
};

config.macros.option.onChangedHandlers = {
	chkAutoSyncAddress: function(n,v) {
		if (v)
			story.permaView();
		else
			window.location.hash = "#";
	}
};

config.macros.option.propagateOption = function(opt, valueField, value, elementType, elem) {
    config.options[opt] = value;
    var nodes = document.getElementsByTagName(elementType);
    for (var t = 0; t < nodes.length; t++) {
        var optNode = nodes[t].getAttribute("option");
        if (opt == optNode && nodes[t] != elem)
            nodes[t][valueField] = value;
    }
	var och = config.macros.option.onChangedHandlers[opt];
	if (och)
		och(opt,value);
};

config.macros.option.handler = function(place, macroName, params, wikifier, paramString) {
    params = paramString.parseParams("anon", null, true, false, false);
    var opt = (params[1] && params[1].name == "anon") ? params[1].value : getParam(params, "name", null);
    var className = (params[2] && params[2].name == "anon") ? params[2].value : getParam(params, "class", null);
    var desc = getParam(params, "desc", "no");
    var type = opt.substr(0, 3);
    var h = config.macros.option.types[type];
    if (h && h.create)
        h.create(place, type, opt, className, desc);
};

config.macros.options.handler = function(place, macroName, params, wikifier, paramString) {
    params = paramString.parseParams("anon", null, true, false, false);
    var showUnknown = getParam(params, "showUnknown", "no");
    var wizard = new Wizard();
    wizard.createWizard(place, this.wizardTitle);
    wizard.addStep(this.step1Title, this.step1Html);
    var markList = wizard.getElement("markList");
    var chkUnknown = wizard.getElement("chkUnknown");
    chkUnknown.checked = showUnknown == "yes";
    chkUnknown.onchange = this.onChangeUnknown;
    chkUnknown.onclick = this.onChangeUnknown;
    var listWrapper = document.createElement("div");
    markList.parentNode.insertBefore(listWrapper, markList);
    wizard.setValue("listWrapper", listWrapper);
    this.refreshOptions(listWrapper, showUnknown == "yes");
};

config.macros.options.refreshOptions = function(listWrapper, showUnknown) {
    var opts = [];
    for (var n in config.options) {
        var opt = {};
        opt.option = "";
        opt.name = n;
        opt.lowlight = !config.optionsDesc[n];
        opt.description = opt.lowlight ? this.unknownDescription : config.optionsDesc[n];
        if (!opt.lowlight || showUnknown)
            opts.push(opt);
    }
    opts.sort(function(a, b) { return a.name.substr(3) < b.name.substr(3) ? -1 : (a.name.substr(3) == b.name.substr(3) ? 0 : +1); });
    var listview = ListView.create(listWrapper, opts, this.listViewTemplate);
    for (n = 0; n < opts.length; n++) {
        var type = opts[n].name.substr(0, 3);
        var h = config.macros.option.types[type];
        if (h && h.create) {
            h.create(opts[n].colElements['option'], type, opts[n].name, null, "no");
        }
    }
};

config.macros.options.onChangeUnknown = function(e) {
    var wizard = new Wizard(this);
    var listWrapper = wizard.getValue("listWrapper");
    removeChildren(listWrapper);
    config.macros.options.refreshOptions(listWrapper, this.checked);
    return false;
   };

config.macros.tiwinate = {
	// <<tiwinate>> produces buttons to instantiate each of the tiddlerTemplates that are named like nounEditTemplate
	// <<tiwinate "label" template [tiddler|this|''] [className] [condition]>> produces a link to open tiddler using the specified template
	handler: function (place, macroName, params, wikifier, paramString) {
		if (params.length == 0) {
			var tpls = store.getTaggedTiddlers('tiddlerTemplate');
			for (var i = 0; i < tpls.length; i++) {
				var attt = tpls[i].title;
				var tpos = attt.indexOf('EditTemplate');
				if (tpos > 0) {
					var attk = attt.substring(0, tpos);
					tpls[i].fields.title = "New " + attk;
					var vtn = attk + 'ViewTemplate';
					if (store.getTiddler(vtn))
						tpls[i].fields.viewtemplate = vtn;
					createTiddlyButton(place, "new " + attk, "open new " + attk, onClickTiddlerLink, 'button', null, null,
						{tiddlyLink: attt + "/",tiddlyFields: String.encodeHashMap(tpls[i].fields)});
					delete tpls[i].fields.title;
					delete tpls[i].fields.viewtemplate;
				}
			}
		}
		else if (params[1] && (params[4] === undefined || eval(params[4]))) {
			var tn = params[2];
			var attrs = {};
			var using = " using ";
			if (tn === undefined || tn == 'this') {
				var ct = story.findContainingTiddler(place);
				if (ct)
					tn = ct.getAttribute("tiddler");
			}
			else if (tn == 'new' && params[5]) {
				attrs.tiddlyFields = params[5];
				tn = '';
				using = " ";
			}
			var btnClass = params[3] || (place.parentElement.className == 'toolbar' ? 'button' : 'tiddlyLinkExisting');
			attrs.tiddlyLink = params[1] + "/" + tn;
			createTiddlyButton(place,params[0],"open " + (params[2] || '') + using + params[1],onClickTiddlerLink,btnClass,null,null,attrs);
		}
	}
};

// If there are unsaved changes, force the user to confirm before exiting
function confirmExit() {
    hadConfirmExit = true;
    if (story && story.areAnyDirty && story.areAnyDirty())
        return config.messages.confirmExit;
}

//--
//-- TiddlyWiki-specific utility functions
//--

function formatVersion(v) {
    v = v || version;
    return v.major + "." + v.minor + "." + v.revision + (v.beta ? " (beta " + v.beta + ")" : "");
}

function compareVersions(v1, v2) {
    var a = ["major", "minor", "revision"];
    for (var i = 0; i < a.length; i++) {
        var x1 = v1[a[i]] || 0;
        var x2 = v2[a[i]] || 0;
        if (x1 < x2)
            return 1;
        if (x1 > x2)
            return -1;
    }
    x1 = v1.beta || 9999;
    x2 = v2.beta || 9999;
    if (x1 < x2)
        return 1;
    return x1 > x2 ? -1 : 0;
}

function createTiddlyButton(parent, text, tooltip, action, className, id, accessKey, attribs) {
    var btn = document.createElement("a");
    if (action) {
        if (typeof action == "string")
			btn.setAttribute("href", action);
        else {
			btn.onclick = action;
			btn.setAttribute("href", "javascript:;");
		}
    }
    if (tooltip)
        btn.setAttribute("title", tooltip);
    if (text)
        btn.appendChild(document.createTextNode(text));
    btn.className = className || "button";
    if (id)
        btn.id = id;
    if (attribs) {
        for (var i in attribs) {
            btn.setAttribute(i, attribs[i]);
        }
    }
    if (parent)
        parent.appendChild(btn);
    if (accessKey)
        btn.setAttribute("accessKey", accessKey);
    return btn;
}

function createTiddlyLink(place, title, includeText, className, isStatic, linkedFromTiddler, noToggle, hiLite) {
    var text = includeText ? title : null;
    var i = getTiddlyLinkInfo(title, className);
    var btn = isStatic ? createExternalLink(place, store.getTiddlerText("SiteUrl", null) + "#" + title) : createTiddlyButton(place, text, i.subTitle, i.href || onClickTiddlerLink, i.classes);
    if (isStatic)
        btn.className += ' ' + className;
    btn.setAttribute("refresh", "link");
    btn.setAttribute("tiddlyLink", title);
	if (hiLite !== undefined)
		btn.setAttribute('hiLite',hiLite);
    if (noToggle)
        btn.setAttribute("noToggle", "true");
    if (linkedFromTiddler) {
        var fields = linkedFromTiddler.getInheritedFields();
        if (fields)
            btn.setAttribute("tiddlyFields", fields);
    }
    return btn;
}

function refreshTiddlyLink(e, title) {
    var i = getTiddlyLinkInfo(title, e.className);
    e.className = i.classes;
    e.title = i.subTitle;
}

function getTiddlyLinkInfo(title, currClasses) {
    var classes = currClasses ? currClasses.split(" ") : [];
    var link;
    var existing = false;
    classes.pushUnique("tiddlyLink");
    var sp = title.indexOf('/');
	if (sp > 0 && config.tiddlerTemplates.indexOf(title.substring(0, sp)))
		title = title.substring(sp + 1);
	var subTitle = lazyLoadAll[title] === undefined ? null : "info not loaded";
	if (subTitle == null) {
		var tiddler = store.fetchTiddler(title);
		if (tiddler) {
			if (tiddler.id)
				existing = true;
			subTitle = tiddler.getSubtitle();
		}
	}
	else
		existing = true; // except for shadows...

	if (existing) {
        classes.pushUnique("tiddlyLinkExisting");
        classes.remove("tiddlyLinkNonExisting");
        classes.remove("shadow");
    } else if (config.pages[title]) {
        subTitle = config.pages[title].s || config.pages[title].t;
        link = config.pages[title].p;
        classes.pushUnique("tiddlyLinkExisting");
        classes.remove("tiddlyLinkNonExisting");
        classes.remove("shadow");
    } else {
        classes.remove("tiddlyLinkExisting");
        classes.pushUnique("tiddlyLinkNonExisting");
        if (store.isShadowTiddler(title)) {
            subTitle = config.messages.shadowedTiddlerToolTip.format([title]);
            classes.pushUnique("shadow");
        } else {
            subTitle = config.messages.undefinedTiddlerToolTip.format([title]);
            classes.remove("shadow");
        }
    }
    if (typeof config.annotations[title] == "string")
        subTitle = config.annotations[title];
    return { classes: classes.join(" "), subTitle: subTitle, href: link };
}

function createExternalLink(place, url) {
    var link = document.createElement("a");
    link.className = "externalLink";
    link.href = url;
    link.title = config.messages.externalLinkTooltip.format([url]);
    if (config.options.chkOpenInNewWindow)
        link.target = "_blank";
    place.appendChild(link);
    return link;
}

config.macros.editFields = {
	edit: function(e) {
		var target = resolveTarget(e || window.event);
		var fld = target.getAttribute('field');
		var pe = target.parentElement.parentElement;
		var oe = pe.getElementsByTagName('a');
		for (var i = oe.length - 1; i >= 0; i--) {
			var oei = oe[i];
			var fc = target === oei;
			var ne = createTiddlyElement(oei.parentElement,'input',null,null,null,{ type: 'text', size: '50', autocomplete: 'off', field: fld });
			if (oei.firstChild && oei.firstChild.nodeValue != "+ ..")
				ne.value = oei.firstChild.nodeValue;
			removeNode(oei);
			if (fc)
				ne.focus();
		}
	},
	add: function(e) {
		var target = resolveTarget(e || window.event);
		var pe = target.parentElement.parentElement.parentElement;
		var coti = story.findContainingTiddler(target);
		var fv = forms[pfxFields + target.getAttribute('tiddler')]
		var tri = pe.firstChild;
		var all = [];
		while (tri.nextSibling) {
			all.push(tri);
			tri = tri.nextSibling;
		}
		var ir = all[all.length - 1];
		if (fv.fldvalue === undefined)
			return ir.childNodes[1].firstChild.focus();
		var trn = document.createElement('TR');
		fv.fldname = fv.fldname.toLowerCase().replace(/ /mg, "_");
		createTiddlyElement(trn,'TD',null,null,fv.fldname);
		var atd = createTiddlyElement(trn,'TD',null);
		var e = createTiddlyElement(null,'input');
		e.setAttribute('field', fv.fldname);
		e.setAttribute('type', 'text');
		e.value = fv.fldvalue;
		e.setAttribute('size', '50');
		e.setAttribute('autocomplete', 'off');
		atd.appendChild(e);
		pe.insertBefore(trn, ir);
		fv.controls.fldname.value = "";
		fv.controls.fldvalue.value = "";
	},
	save: function(e) {
		var target = resolveTarget(e || window.event);
		var title = target.getAttribute('tiddler');
		var tiddler = store.getTiddler(title);
		var pe = target.parentElement.parentElement.parentElement;
		var edits = pe.getElementsByTagName('input');
		var vals = {};
		for (var i = 0; i < edits.length; i++) {
			var ee = edits[i];
			var se = ee.parentElement.firstChild;
			var fn = se.getAttribute('field');
			if (fn != null) {
				if (vals[fn] === undefined)
					vals[fn] = [];
				if (ee.value !== '')
					vals[fn].push(ee.value);
				tiddler.fields[fn] = vals[fn].join('\n');
			}
		}
		store.saveTiddler(title, title, tiddler.text, config.options.txtUserName, undefined, String.encodeTiddlyLinkList(tiddler.tags), tiddler.fields, false);
		var coti = story.findContainingTiddler(target);
		story.closeTiddler(coti.getAttribute('tiddler'),true);
	},
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var eda = config.admin;
		if (params.length > 1) {
			if (params[1] == '/+') {
				createTiddlyButton(place,"add..","Add field",this.add,null,null,null,{ tiddler: params[0] });
			}
			else {
				var vals = eval('"' + params[2] + '"').split('\n');
				vals.push("+ ..");
				for (var i = 0; i < vals.length; i++) {
					var wd = createTiddlyElement(place, 'div');
					createTiddlyButton(wd, vals[i], "Click to edit", eda ? this.edit : null, 'tiddlerField', null, null, { tiddler: params[0], field: params[1] });
				}
			}
		}
		else if (eda)
			createTiddlyButton(place,"Save","Save changes",this.save,'button',null,null, { tiddler: params[0] });
	}
};

function updateTemplatesOfTiddler(tiddler) {
	var title = tiddler.title;
	for (fn in tiddler.fields) {
		switch (fn) {
			case 'viewtemplate':
				tiddler.templates[DEFAULT_VIEW_TEMPLATE] = tiddler.fields[fn];
				story.refreshTiddler(title);
				break;
			case 'edittemplate':
				tiddler.templates[DEFAULT_EDIT_TEMPLATE] = tiddler.fields[fn];
				if (story.isDirty(title))
					story.refreshTiddler(title, DEFAULT_EDIT_TEMPLATE, true);
				break;
		}
	}
}

// Event handler for clicking on a tiddly link
function onClickTiddlerLink(ev) {
    var e = ev || window.event;
    var target = resolveTarget(e);
    var link = target;
    var title = null;
    var fields = null;
    var noToggle = null;
	var hiLite = null;
    do {
        title = link.getAttribute("tiddlyLink");
        fields = link.getAttribute("tiddlyFields");
        noToggle = link.getAttribute("noToggle");
		hiLite = link.getAttribute('hiLite');
        link = link.parentNode;
    } while (title == null && link != null);
	if (hiLite != null)
		hiLite = new RegExp(hiLite,'img');
	TiddlerLinkHandler(target,title,fields,noToggle,e,hiLite);
}

function TiddlerLinkHandler(target,title,fields,noToggle,e,hiLite)
{
	var meta = title.startsWith(pfxFields);
	var tn = meta ?	title.substring(pfxFields.length) : title;
    var f = fields ? fields.decodeHashMap() : {};

    if (!store.isShadowTiddler(tn)) {
        fields = String.encodeHashMap(merge(f, config.defaultCustomFields, true));
    }
    if (tn) {
    	var toggling = e && (e.metaKey || e.ctrlKey);
        if (config.options.chkToggleLinks)
            toggling = !toggling;
        if (noToggle)
            toggling = false;
		var t = store.getTiddler(tn);
		if (t == null) {
			var tsp = tn.indexOf('/'); // look for templateName/tiddlerName pattern
			if (tsp > 0) {
				var ttn = tn.substring(0,tsp);
				if (config.tiddlerTemplates.indexOf(ttn) != -1) {
					var tnp = tn.substring(tsp + 1);
					if (tnp == '') {
						var nt = new Tiddler("", 0, "");
						nt.fields = f;
						if (f.title) {
							nt.caption = f.title;
							delete f.title;
						}
						f.edittemplate = ttn;
						story.displayTiddler(null,nt,ttn,false,null,String.encodeHashMap(merge(f, config.defaultCustomFields, true)));
						story.focusTiddler("",'title');
						return;
					}
					else {
						t = store.getTiddler(tnp);
						if (t) {
							var tiddlerElem = story.getTiddler(tnp);
							var fields = tiddlerElem && tiddlerElem.getAttribute("tiddlyFields");
							story.displayTiddler(null, t, ttn, false, null, fields, toggling);
							story.focusTiddler(tnp, config.options.txtEditorFocus || "text");
							return;
						}
					}
				}
			}
		}
		if (t && meta) {
			merge(f, { viewtemplate: 'ViewTemplate', edittemplate: 'EditTemplate', space: story.container }, true);
			var tfta = ['|Field|Value|h']
			var jstn = tn.toJSONString();
			for (var fld in t.fields) {
				var fv = t.fields[fld];
				if (typeof (fv) == 'object')
					fv = fv.join('\n');
				if (fv != '')
					tfta.push(['|', fld, '|<<editFields ', jstn,' "', fld, '" ', fv.toJSONString(),'>>|'].join(''));
			}
			for (var dfn in f) {
				if (typeof(t.fields[dfn]) == 'undefined')
					tfta.push(['|', dfn, '|<<editFields ', jstn,' "', dfn, '" ', f[dfn],'>>|'].join(''));					
			}
			tfta.push('|<<input fldname text 20>>|<<input fldvalue text 50>>|')
			tfta.push('|<<editFields ' + jstn + ' /+ >>|<<editFields ' + jstn + '>>|');
			t = new Tiddler(title,t.version,tfta.join('\n'));
			forms[pfxFields + tn] = { updateaccess: true };
            story.displayTiddler(target, t, 'ViewOnlyTemplate');
		}
		else if (t)
            t.display(target,fields,toggling,hiLite);
        else
            story.displayTiddler(target, title, null, true, null, null, toggling);
    }
    return false;
}

// Create a button for a tag with a popup listing all the tiddlers that it tags
function createTagButton(place, tag, excludeTiddler, title, tooltip) {
    var btn = createTiddlyButton(place, title || tag, (tooltip || config.views.wikified.tag.tooltip).format([tag]), onClickTag);
    btn.setAttribute("tag", tag);
    if (excludeTiddler)
        btn.setAttribute("tiddler", excludeTiddler);
    return btn;
}

// Event handler for clicking on a tiddler tag
function onClickTag(ev) {
    var e = ev || window.event;
    var popup = Popup.create(this);
    var tag = this.getAttribute("tag");
    var title = this.getAttribute("tiddler");
    if (popup && tag) {
        var tagged = store.getTaggedTiddlers(tag);
        var titles = [];
        var li, r;
        for (r = 0; r < tagged.length; r++) {
            if (tagged[r].title != title)
                titles.push(tagged[r].title);
        }
		var tla = config.tagLinks[tag];
        var lingo = config.views.wikified.tag;
        if (titles.length > 0 || tla) {
            var openAll = createTiddlyButton(createTiddlyElement(popup, "li"), lingo.openAllText.format([tag]), lingo.openAllTooltip, onClickTagOpenAll);
            openAll.setAttribute("tag", tag);
            createTiddlyElement(createTiddlyElement(popup, "li", null, "listBreak"), "div");
            for (r = 0; r < titles.length; r++) {
                createTiddlyLink(createTiddlyElement(popup, "li"), titles[r], true);
            }
			if (tla) {
				if (titles.length > 0)
					createTiddlyElement(createTiddlyElement(popup, "li", null, "listBreak"), "div");
				for (r = 0; r < tla.length; r++)
					createTiddlyText(createExternalLink(createTiddlyElement(popup, "li"), tla[r].link),tla[r].page + ": " + tla[r].title);
			}
        } else {
            createTiddlyText(createTiddlyElement(popup, "li", null, "disabled"), lingo.popupNone.format([tag]));
        }
        createTiddlyElement(createTiddlyElement(popup, "li", null, "listBreak"), "div");
        var h = createTiddlyLink(createTiddlyElement(popup, "li"), tag, false);
        createTiddlyText(h, lingo.openTag.format([tag]));
    }
    Popup.show();
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
    return false;
}

// Event handler for 'open all' on a tiddler popup
function onClickTagOpenAll(ev) {
    var tiddlers = store.getTaggedTiddlers(this.getAttribute("tag"));
    story.displayTiddlers(this, tiddlers);
    return false;
}

function onClickError(ev) {
    var e = ev || window.event;
    var popup = Popup.create(this);
    var lines = this.getAttribute("errorText").split("\n");
    for (var t = 0; t < lines.length; t++)
        createTiddlyElement(popup, "li", null, null, lines[t]);
    Popup.show();
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
    return false;
}

function createTiddlyDropDown(place, onchange, options, defaultValue) {
    var sel = createTiddlyElement(place, "select");
    sel.onchange = onchange;
    for (var t = 0; t < options.length; t++) {
        var e = createTiddlyElement(sel, "option", null, null, options[t].caption);
        e.value = options[t].name;
        if (options[t].name == defaultValue)
            e.selected = true;
    }
    return sel;
}

function createTiddlyPopup(place, caption, tooltip, tiddler) {
    if (tiddler.text) {
        createTiddlyLink(place, caption, true);
        var btn = createTiddlyButton(place, glyph("downArrow"), tooltip, onClickTiddlyPopup, "tiddlerPopupButton");
        btn.tiddler = tiddler;
    } else {
        createTiddlyText(place, caption);
    }
}

function onClickTiddlyPopup(ev) {
    var e = ev || window.event;
    var tiddler = this.tiddler;
    if (tiddler.text) {
        var popup = Popup.create(this, "div", "popupTiddler");
        wikify(tiddler.text, popup, null, tiddler);
        Popup.show();
    }
    if (e) e.cancelBubble = true;
    if (e && e.stopPropagation) e.stopPropagation();
    return false;
}

function createTiddlyError(place, title, text) {
    var btn = createTiddlyButton(place, title, null, onClickError, "errorButton");
    if (text) btn.setAttribute("errorText", text);
}

function merge(dst, src, preserveExisting) {
    for (var i in src) {
        if (!preserveExisting || dst[i] === undefined)
            dst[i] = src[i];
    }
    return dst;
}

// Returns a string containing the description of an exception, optionally prepended by a message
function exceptionText(e, message) {
    var s = e.description || e.toString();
    return message ? "%0:\n%1".format([message, s]) : s;
}

// Displays an alert of an exception description with optional message
function showException(e, message) {
    alert(exceptionText(e, message));
}

function glyph(name) {
    var g = config.glyphs;
    var b = g.currBrowser;
    if (b == null) {
        b = 0;
        while (!g.browsers[b]() && b < g.browsers.length - 1)
            b++;
        g.currBrowser = b;
    }
    if (!g.codes[name])
        return "";
    return g.codes[name][b];
}

if (!window.console) {
    console = { log: function(message) { displayMessage(message); } };
}

//-
//- Animation engine
//-

function Animator() {
    this.running = 0; // Incremented at start of each animation, decremented afterwards. If zero, the interval timer is disabled
    this.timerID = 0; // ID of the timer used for animating
    this.animations = []; // List of animations in progress
    return this;
}

// Start animation engine
Animator.prototype.startAnimating = function() //# Variable number of arguments
{
    for (var t = 0; t < arguments.length; t++)
        this.animations.push(arguments[t]);
    if (this.running == 0) {
        var me = this;
        this.timerID = window.setInterval(function() { me.doAnimate(me); }, 10);
    }
    this.running += arguments.length;
};

// Perform an animation engine tick, calling each of the known animation modules
Animator.prototype.doAnimate = function(me) {
    var a = 0;
    while (a < me.animations.length) {
        var animation = me.animations[a];
        if (animation.tick()) {
            a++;
        } else {
            me.animations.splice(a, 1);
            if (--me.running == 0)
                window.clearInterval(me.timerID);
        }
    }
};

Animator.slowInSlowOut = function(progress) {
    return (1 - ((Math.cos(progress * Math.PI) + 1) / 2));
};

//--
//-- Morpher animation
//--

// Animate a set of properties of an element
function Morpher(element, duration, properties, callback) {
    this.element = element;
    this.duration = duration;
    this.properties = properties;
    this.startTime = new Date();
    this.endTime = Number(this.startTime) + duration;
    this.callback = callback;
    this.tick();
    return this;
}

Morpher.prototype.assignStyle = function(element, style, value) {
    switch (style) {
        case "-tw-vertScroll":
            window.scrollTo(findScrollX(), value);
            break;
        case "-tw-horizScroll":
            window.scrollTo(value, findScrollY());
            break;
        default:
            element.style[style] = value;
            break;
    }
};

Morpher.prototype.stop = function() {
    for (var t = 0; t < this.properties.length; t++) {
        var p = this.properties[t];
        if (p.atEnd !== undefined) {
            this.assignStyle(this.element, p.style, p.atEnd);
        }
    }
    if (this.callback)
        this.callback(this.element, this.properties);
};

Morpher.prototype.tick = function() {
    var currTime = Number(new Date());
    var progress = Animator.slowInSlowOut(Math.min(1, (currTime - this.startTime) / this.duration));
    for (var t = 0; t < this.properties.length; t++) {
        var p = this.properties[t];
        if (p.start !== undefined && p.end !== undefined) {
            var template = p.template || "%0";
            switch (p.format) {
                case undefined:
                case "style":
                    var v = p.start + (p.end - p.start) * progress;
                    this.assignStyle(this.element, p.style, template.format([v]));
                    break;
                case "color":
                    break;
            }
        }
    }
    if (currTime >= this.endTime) {
        this.stop();
        return false;
    }
    return true;
};

//--
//-- Zoomer animation
//--

function Zoomer(text, startElement, targetElement, unused) {
    var e = createTiddlyElement(document.body, "div", null, "zoomer");
    createTiddlyElement(e, "div", null, null, text);
    var winWidth = findWindowWidth();
    var winHeight = findWindowHeight();
    var p = [
    { style: 'left', start: findPosX(startElement), end: findPosX(targetElement), template: '%0px' },
    { style: 'top', start: findPosY(startElement), end: findPosY(targetElement), template: '%0px' },
    { style: 'width', start: Math.min(startElement.scrollWidth, winWidth), end: Math.min(targetElement.scrollWidth, winWidth), template: '%0px', atEnd: 'auto' },
    { style: 'height', start: Math.min(startElement.scrollHeight, winHeight), end: Math.min(targetElement.scrollHeight, winHeight), template: '%0px', atEnd: 'auto' },
    { style: 'fontSize', start: 8, end: 24, template: '%0pt' }
];
    var c = function(element, properties) { removeNode(element); };
    return new Morpher(e, config.animDuration, p, c);
}

//--
//-- Scroller animation
//--

function Scroller(targetElement) {
    var p = [{ style: '-tw-vertScroll', start: findScrollY(), end: ensureVisible(targetElement)}];
    return new Morpher(targetElement, config.animDuration, p);
}

//--
//-- Slider animation
//--

// deleteMode - "none", "all" [delete target element and it's children], [only] "children" [but not the target element]
function Slider(element, opening, unused, deleteMode) {
    element.style.overflow = 'hidden';
    if (opening)
        element.style.height = '0px'; // Resolves a Firefox flashing bug
    element.style.display = 'block';
    var left = findPosX(element);
    var width = element.scrollWidth;
    var height = element.scrollHeight;
    var winWidth = findWindowWidth();
    var p = [];
    var c = null;
    if (opening) {
        p.push({ style: 'height', start: 0, end: height, template: '%0px', atEnd: 'auto' });
        p.push({ style: 'opacity', start: 0, end: 1, template: '%0' });
        p.push({ style: 'filter', start: 0, end: 100, template: 'alpha(opacity:%0)' });
    } else {
        p.push({ style: 'height', start: height, end: 0, template: '%0px' });
        p.push({ style: 'display', atEnd: 'none' });
        p.push({ style: 'opacity', start: 1, end: 0, template: '%0' });
        p.push({ style: 'filter', start: 100, end: 0, template: 'alpha(opacity:%0)' });
        switch (deleteMode) {
            case "tiddler":
                c = function(element, properties) { removeTiddlerNode(element); };
                break;
            case "all":
                c = function(element, properties) { removeNode(element); };
                break;
            case "children":
                c = function(element, properties) { removeChildren(element); };
                break;
        }
    }
    return new Morpher(element, config.animDuration, p, c);
}

//--
//-- Popup menu
//--

var Popup = {
    stack: [] // Array of objects with members root: and popup:
};

Popup.create = function(root, elem, className) {
    var stackPosition = this.find(root, "popup");
    Popup.remove(stackPosition + 1);
    var popup = createTiddlyElement(document.body, elem || "ol", "popup", className || "popup");
    popup.stackPosition = stackPosition;
    Popup.stack.push({ root: root, popup: popup });
    return popup;
};

Popup.onDocumentClick = function(ev) {
    var e = ev || window.event;
    if (e.eventPhase == undefined)
        Popup.remove();
    else if (e.eventPhase == Event.BUBBLING_PHASE || e.eventPhase == Event.AT_TARGET)
        Popup.remove();
    return true;
};

Popup.show = function(valign, halign, offset) {
    var curr = Popup.stack[Popup.stack.length - 1];
    this.place(curr.root, curr.popup, valign, halign, offset);
    addClass(curr.root, "highlight");
    if (config.options.chkAnimate && anim && typeof Scroller == "function")
        anim.startAnimating(new Scroller(curr.popup));
    else
        window.scrollTo(0, ensureVisible(curr.popup));
};

Popup.place = function(root, popup, valign, halign, offset) {
    if (!offset)
        var offset = { x: 0, y: 0 };
    if (popup.stackPosition >= 0 && !valign && !halign) {
        offset.x = offset.x + root.offsetWidth;
    } else {
        offset.x = (halign == 'right') ? offset.x + root.offsetWidth : offset.x;
        offset.y = (valign == 'top') ? offset.y : offset.y + root.offsetHeight;
    }
    var rootLeft = findPosX(root);
    var rootTop = findPosY(root);
    var popupLeft = rootLeft + offset.x;
    var popupTop = rootTop + offset.y;
    var winWidth = findWindowWidth();
    if (popup.offsetWidth > winWidth * 0.75)
        popup.style.width = winWidth * 0.75 + "px";
    var popupWidth = popup.offsetWidth;
    var scrollWidth = winWidth - document.body.offsetWidth;
    if (popupLeft + popupWidth > winWidth - scrollWidth - 1) {
        if (halign == 'right')
            popupLeft = popupLeft - root.offsetWidth - popupWidth;
        else
            popupLeft = winWidth - popupWidth - scrollWidth - 1;
    }
    popup.style.left = popupLeft + "px";
    popup.style.top = popupTop + "px";
    popup.style.display = "block";
};

Popup.find = function(e) {
    var pos = -1;
    for (var t = this.stack.length - 1; t >= 0; t--) {
        if (isDescendant(e, this.stack[t].popup))
            pos = t;
    }
    return pos;
};

Popup.remove = function(pos) {
    if (!pos) var pos = 0;
    if (Popup.stack.length > pos) {
        Popup.removeFrom(pos);
    }
};

Popup.removeFrom = function(from) {
    for (var t = Popup.stack.length - 1; t >= from; t--) {
        var p = Popup.stack[t];
        removeClass(p.root, "highlight");
        removeNode(p.popup);
    }
    Popup.stack = Popup.stack.slice(0, from);
};

//--
//-- Wizard support
//--

function Wizard(elem) {
    if (elem) {
        this.formElem = findRelated(elem, "wizard", "className");
        this.bodyElem = findRelated(this.formElem.firstChild, "wizardBody", "className", "nextSibling");
        this.footElem = findRelated(this.formElem.firstChild, "wizardFooter", "className", "nextSibling");
    } else {
        this.formElem = null;
        this.bodyElem = null;
        this.footElem = null;
    }
}

Wizard.prototype.setValue = function(name, value) {
    if (this.formElem)
        this.formElem[name] = value;
};

Wizard.prototype.getValue = function(name) {
    return this.formElem ? this.formElem[name] : null;
};

Wizard.prototype.createWizard = function(place, title) {
    this.formElem = createTiddlyElement(place, "form", null, "wizard");
    createTiddlyElement(this.formElem, "h1", null, null, title);
    this.bodyElem = createTiddlyElement(this.formElem, "div", null, "wizardBody");
    this.footElem = createTiddlyElement(this.formElem, "div", null, "wizardFooter");
};

Wizard.prototype.clear = function() {
    removeChildren(this.bodyElem);
};

Wizard.prototype.setButtons = function(buttonInfo, status) {
    removeChildren(this.footElem);
    for (var t = 0; t < buttonInfo.length; t++) {
        createTiddlyButton(this.footElem, buttonInfo[t].caption, buttonInfo[t].tooltip, buttonInfo[t].onClick);
        insertSpacer(this.footElem);
    }
    if (typeof status == "string") {
        createTiddlyElement(this.footElem, "span", null, "status", status);
    }
};

Wizard.prototype.addStep = function(stepTitle, html) {
    removeChildren(this.bodyElem);
    var w = createTiddlyElement(this.bodyElem, "div");
    createTiddlyElement(w, "h2", null, null, stepTitle);
    var step = createTiddlyElement(w, "div", null, "wizardStep");
    step.innerHTML = html;
    applyHtmlMacros(step, tiddler);
};

Wizard.prototype.getElement = function(name) {
    return this.formElem.elements[name];
};

//--
//-- ListView gadget
//--

var ListView = {};

// Create a listview
ListView.create = function(place, listObject, listTemplate, callback, className) {
    var table = createTiddlyElement(place, "table", null, className || "listView twtable");
    var thead = createTiddlyElement(table, "thead");
    var r = createTiddlyElement(thead, "tr");
    for (var t = 0; t < listTemplate.columns.length; t++) {
        var columnTemplate = listTemplate.columns[t];
        var c = createTiddlyElement(r, "th");
        var colType = ListView.columnTypes[columnTemplate.type];
        if (colType && colType.createHeader) {
            colType.createHeader(c, columnTemplate, t);
            if (columnTemplate.className)
                addClass(c, columnTemplate.className);
        }
    }
    var tbody = createTiddlyElement(table, "tbody");
    for (var rc = 0; rc < listObject.length; rc++) {
        var rowObject = listObject[rc];
        r = createTiddlyElement(tbody, "tr");
        for (c = 0; c < listTemplate.rowClasses.length; c++) {
            if (rowObject[listTemplate.rowClasses[c].field])
                addClass(r, listTemplate.rowClasses[c].className);
        }
        rowObject.rowElement = r;
        rowObject.colElements = {};
        for (var cc = 0; cc < listTemplate.columns.length; cc++) {
            c = createTiddlyElement(r, "td");
            columnTemplate = listTemplate.columns[cc];
            var field = columnTemplate.field;
            colType = ListView.columnTypes[columnTemplate.type];
            if (colType && colType.createItem) {
                colType.createItem(c, rowObject, field, columnTemplate, cc, rc);
                if (columnTemplate.className)
                    addClass(c, columnTemplate.className);
            }
            rowObject.colElements[field] = c;
        }
    }
    if (callback && listTemplate.actions)
        createTiddlyDropDown(place, ListView.getCommandHandler(callback), listTemplate.actions);
    if (callback && listTemplate.buttons) {
        for (t = 0; t < listTemplate.buttons.length; t++) {
            var a = listTemplate.buttons[t];
            if (a && a.name != "")
                createTiddlyButton(place, a.caption, null, ListView.getCommandHandler(callback, a.name, a.allowEmptySelection));
        }
    }
    return table;
};

ListView.getCommandHandler = function(callback, name, allowEmptySelection) {
    return function(e) {
        var view = findRelated(this, "TABLE", null, "previousSibling");
        var tiddlers = [];
        ListView.forEachSelector(view, function(e, rowName) {
            if (e.checked)
                tiddlers.push(rowName);
        });
        if (tiddlers.length == 0 && !allowEmptySelection) {
            alert(config.messages.nothingSelected);
        } else {
            if (this.nodeName.toLowerCase() == "select") {
                callback(view, this.value, tiddlers);
                this.selectedIndex = 0;
            } else {
                callback(view, name, tiddlers);
            }
        }
    };
};

// Invoke a callback for each selector checkbox in the listview
ListView.forEachSelector = function(view, callback) {
    var checkboxes = view.getElementsByTagName("input");
    var hadOne = false;
    for (var t = 0; t < checkboxes.length; t++) {
        var cb = checkboxes[t];
        if (cb.getAttribute("type") == "checkbox") {
            var rn = cb.getAttribute("rowName");
            if (rn) {
                callback(cb, rn);
                hadOne = true;
            }
        }
    }
    return hadOne;
};

ListView.getSelectedRows = function(view) {
    var rowNames = [];
    ListView.forEachSelector(view, function(e, rowName) {
        if (e.checked)
            rowNames.push(rowName);
    });
    return rowNames;
};

ListView.columnTypes = {};

ListView.columnTypes.String = {
    createHeader: function(place, columnTemplate, col) {
        createTiddlyText(place, columnTemplate.title);
    },
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined)
            createTiddlyText(place, v);
    }
};

ListView.columnTypes.WikiText = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined)
            wikify(v, place, null, null);
    }
};

ListView.columnTypes.Tiddler = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined && v.title)
            createTiddlyPopup(place, v.title, config.messages.listView.tiddlerTooltip, v);
    }
};

ListView.columnTypes.Size = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined) {
            var t = 0;
            while (t < config.messages.sizeTemplates.length - 1 && v < config.messages.sizeTemplates[t].unit)
                t++;
            createTiddlyText(place, config.messages.sizeTemplates[t].template.format([Math.round(v / config.messages.sizeTemplates[t].unit)]));
        }
    }
};

ListView.columnTypes.Link = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        var c = columnTemplate.text;
        if (v != undefined)
            createTiddlyText(createExternalLink(place, v), c || v);
    }
};

ListView.columnTypes.Date = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined)
            createTiddlyText(place, v.formatString(columnTemplate.dateFormat));
    }
};

ListView.columnTypes.StringList = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined) {
            for (var t = 0; t < v.length; t++) {
                createTiddlyText(place, v[t]);
                createTiddlyElement(place, "br");
            }
        }
    }
};

ListView.columnTypes.Selector = {
    createHeader: function(place, columnTemplate, col) {
        createTiddlyCheckbox(place, null, false, this.onHeaderChange);
    },
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var e = createTiddlyCheckbox(place, null, listObject[field], null);
        e.setAttribute("rowName", listObject[columnTemplate.rowName]);
    },
    onHeaderChange: function(e) {
        var state = this.checked;
        var view = findRelated(this, "TABLE");
        if (!view)
            return;
        ListView.forEachSelector(view, function(e, rowName) {
            e.checked = state;
        });
    }
};

ListView.columnTypes.Tags = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var tags = listObject[field];
        createTiddlyText(place, String.encodeTiddlyLinkList(tags));
    }
};

ListView.columnTypes.Boolean = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        if (listObject[field] == true)
            createTiddlyText(place, columnTemplate.trueText);
        if (listObject[field] == false)
            createTiddlyText(place, columnTemplate.falseText);
    }
};

ListView.columnTypes.TagCheckbox = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var e = createTiddlyCheckbox(place, null, listObject[field], this.onChange);
        e.setAttribute("tiddler", listObject.title);
        e.setAttribute("tag", columnTemplate.tag);
    },
    onChange: function(e) {
        var tag = this.getAttribute("tag");
        var tiddler = this.getAttribute("tiddler");
        store.setTiddlerTag(tiddler, this.checked, tag);
    }
};

ListView.columnTypes.TiddlerLink = {
    createHeader: ListView.columnTypes.String.createHeader,
    createItem: function(place, listObject, field, columnTemplate, col, row) {
        var v = listObject[field];
        if (v != undefined) {
            var link = createTiddlyLink(place, listObject[columnTemplate.tiddlerLink], false, null);
            createTiddlyText(link, listObject[field]);
        }
    }
};

//--
//-- Augmented methods for the JavaScript Number(), Array(), String() and Date() objects
//--

// Clamp a number to a range
Number.prototype.clamp = function(min, max) {
    var c = this;
    if (c < min)
        c = min;
    if (c > max)
        c = max;
    return c;
};

// Add indexOf function if browser does not support it
if (!Array.indexOf) {
    Array.prototype.indexOf = function(item, from) {
        if (!from)
            from = 0;
        for (var i = from; i < this.length; i++) {
            if (this[i] === item)
                return i;
        }
        return -1;
    };
}

// Find an entry in a given field of the members of an array
Array.prototype.findByField = function(field, value) {
    for (var t = 0; t < this.length; t++) {
        if (this[t][field] == value)
            return t;
    }
    return null;
};

// Return whether an entry exists in an array
Array.prototype.contains = function(item) {
    return this.indexOf(item) != -1;
};

// Adds, removes or toggles a particular value within an array
//  value - value to add
//  mode - +1 to add value, -1 to remove value, 0 to toggle it
Array.prototype.setItem = function(value, mode) {
    var p = this.indexOf(value);
    if (mode == 0)
        mode = (p == -1) ? +1 : -1;
    if (mode == +1) {
        if (p == -1)
            this.push(value);
    } else if (mode == -1) {
        if (p != -1)
            this.splice(p, 1);
    }
};

// Return whether one of a list of values exists in an array
Array.prototype.containsAny = function(items) {
    for (var i = 0; i < items.length; i++) {
        if (this.indexOf(items[i]) != -1)
            return true;
    }
    return false;
};

// Return whether all of a list of values exists in an array
Array.prototype.containsAll = function(items) {
    for (var i = 0; i < items.length; i++) {
        if (this.indexOf(items[i]) == -1)
            return false;
    }
    return true;
};

// Push a new value into an array only if it is not already present in the array. If the optional unique parameter is false, it reverts to a normal push
Array.prototype.pushUnique = function(item, unique) {
    if (unique === false) {
        this.push(item);
    } else {
        if (this.indexOf(item) == -1)
            this.push(item);
    }
};

Array.prototype.remove = function(item) {
    var p = this.indexOf(item);
    if (p != -1)
        this.splice(p, 1);
};

if (!Array.prototype.map) {
    Array.prototype.map = function(fn, thisObj) {
        var scope = thisObj || window;
        var a = [];
        for (var i = 0, j = this.length; i < j; ++i) {
            a.push(fn.call(scope, this[i], i, this));
        }
        return a;
    };
}

// Get characters from the right end of a string
String.prototype.right = function(n) {
    return n < this.length ? this.slice(this.length - n) : this;
};

// Trim whitespace from both ends of a string
String.prototype.trim = function() {
    return this.replace(/^\s*|\s*$/g, "");
};

// Convert a string from a CSS style property name to a JavaScript style name ("background-color" -> "backgroundColor")
String.prototype.unDash = function() {
    var s = this.split("-");
    if (s.length > 1) {
        for (var t = 1; t < s.length; t++)
            s[t] = s[t].substr(0, 1).toUpperCase() + s[t].substr(1);
    }
    return s.join("");
};

// Substitute substrings from an array into a format string that includes '%1'-type specifiers
String.prototype.format = function(substrings) {
    var subRegExp = /(?:%(\d+))/mg;
    var currPos = 0;
    var r = [];
    do {
        var match = subRegExp.exec(this);
        if (match && match[1]) {
            if (match.index > currPos)
                r.push(this.substring(currPos, match.index));
            r.push(substrings[parseInt(match[1])]);
            currPos = subRegExp.lastIndex;
        }
    } while (match);
    if (currPos < this.length)
        r.push(this.substring(currPos, this.length));
    return r.join("");
};

// Escape any special RegExp characters with that character preceded by a backslash
String.prototype.escapeRegExp = function() {
    var s = "\\^$*+?()=!|,{}[].";
    var c = this;
    for (var t = 0; t < s.length; t++)
        c = c.replace(new RegExp("\\" + s.substr(t, 1), "g"), "\\" + s.substr(t, 1));
    return c;
};

// Convert "\" to "\s", newlines to "\n" (and remove carriage returns)
String.prototype.escapeLineBreaks = function() {
    return this.replace(/\\/mg, "\\s").replace(/\n/mg, "\\n").replace(/\r/mg, "");
};

// Convert "\n" to newlines, "\b" to " ", "\s" to "\" (and remove carriage returns)
String.prototype.unescapeLineBreaks = function() {
    return this.replace(/\\n/mg, "\n").replace(/\\b/mg, " ").replace(/\\s/mg, "\\").replace(/\r/mg, "");
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
String.prototype.htmlEncode = function() {
    return this.replace(/&/mg, "&amp;").replace(/</mg, "&lt;").replace(/>/mg, "&gt;").replace(/\"/mg, "&quot;");
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
String.prototype.htmlDecode = function() {
    return this.replace(/&lt;/mg, "<").replace(/&gt;/mg, ">").replace(/&quot;/mg, "\"").replace(/&amp;/mg, "&");
};

// Convert a string to it's JSON representation by encoding control characters, double quotes and backslash. See json.org
String.prototype.toJSONString = function() {
    var m = {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '"': '\\"',
        '\\': '\\\\'
    };
    var replaceFn = function(a, b) {
        var c = m[b];
        if (c)
            return c;
        c = b.charCodeAt();
        return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
    };
    if (/["\\\x00-\x1f]/.test(this))
        return '"' + this.replace(/([\x00-\x1f\\"])/g, replaceFn) + '"';
    return '"' + this + '"';
};

// Parse a space-separated string of name:value parameters
// The result is an array of objects:
//   result[0] = object with a member for each parameter name, value of that member being an array of values
//   result[1..n] = one object for each parameter, with 'name' and 'value' members
String.prototype.parseParams = function(defaultName, defaultValue, allowEval, noNames, cascadeDefaults) {
    var parseToken = function(match, p) {
        var n;
        if (match[p]) // Double quoted
            n = match[p];
        else if (match[p + 1]) // Single quoted
            n = match[p + 1];
        else if (match[p + 2]) // Double-square-bracket quoted
            n = match[p + 2];
        else if (match[p + 3]) // Double-brace quoted
            try {
            n = match[p + 3];
            if (allowEval)
                n = window.eval(n);
        } catch (ex) {
            throw "Unable to evaluate {{" + match[p + 3] + "}}: " + exceptionText(ex);
        }
        else if (match[p + 4]) // Unquoted
            n = match[p + 4];
        else if (match[p + 5]) // empty quote
            n = "";
        return n;
    };
    var r = [{}];
    var dblQuote = "(?:\"((?:(?:\\\\\")|[^\"])+)\")";
    var sngQuote = "(?:'((?:(?:\\\\\')|[^'])+)')";
    var dblSquare = "(?:\\[\\[((?:\\s|\\S)*?)\\]\\])";
    var dblBrace = "(?:\\{\\{((?:\\s|\\S)*?)\\}\\})";
    var unQuoted = noNames ? "([^\"'\\s]\\S*)" : "([^\"':\\s][^\\s:]*)";
    var emptyQuote = "((?:\"\")|(?:''))";
    var skipSpace = "(?:\\s*)";
    var token = "(?:" + dblQuote + "|" + sngQuote + "|" + dblSquare + "|" + dblBrace + "|" + unQuoted + "|" + emptyQuote + ")";
    var re = noNames ? new RegExp(token, "mg") : new RegExp(skipSpace + token + skipSpace + "(?:(\\:)" + skipSpace + token + ")?", "mg");
    var params = [];
    do {
        var match = re.exec(this);
        if (match) {
            var n = parseToken(match, 1);
            if (noNames) {
                r.push({ name: "", value: n });
            } else {
                var v = parseToken(match, 8);
                if (v == null && defaultName) {
                    v = n;
                    n = defaultName;
                } else if (v == null && defaultValue) {
                    v = defaultValue;
                }
                r.push({ name: n, value: v });
                if (cascadeDefaults) {
                    defaultName = n;
                    defaultValue = v;
                }
            }
        }
    } while (match);
    // Summarise parameters into first element
    for (var t = 1; t < r.length; t++) {
        if (r[0][r[t].name])
            r[0][r[t].name].push(r[t].value);
        else
            r[0][r[t].name] = [r[t].value];
    }
    return r;
};

// Process a string list of macro parameters into an array. Parameters can be quoted with "", '',
// [[]], {{ }} or left unquoted (and therefore space-separated). Double-braces {{}} results in
// an *evaluated* parameter: e.g. {{config.options.txtUserName}} results in the current user's name.
String.prototype.readMacroParams = function() {
    var p = this.parseParams("list", null, true, true);
    var n = [];
    for (var t = 1; t < p.length; t++)
        n.push(p[t].value);
    return n;
};

// Process a string list of unique tiddler names into an array. Tiddler names that have spaces in them must be [[bracketed]]
String.prototype.readBracketedList = function(unique) {
    var p = this.parseParams("list", null, false, true);
    var n = [];
    for (var t = 1; t < p.length; t++) {
        if (p[t].value)
            n.pushUnique(p[t].value, unique);
    }
    return n;
};

// Returns array with start and end index of chunk between given start and end marker, or undefined.
String.prototype.getChunkRange = function(start, end) {
    var s = this.indexOf(start);
    if (s != -1) {
        s += start.length;
        var e = this.indexOf(end, s);
        if (e != -1)
            return [s, e];
    }
};

// Replace a chunk of a string given start and end markers
String.prototype.replaceChunk = function(start, end, sub) {
    var r = this.getChunkRange(start, end);
    return r ? this.substring(0, r[0]) + sub + this.substring(r[1]) : this;
};

// Returns a chunk of a string between start and end markers, or undefined
String.prototype.getChunk = function(start, end) {
    var r = this.getChunkRange(start, end);
    if (r)
        return this.substring(r[0], r[1]);
};


// Static method to bracket a string with double square brackets if it contains a space
String.encodeTiddlyLink = function(title) {
    return title.indexOf(" ") == -1 ? title : "[[" + title + "]]";
};

// Static method to encodeTiddlyLink for every item in an array and join them with spaces
String.encodeTiddlyLinkList = function(list) {
    if (list) {
        var results = [];
        for (var t = 0; t < list.length; t++)
            results.push(String.encodeTiddlyLink(list[t]));
        return results.join(" ");
    } else {
        return "";
    }
};

// Convert a string as a sequence of name:"value" pairs into a hashmap
String.prototype.decodeHashMap = function() {
    var fields = this.parseParams("anon", "", false);
    var r = {};
    for (var t = 1; t < fields.length; t++)
        r[fields[t].name] = fields[t].value;
    return r;
};

// Static method to encode a hashmap into a name:"value"... string
String.encodeHashMap = function(hashmap) {
    var r = [];
    for (var t in hashmap)
        r.push(t + ':"' + hashmap[t] + '"');
    return r.join(" ");
};

// Static method to left-pad a string with 0s to a certain width
String.zeroPad = function(n, d) {
    var s = n.toString();
    if (s.length < d)
        s = "000000000000000000000000000".substr(0, d - s.length) + s;
    return s;
};

String.prototype.startsWith = function(prefix) {
    return !prefix || this.substring(0, prefix.length) == prefix;
};

String.prototype.endsWith = function(as) {
	return this.length >= as.length && this.substr(0-as.length) == as;
};

// Returns the first value of the given named parameter.
function getParam(params, name, defaultValue) {
    if (!params)
        return defaultValue;
    var p = params[0][name];
    return p ? p[0] : defaultValue;
}

// Returns the first value of the given boolean named parameter.
function getFlag(params, name, defaultValue) {
    return !!getParam(params, name, defaultValue);
}

// Substitute date components into a string
Date.prototype.formatString = function(template) {
	if (!this.getTime()) // Probably not meaningful value
		return ""; 
    var t = template.replace(/0hh12/g, String.zeroPad(this.getHours12(), 2));
    t = t.replace(/hh12/g, this.getHours12());
    t = t.replace(/0hh/g, String.zeroPad(this.getHours(), 2));
    t = t.replace(/hh/g, this.getHours());
    t = t.replace(/mmm/g, config.messages.dates.shortMonths[this.getMonth()]);
    t = t.replace(/0mm/g, String.zeroPad(this.getMinutes(), 2));
    t = t.replace(/mm/g, this.getMinutes());
    t = t.replace(/0ss/g, String.zeroPad(this.getSeconds(), 2));
    t = t.replace(/ss/g, this.getSeconds());
    t = t.replace(/[ap]m/g, this.getAmPm().toLowerCase());
    t = t.replace(/[AP]M/g, this.getAmPm().toUpperCase());
    t = t.replace(/wYYYY/g, this.getYearForWeekNo());
    t = t.replace(/wYY/g, String.zeroPad(this.getYearForWeekNo() - 2000, 2));
    t = t.replace(/YYYY/g, this.getFullYear());
    t = t.replace(/YY/g, String.zeroPad(this.getFullYear() - 2000, 2));
    t = t.replace(/MMM/g, config.messages.dates.months[this.getMonth()]);
    t = t.replace(/0MM/g, String.zeroPad(this.getMonth() + 1, 2));
    t = t.replace(/MM/g, this.getMonth() + 1);
    t = t.replace(/0WW/g, String.zeroPad(this.getWeek(), 2));
    t = t.replace(/WW/g, this.getWeek());
    t = t.replace(/DDD/g, config.messages.dates.days[this.getDay()]);
    t = t.replace(/ddd/g, config.messages.dates.shortDays[this.getDay()]);
    t = t.replace(/0DD/g, String.zeroPad(this.getDate(), 2));
    t = t.replace(/DDth/g, this.getDate() + this.daySuffix());
    t = t.replace(/DD/g, this.getDate());
    var tz = this.getTimezoneOffset();
    var atz = Math.abs(tz);
    t = t.replace(/TZD/g, (tz < 0 ? '+' : '-') + String.zeroPad(Math.floor(atz / 60), 2) + ':' + String.zeroPad(atz % 60, 2));
    t = t.replace(/\\/g, "");
    return t;
};

Date.prototype.getWeek = function() {
    var dt = new Date(this.getTime());
    var d = dt.getDay();
    if (d == 0) d = 7; // JavaScript Sun=0, ISO Sun=7
    dt.setTime(dt.getTime() + (4 - d) * 86400000); // shift day to Thurs of same week to calculate weekNo
    var n = Math.floor((dt.getTime() - new Date(dt.getFullYear(), 0, 1) + 3600000) / 86400000);
    return Math.floor(n / 7) + 1;
};

Date.prototype.getYearForWeekNo = function() {
    var dt = new Date(this.getTime());
    var d = dt.getDay();
    if (d == 0) d = 7; // JavaScript Sun=0, ISO Sun=7
    dt.setTime(dt.getTime() + (4 - d) * 86400000); // shift day to Thurs of same week
    return dt.getFullYear();
};

Date.prototype.getHours12 = function() {
    var h = this.getHours();
    return h > 12 ? h - 12 : (h > 0 ? h : 12);
};

Date.prototype.getAmPm = function() {
    return this.getHours() >= 12 ? config.messages.dates.pm : config.messages.dates.am;
};

Date.prototype.daySuffix = function() {
    return config.messages.dates.daySuffixes[this.getDate() - 1];
};

// Convert a date to local YYYYMMDDHHMM string format
Date.prototype.convertToLocalYYYYMMDDHHMM = function() {
    return this.getFullYear() + String.zeroPad(this.getMonth() + 1, 2) + String.zeroPad(this.getDate(), 2) + String.zeroPad(this.getHours(), 2) + String.zeroPad(this.getMinutes(), 2);
};

// Convert a date to UTC YYYYMMDDHHMM string format
Date.prototype.convertToYYYYMMDDHHMM = function() {
    return this.getUTCFullYear() + String.zeroPad(this.getUTCMonth() + 1, 2) + String.zeroPad(this.getUTCDate(), 2) + String.zeroPad(this.getUTCHours(), 2) + String.zeroPad(this.getUTCMinutes(), 2);
};

// Convert a date to UTC YYYYMMDD.HHMMSSMMM string format
Date.prototype.convertToYYYYMMDDHHMMSSMMM = function() {
    return this.getUTCFullYear() + String.zeroPad(this.getUTCMonth() + 1, 2) + String.zeroPad(this.getUTCDate(), 2) + "." + String.zeroPad(this.getUTCHours(), 2) + String.zeroPad(this.getUTCMinutes(), 2) + String.zeroPad(this.getUTCSeconds(), 2) + String.zeroPad(this.getUTCMilliseconds(), 4);
};

// Static method to create a date from a UTC YYYYMMDDHHMM format string
Date.convertFromYYYYMMDDHHMM = function(d) {
    var hh = d.substr(8, 2) || "00";
    var mm = d.substr(10, 2) || "00";
    return new Date(Date.UTC(parseInt(d.substr(0, 4), 10),
        parseInt(d.substr(4, 2), 10) - 1,
        parseInt(d.substr(6, 2), 10),
        parseInt(hh, 10),
        parseInt(mm, 10), 0, 0));
};

//--
//-- RGB colour object
//--

// Construct an RGB colour object from a '#rrggbb', '#rgb' or 'rgb(n,n,n)' string or from separate r,g,b values
function RGB(r, g, b) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    if (typeof r == "string") {
        if (r.substr(0, 1) == "#") {
            if (r.length == 7) {
                this.r = parseInt(r.substr(1, 2), 16) / 255;
                this.g = parseInt(r.substr(3, 2), 16) / 255;
                this.b = parseInt(r.substr(5, 2), 16) / 255;
            } else {
                this.r = parseInt(r.substr(1, 1), 16) / 15;
                this.g = parseInt(r.substr(2, 1), 16) / 15;
                this.b = parseInt(r.substr(3, 1), 16) / 15;
            }
        } else {
            var rgbPattern = /rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/;
            var c = r.match(rgbPattern);
            if (c) {
                this.r = parseInt(c[1], 10) / 255;
                this.g = parseInt(c[2], 10) / 255;
                this.b = parseInt(c[3], 10) / 255;
            }
        }
    } else {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    return this;
}

// Mixes this colour with another in a specified proportion
// c = other colour to mix
// f = 0..1 where 0 is this colour and 1 is the new colour
// Returns an RGB object
RGB.prototype.mix = function(c, f) {
    return new RGB(this.r + (c.r - this.r) * f, this.g + (c.g - this.g) * f, this.b + (c.b - this.b) * f);
};

// Return an rgb colour as a #rrggbb format hex string
RGB.prototype.toString = function() {
    return "#" + ("0" + Math.floor(this.r.clamp(0, 1) * 255).toString(16)).right(2) +
             ("0" + Math.floor(this.g.clamp(0, 1) * 255).toString(16)).right(2) +
             ("0" + Math.floor(this.b.clamp(0, 1) * 255).toString(16)).right(2);
};

//--
//-- DOM utilities - many derived from www.quirksmode.org
//--

function drawGradient(place, horiz, locolors, hicolors) {
    if (!hicolors)
        hicolors = locolors;
    for (var t = 0; t <= 100; t += 2) {
        var bar = document.createElement("div");
        place.appendChild(bar);
        bar.style.position = "absolute";
        bar.style.left = horiz ? t + "%" : 0;
        bar.style.top = horiz ? 0 : t + "%";
        bar.style.width = horiz ? (101 - t) + "%" : "100%";
        bar.style.height = horiz ? "100%" : (101 - t) + "%";
        bar.style.zIndex = -1;
        var p = t / 100 * (locolors.length - 1);
        bar.style.backgroundColor = hicolors[Math.floor(p)].mix(locolors[Math.ceil(p)], p - Math.floor(p)).toString();
    }
}

function createTiddlyText(parent, text) {
    return parent.appendChild(document.createTextNode(text));
}

function createTiddlyCheckbox(parent, caption, checked, onChange) {
    var cb = document.createElement("input");
    cb.setAttribute("type", "checkbox");
    cb.onclick = onChange;
    parent.appendChild(cb);
    cb.checked = checked;
    cb.className = "chkOptionInput";
    if (caption)
        wikify(caption, parent);
    return cb;
}

function createTiddlyElement(parent, element, id, className, text, attribs) {
    var e = document.createElement(element);
    if (className != null)
        e.className = className;
    if (id != null)
        e.setAttribute("id", id);
    if (text != null)
        e.appendChild(document.createTextNode(text));
    if (attribs) {
        for (var n in attribs) {
            e.setAttribute(n, attribs[n]);
        }
    }
    if (parent != null)
        parent.appendChild(e);
    return e;
}

function addEvent(obj, type, fn) {
    if (obj.attachEvent) {
        obj['e' + type + fn] = fn;
        obj[type + fn] = function() { obj['e' + type + fn](window.event); };
        obj.attachEvent('on' + type, obj[type + fn]);
    } else {
        obj.addEventListener(type, fn, false);
    }
}

function removeEvent(obj, type, fn) {
    if (obj.detachEvent) {
        obj.detachEvent('on' + type, obj[type + fn]);
        obj[type + fn] = null;
    } else {
        obj.removeEventListener(type, fn, false);
    }
}

function addClass(e, className) {
    var currClass = e.className.split(" ");
    if (currClass.indexOf(className) == -1)
        e.className += " " + className;
}

function removeClass(e, className) {
    var currClass = e.className.split(" ");
    var i = currClass.indexOf(className);
    while (i != -1) {
        currClass.splice(i, 1);
        i = currClass.indexOf(className);
    }
    e.className = currClass.join(" ");
}

function hasClass(e, className) {
    if (e.className && e.className.split(" ").indexOf(className) != -1) {
        return true;
    }
    return false;
}

// Find the closest relative with a given property value (property defaults to tagName, relative defaults to parentNode)
function findRelated(e, value, name, relative) {
    name = name || "tagName";
    relative = relative || "parentNode";
    if (name == "className") {
        while (e && !hasClass(e, value)) {
            e = e[relative];
        }
    } else {
        while (e && e[name] != value) {
            e = e[relative];
        }
    }
    return e;
}

// Resolve the target object of an event
function resolveTarget(e) {
    var obj;
    if (e.target)
        obj = e.target;
    else if (e.srcElement)
        obj = e.srcElement;
    if (obj.nodeType == 3) // defeat Safari bug
        obj = obj.parentNode;
    return obj;
}

// Prevent an event from bubbling
function stopEvent(e) {
    var ev = e || window.event;
    ev.cancelBubble = true;
    if (ev.stopPropagation) ev.stopPropagation();
    return false;
}

// Return the content of an element as plain text with no formatting
function getPlainText(e) {
    var text = "";
    if (e.innerText)
        text = e.innerText;
    else if (e.textContent)
        text = e.textContent;
    return text;
}

// Get the scroll position for window.scrollTo necessary to scroll a given element into view
function ensureVisible(e) {
    var posTop = findPosY(e);
    var posBot = posTop + e.offsetHeight;
    var winTop = findScrollY();
    var winHeight = findWindowHeight();
    var winBot = winTop + winHeight;
    if (posTop < winTop) {
        return posTop;
    } else if (posBot > winBot) {
        if (e.offsetHeight < winHeight)
            return posTop - (winHeight - e.offsetHeight);
        else
            return posTop;
    } else {
        return winTop;
    }
}

// Get the current width of the display window
function findWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth;
}

// Get the current height of the display window
function findWindowHeight() {
    return window.innerHeight || document.documentElement.clientHeight;
}

// Get the current horizontal page scroll position
function findScrollX() {
    return window.scrollX || document.documentElement.scrollLeft;
}

// Get the current vertical page scroll position
function findScrollY() {
    return window.scrollY || document.documentElement.scrollTop;
}

function findPosX(obj) {
    var curleft = 0;
    while (obj.offsetParent) {
        curleft += obj.offsetLeft;
        obj = obj.offsetParent;
    }
    return curleft;
}

function findPosY(obj) {
    var curtop = 0;
    while (obj.offsetParent) {
        curtop += obj.offsetTop;
        obj = obj.offsetParent;
    }
    return curtop;
}

// Blur a particular element
function blurElement(e) {
    if (e && e.focus && e.blur) {
        e.focus();
        e.blur();
    }
}

// Create a non-breaking space
function insertSpacer(place) {
    var e = document.createTextNode(String.fromCharCode(160));
    if (place)
        place.appendChild(e);
    return e;
}

// Remove all children of a node
function removeChildren(e) {
    while (e && e.hasChildNodes())
        removeNode(e.firstChild);
}

// Remove a node and all it's children
function removeNode(e) {
    scrubNode(e);
    e.parentNode.removeChild(e);
}

function removeTiddlerNode(e) {
    scrubNode(e);
    e.parentNode.removeChild(e);
    if (config.options.chkAutoSyncAddress)
	    story.permaView();
}

// Remove any event handlers or non-primitve custom attributes
function scrubNode(e) {
    if (!config.browser.isIE)
        return;
    var att = e.attributes;
    if (att) {
        for (var t = 0; t < att.length; t++) {
            var n = att[t].name;
            if (n !== 'style' && (typeof e[n] === 'function' || (typeof e[n] === 'object' && e[n] != null))) {
                try {
                    e[n] = null;
                } catch (ex) {
                }
            }
        }
    }
    var c = e.firstChild;
    while (c) {
        scrubNode(c);
        c = c.nextSibling;
    }
}

// Add a stylesheet, replacing any previous custom stylesheet
function setStylesheet(s, id, doc) {
    if (!id)
        id = "customStyleSheet";
    if (!doc)
        doc = document;
    var n = doc.getElementById(id);
    if (doc.createStyleSheet) {
        // Test for IE's non-standard createStyleSheet method
        if (n)
            n.parentNode.removeChild(n);
        // This failed without the &nbsp;
        doc.getElementsByTagName("head")[0].insertAdjacentHTML("beforeEnd", "&nbsp;<style id='" + id + "'>" + s + "</style>");
    } else {
        if (n) {
            n.replaceChild(doc.createTextNode(s), n.firstChild);
        } else {
            n = doc.createElement("style");
            n.type = "text/css";
            n.id = id;
            n.appendChild(doc.createTextNode(s));
            doc.getElementsByTagName("head")[0].appendChild(n);
        }
    }
}

function removeStyleSheet(id) {
    var e = document.getElementById(id);
    if (e)
        e.parentNode.removeChild(e);
}

// Force the browser to do a document reflow when needed to workaround browser bugs
function forceReflow() {
    if (config.browser.isGecko) {
        setStylesheet("body {top:0px;margin-top:0px;}", "forceReflow");
        setTimeout(function() { setStylesheet("", "forceReflow"); }, 1);
    }
}

// Replace the current selection of a textarea or text input and scroll it into view
function replaceSelection(e, text) {
    if (e.setSelectionRange) {
        var oldpos = e.selectionStart;
        var isRange = e.selectionEnd > e.selectionStart;
        e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd);
        e.setSelectionRange(isRange ? oldpos : oldpos + text.length, oldpos + text.length);
        var linecount = e.value.split('\n').length;
        var thisline = e.value.substr(0, e.selectionStart).split('\n').length - 1;
        e.scrollTop = Math.floor((thisline - e.rows / 2) * e.scrollHeight / linecount);
    } else if (document.selection) {
        var range = document.selection.createRange();
        if (range.parentElement() == e) {
            var isCollapsed = range.text == "";
            range.text = text;
            if (!isCollapsed) {
                range.moveStart('character', -text.length);
                range.select();
            }
        }
    }
}

// Returns the text of the given (text) node, possibly merging subsequent text nodes
function getNodeText(e) {
    var t = "";
    while (e && e.nodeName == "#text") {
        t += e.nodeValue;
        e = e.nextSibling;
    }
    return t;
}

// Returns true if the element e has a given ancestor element
function isDescendant(e, ancestor) {
    while (e) {
        if (e === ancestor)
            return true;
        e = e.parentNode;
    }
    return false;
}

//--
//-- LoaderBase and SaverBase
//--

function LoaderBase() { }

LoaderBase.prototype.loadTiddler = function(store, node, tiddlers, fn) {
    var title = this.getTitle(store, node);
//    if (safeMode && store.isShadowTiddler(title))
//        return;
    if (title) {
        var tiddler = store.createTiddler(title);
        if (tiddler.hasShadow)
            tiddler.stashVersion();
        this.internalizeTiddler(tiddler, title, node);
        if (fn) fn(tiddler);
        tiddlers.push(tiddler);
    }
};

LoaderBase.prototype.loadTiddlers = function(store, nodes, fn) {
    var tiddlers = [];
    for (var t = 0; t < nodes.length; t++) {
        try {
            this.loadTiddler(store, nodes[t], tiddlers, fn);
        } catch (ex) {
            showException(ex, config.messages.tiddlerLoadError.format([this.getTitle(store, nodes[t])]));
        }
    }
    return tiddlers;
};

//--
//-- TW21Loader (inherits from LoaderBase)
//--

function TW21Loader() { }

TW21Loader.prototype = new LoaderBase();

TW21Loader.prototype.getTitle = function(store, node) {
    var title = null;
    if (node.getAttribute) {
        title = node.getAttribute("title");
        if (!title)
            title = node.getAttribute("tiddler");
    }
    if (!title && node.id) {
        var lenPrefix = store.idPrefix.length;
        if (node.id.substr(0, lenPrefix) == store.idPrefix)
            title = node.id.substr(lenPrefix);
    }
    return title;
};

regexpOpenDblSqb = new RegExp(/\[\[/mg);
regexpCloseDblSqb = new RegExp(/\]\]/mg);

TW21Loader.prototype.internalizeTiddler = function(tiddler, title, node) {
    var e = node.firstChild;
    var text = null;
    if (node.getAttribute("tiddler")) {
        text = getNodeText(e).unescapeLineBreaks();
    } else {
        while (e && e.nodeName != "PRE" && e.nodeName != "pre") {
            if (!tiddler.ace)
                tiddler.ace = [];
            tiddler.ace.push(e);
            e = e.nextSibling;
        }
        if (e)
            text = e.innerHTML.replace(/\r/mg, "").htmlDecode();
    }
    var modifier = node.getAttribute("modifier");
    var c = node.getAttribute("created");
    var m = node.getAttribute("modified");
    var v = node.getAttribute("version") != null ? parseInt(node.getAttribute("version")) : 0;
	if (!c)
		c = m;
    var created = c ? Date.convertFromYYYYMMDDHHMM(c) : null;
    var modified = m ? Date.convertFromYYYYMMDDHHMM(m) : created;
    var tags = node.getAttribute("tags");

    tiddler.comments = parseInt(node.getAttribute("comments"));
    tiddler.notes = node.getAttribute("notes");
    tiddler.messages = node.getAttribute("messages");
    
    try { tiddler.id = node.getAttribute("id"); } catch (e) { this.id = ""; }
    try { tiddler.includedFrom = node.getAttribute("includedFrom"); } catch (e) { }
    try { tiddler.templates[DEFAULT_VIEW_TEMPLATE] = node.getAttribute("viewTemplate"); } catch (e) { }
    try { tiddler.templates[DEFAULT_EDIT_TEMPLATE] = node.getAttribute("editTemplate"); } catch (e) { }
    try { tiddler.templates[SPECIAL_EDIT_TEMPLATE] = node.getAttribute("editTemplateSpecial"); } catch (e) { }

    var fields = {};
    var attrs = node.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) if (attrs[i].specified) {
		var name = attrs[i].name;
		var value = attrs[i].value;
		switch(name)
		{
		case 'locked':
			tiddler.readOnly = eval(value);
			break;
		case 'from':
		case 'vercnt':
			tiddler[name] = value;
		case 'currentver':
			break;
		default:
			if (!TiddlyWiki.isStandardField(name))
				fields[name] = attrs[i].value.unescapeLineBreaks();
		}
	}
    tiddler.assign(title, text, modifier, modified, tags, created, fields, v, node.id);
    return tiddler;
};

function convertUnicodeToHtmlEntities(s) {
    var re = /[^\u0000-\u007F]/g;
    return s.replace(re, function($0) { return "&#" + $0.charCodeAt(0).toString() + ";"; });
}

function Debugger(m,r) { 
	if (window.confirm((typeof(m) == "string" ? m : "") + "- Invoke debugger?"))
		debugger; 
	return r || m;
}

function RetryInDebugger(e,m) { 
	if (window.confirm(m + '\n' + e + "\n- retry in Debugger?")) { 
		debugger; 
		return true; 
	} 
	else 
		return false; 
}

function ListMyNotes(ar) {
	var nca = document.getElementById('myNotesArea');
	if (ar.success && nca) {
		listViewTemplate = {
			columns: [
				{ name: 'Created', field: 'created', title: "Created", type: 'Date', dateFormat: 'YYYY-0MM-0DD' },
				{ name: 'Page', field: 'page', title: "page", type: 'String' },
				{ name: 'Tiddler', field: 'tiddler', title: "Tiddler", type: 'String' },
				{ name: 'Text', field: 'text', title: "Text", type: 'String' }
				],
			rowClasses: [
				],
			buttons: [
				]
		};
		var listview = ListView.create(nca,ar,listViewTemplate);
	}
}

function ConfirmIfMessage(status)
{
	if (!status.success)
		return false;
	else if (status.Message)
		return window.confirm(status.Message);
	else
		return true;
}

function JsoFromXml(rce) {
	if (rce == null)
		return null;
	var v =  rce.childNodes.length ? rce.firstChild.nodeValue : '';
	var type = rce.attributes.getNamedItem('type');
	if (type != null && type.value != null)
		switch (type.value) {
		case 'int':
			v = parseInt(v);
			break;
		case 'bool':
			v = window.eval(v);
			break;
		case 'datetime':
			try {
				if (v.indexOf('-') == -1)
					v = Date.convertFromYYYYMMDDHHMM(v);
				else {
					var adp = v.split('-');
					v = new Date(parseInt(adp[0],10),parseInt(adp[1],10)-1,parseInt(adp[2].substr(0,2),10),0,0)
				}
			}
			catch (e) {
				alert("bad datetime: " + v);
			}
			break;
		case '[]':
			v = [];
			break;
		case 'string[]':
			v = [];
			for (var ae = 0; ae < rce.childNodes.length; ae++) {
				var ace = rce.childNodes[ae];
				v[ae] = ace.firstChild ? ace.firstChild.nodeValue : "";
			}
			break;
		case 'object':
			v = {};
			for (var ae = 0; ae < rce.childNodes.length; ae++)
				v[rce.childNodes[ae].nodeName] = JsoFromXml(rce.childNodes[ae]);
			break;
		case 'object[]':
			v = [];
			for (var ae = 0; ae < rce.childNodes.length; ae++)
				v[ae] = JsoFromXml(rce.childNodes[ae]);
			break;
		}
	else if (rce.childNodes.length && rce.firstChild.nodeType == 1) {
		v = {};
		for (var i = 0; i < rce.childNodes.length; i++) {
			var ace = rce.childNodes[i];
			v[ace.nodeName] = JsoFromXml(ace);
		}
	}

	return v;
}

function HttpReply(req) {
    if (typeof(req) != "object")
        return req;
    if (req.responseXML && req.responseXML.documentElement)
		return JsoFromXml(req.responseXML.documentElement);
	else
		return req.responseText;
}

function HttpGet(args, method) {
	var fields = [];
	if (method)
		fields.push("method=" + method);
	if (typeof args == 'string') {
		if (args.startsWith('?'))
			args = args.substring(1);
		var rs = HttpRequest(args + '&method=' + method);
	}
	else {
		for (var a in args) {
			var v = args[a];
			if (!(v == undefined || typeof(v) == "function"))
			{
				if (typeof(v) == "object") {
					for (var avn in v) {
						if (!isNaN(parseInt(avn)))
							fields.push(a + "=" + encodeURIComponent(v[avn]));
					}
				}
				else
					fields.push(a + "=" + encodeURIComponent(v));
			}
		}
		var rs = HttpRequest(fields.join("&"));
	}
	while (true) {
		try {
			var rp = HttpReply(rs);
			if (rp) {
				if (rp.Message)
					displayMessage(rp.Message);
				else if (rp.success === undefined)
					rp.success = true;
			}
			return rp || rs;
		}
		catch (e)
		{
			if (!RetryInDebugger(e,"HttpReply error"))
				return;
		}
	}
}

function HttpRequest(args,debug) {
	var url = window.location.pathname;

	var req;
	try { req = new XMLHttpRequest(); }
	catch (e) {
		try { req = new ActiveXObject("Msxml2.XMLHTTP") }
		catch (e) {
			try { req = new ActiveXObject("Microsoft.XMLHTTP") }
			catch (e) { return }
		}
	}

	req.open("POST", url, false);
	req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");

	req.send(args);
	if (req.status >= 400)
		return displayMessage("HttpRequest(" + url + ") failed: " + req.status + "<br>" + req.responseText);
	if (!(debug === undefined)) {
		if (typeof(debug) == "function")
			debug(req);
		else if (debug)
			alert(req.responseText);
	}
	return req;
}

config.macros.page = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var a = params[0];
		if (a && !(config.pageAttributes[a] === undefined))
			createTiddlyText(place,config.pageAttributes[a]);
	}
}

config.macros.history = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		if (tiddler instanceof Tiddler) {
			var hist = eval(tiddler.vercnt);
			if (hist === undefined || hist == 0) {
				var inclFrom = tiddler["includedFrom"];
				if (inclFrom)
					wikify("included from [[" + inclFrom + "|" + encodeURIComponent(inclFrom) + window.location.fileType + "#" + encodeURIComponent(String.encodeTiddlyLink(tiddler.title)) + "]]", place);
			}
			else {
				var rv = tiddler.fields['reverted']
				var desc = rv ? " other " : " prior ";
				hist = hist - 1;
				if (store.isShadowTiddler(tiddler.title))
					hist++;
				if (!hist || (readOnly == true && config.viewPrior == false))
					return;
				createTiddlyText(place, " (");
				if (rv) {
					var rby = tiddler.fields['reverted_by'];
					rby = rby ? " by " + rby : "";
					createTiddlyText(place,"reverted to version " + tiddler.currentVer + " on " + Date.convertFromYYYYMMDDHHMM(rv).formatString(config.macros.timeline.dateFormat) + rby + ", ");
				}
				var snVersions = hist + desc + (hist != "1" ? "versions" : "version");
				var btn = createTiddlyButton(place, snVersions, "Get prior versions", onClickTiddlerHistory, "tiddlyLink");
				btn.setAttribute("refresh", "link");
				btn.setAttribute("tiddlyLink", snVersions);
				btn.setAttribute("tiddler", tiddler.title);
				createTiddlyText(place, ")");
			}
		}
	}
}

function onClickTiddlerHistory(e) {
	if (!e) var e = window.event;
	var theTarget = resolveTarget(e);
	var t = theTarget.getAttribute("tiddler");
	var tiddler = store.fetchTiddler(t);
	if (!t) return;
	var res = http.tiddlerHistory({ tiddlerId: tiddler.id, shadow: store.isShadowTiddler(t) ? 1 : 0, historyView: story.getHistoryView(tiddler) });

	if (res.error)
		displayMessage(res.error);
	else {
		tiddler.versions = res.versions;
		var av = config.options.chkListPrevious;
		config.options.chkListPrevious = true;
		story.refreshTiddler(t, null, true);
		config.options.chkListPrevious = av;
	}
}

function RequestVersion(t, v) {
    return true;
}

function onClickTiddlerVersion(e) {
    if (!e) var e = window.event;
    try {
        var theTarget = resolveTarget(e);
        if (theTarget) {
            var t = theTarget.getAttribute("tiddler");
            var v = theTarget.getAttribute("version");
            if (t && v) {
                var tiddler = store.getTiddler(t);
                var currentVer = tiddler.currentVer;
                tiddler.stashVersion();
                var cv = tiddler.ovs[v];
                if (!cv) {
                    cv = http.tiddlerVersion({ tiddlerId: tiddler.id, version: v });
                    if (cv.error !== undefined)
                        return alert(cv.error);
                    tiddler.ovs[v] = cv;
                }
                merge(tiddler, cv);
                tiddler.title = t;
                tiddler.currentVer = currentVer;
				var cte = story.findContainingTiddler(theTarget);
				var ar = [];
				if (cte && getElementsByClassName('viewer special','*',cte,ar)) {
					ar[0].innerHTML = "";
					var st = store.getTiddler(t)
					wikify(st.text,ar[0],null,st);
					var et = store.replaceText(t,st.text);
					store.notify(t,true);
					store.replaceText(t,et);
				}
				else
					story.refreshTiddler(t, null, true);
            }
        }
    } catch (ex) {
        displayMessage(ex.toString())
    }
}

config.macros.revision = {
    handler: function(place, macroName, params, wikifier, paramString, tiddler) {
        if (tiddler.version == params[1]) // the currently displayed version
            place = createTiddlyElement(place, "b"); // should be listed in bold face
        var btn = createTiddlyButton(place, params[0], "View version", onClickTiddlerVersion, "tiddlyLink");
        btn.setAttribute("refresh", "link");
        btn.setAttribute("tiddlyLink", "What's this");
        btn.setAttribute("tiddler", tiddler.title);
        btn.setAttribute("version", params[1]);
    }
}

function CheckNewAddress(title) {
	r = http.getNewAddress({title:title});
	if (r.success)
	    return r.Address;
}

var forms = {};

function formName(e) {
    if (!e) var e = resolveTarget(window.event);
    return story.findContainingTiddler(e).getAttribute("tiddler");
}

function GetForm(fn) {
    if (typeof(fn) != "string")
        fn = formName(fn);
    if (!fn) return;
    if (forms[fn] === undefined)
        forms[fn] = {};
    return forms[fn];
}

function updateForm(id,e,val) {
    var f = GetForm(e);
	if (!f) return;
	var fch = f[id + "_changed"];
    if (fch)
		fch(f,id,val);
	else
		f[id] = val;
}

function setFormFieldValue(f,name,value,vList) {
	f[name] = value != undefined ? value : "";
	var e = f.controls[name];
	if (e.tagName == "A")
		e.firstChild.nodeValue = f[name];
	else
		e.value = f[name];
	if (vList)
		e.setAttribute("values",vList);
}

config.macros.input = {
	handler: function (place, macroName, params, wikifier, paramString, tiddler) {
		var ffn = params.shift();
		var fft = params.shift();
		var fftl = fft.length;
		var edit = macroName == 'edit';
		var ne = 1;
		if (fftl > 1 && fft.startsWith('[') && fft.endsWith(']')) {
			ne = fftl > 2 && parseInt(fft.substring(1, fftl - 1));
			if (ne < 0) {
				//displayMessage("upt to " + ne);
				ne = 0 - ne;
			}
			fft = params.shift();
		}
		if (fft === undefined || !this[fft] || isNaN(ne))
			return createTiddlyLink(place, "GuideToInputMacro", true);
		var initer = config.macros.input[fft];
		if (edit) {
			var f = { updateaccess: !readOnly };
		} else {
			var f = GetForm(tiddler ? tiddler.title : formName(place));
			if (params.length == 1 && f && f[ffn] != null)
				params[1] = f[ffn]; // get default value from form
			f.controls = f.controls || [];
		}
		for (var i = 0; i < ne; i++) {
			if (place.tagName == 'TR')
				var cwe = createTiddlyElement(place, 'TD');
			else
				var cwe = place;
			var ce = initer(cwe, ffn, params, wikifier, paramString, tiddler, f, i);
			if (ce) {
				if (edit)
					ce.setAttribute("edit", ffn);
				if (ne > 1) //!(cwe === place))
					ce.setAttribute('index', i);
			}
		}
	},
	// <<input name text width text>>
	text: function (place, name, params, wikifier, paramString, tiddler, f, i) {
		var c = createTiddlyElement(place, "input", name, null, null, { href: "javascript:;" });
		if (params.length > 0)
			c.size = params[0];
		if (!f.updateaccess)
			c.setAttribute("readOnly", "readOnly");
		c.onchange = config.macros.input.fieldChanged;
		if (f.controls) {
			c.value = params.length > 1 ? params[1] : "";
			f.controls[name] = c;
		}
		else {
			c.value = store.getValue(tiddler, name, i) || (params[3] || '');
			c.setAttribute("type", "text");
		}
		return c;
	},
	// <<input name textarea rows*cols text>>
	textarea: function (place, name, params, wikifier, paramString, tiddler, f) {
		var attribs = { href: "javascript:;" };
		var md = params[0].split('*');
		attribs.rows = md[0];
		if (md.length > 1)
			attribs.cols = md[1];
		var c = createTiddlyElement(place, "textarea", name, null, null, attribs);
		if (!f.updateaccess)
			c.setAttribute("readOnly", "readOnly");
		c.onchange = config.macros.input.fieldChanged;
		if (f.controls) {
			c.value = params.length > 1 ? params[1] : "";
			f.controls[name] = c;
		}
		else {
			c.value = store.getValue(tiddler, name) || (params[3] || '');
			c.setAttribute("type", "text");
		}
		return c;
	},
	// <<input name checkbox [checked]>>
	checkbox: function (place, name, params, wikifier, paramString, tiddler, f, i) {
		var c = createTiddlyElement(place, "input", name, null, null, { href: "javascript:;", type: "checkbox" });
		c.onchange = config.macros.input.fieldChanged;
		if (f.controls) {
			c.checked = params.length > 1 ? params[1] : "";
			f.controls[name] = c;
		}
		else {
			var sv = store.getValue(tiddler,name,i);
			c.checked = sv == 'false' ? false : (sv || (params[2] || ''));
			c.setAttribute('type', 'checkbox');
		}
		return c;
	},
	// <<input name macro handler>>
	macro: function (place, name, params, wikifier, paramString, tiddler) {
		if (params.length > 1 && params[1].handler)
			params[1].handler(place, params[1]);
	},
	// <<input name select values value>>
	select: function (place, name, params, wikifier, paramString, tiddler, f, i) {
		var valus = config.macros.input.parameter(params[0]);
		var osdo = params.length > 2 ? params[2] : "";
		var attrs = { href: "javascript:;", values: valus, onselect: osdo };
		if (f.controls) {
			var value = params.length > 1 && params[1] ? params[1] : valus.split('|')[0];
		} else {
			var value = store.getValue(tiddler,name,i) || valus.split('|')[0];
			attrs.type = 'select';
		}
		if (f.updateaccess) {
			var cbl = createTiddlyElement(place, "a", name, null, value, attrs);
			var drs = createTiddlyElement(place, 'span');
			drs.innerHTML = "&#9660;";
			cbl.onclick = config.macros.input.dropSelect;
			if (f.controls)
				f.controls[name] = cbl;
			return cbl;
		} else
			return createTiddlyElement(place, 'span', null, null, value);
	},
	dropSelect: function (ev) {
		var e = ev || window.event;
		var me = resolveTarget(e);
		var val = me.childNodes[0].nodeValue;
		var values = me.getAttribute("values").split("|");
		var popup = Popup.create(this);
		for (var i = 1; i < values.length; i++)
			createTiddlyButton(createTiddlyElement(popup, "li"), values[i], null, config.macros.input.selectChanged);
		popup.setAttribute("owner", me.getAttribute("id"));
		Popup.show();
		var cup = values.indexOf(val);
		if (cup >= 0)
			popup.childNodes[cup >= 1 ? cup - 1 : 0].firstChild.focus();
		var kph = function (ev) {
			var e = ev || window.event;
			if (e.keyCode == 27) { // Esc
				Popup.remove();
				me.focus();
			}
		};
		addEvent(popup, window.event ? "keydown" : "keypress", kph);
		e.cancelBubble = true;
		if (e.stopPropagation) e.stopPropagation();
		return false;
	},
	selectChanged: function (ev) {
		var e = ev || window.event;
		var me = resolveTarget(e);
		var owner = me.parentNode.parentNode.getAttribute("owner");
		var val = me.childNodes[0].nodeValue;
		var eOwner = Popup.stack[0].root;
		eOwner.firstChild.nodeValue = val;
		eOwner.focus();
		updateForm(owner, eOwner, val);
		var action = eOwner.getAttribute("onselect");
		if (action)
			eval(action);
		return false;
	},
	parameter: function (a) {
		if (a.indexOf("javascript:") == 0)
			return eval(a.substr(11));
		return a;
	},
	fieldChanged: function (ev) {
		try {
			var e = ev || window.event;
			var src = resolveTarget(e);
			var v = src.type == "checkbox" ? src.checked : src.value;
			var id = src.getAttribute("id");
			updateForm(id, src, v);
		} catch (x) {
			displayMessage(x.message);
		}
	},
	showField: function (name, show) {
		var e = document.getElementById(name);
		if (show === undefined)
			return e.style.display == 'inline';
		else
			e.style.display = show ? 'inline' : 'none';
	}
};

config.macros.submitButton = {
	handler: function (place, macroName, params, wikifier, paramString, tiddler) {
		if (eval(params[0]))
			createTiddlyButton(place,params[1],params[2],new Function('',params[3]),'button linkbutton redbutton');
		else if (params.length > 4)
			createTiddlyElement(place,'span',null,params[4],params[5]);
	}
};

function onUploadTiddlers(url) {
	var delc = document.getElementById('libraryCatalog');
	removeChildren(delc);
	importFromDialog(null, url);
}

config.macros.localDiv = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		createTiddlyElement(place,params[1] || "div",formName(place) + params[0]);
   }
}

config.macros['if'] = {
	handler: function (place, macroName, params, wikifier, paramString, tiddler) {
		if (params.length < 2)
			return;
		var c = params.shift();
		if (eval(c)) {
			var m = params.shift();
			if (config.macros[m])
				return config.macros[m].handler.call(this, place, macroName, params, wikifier, paramString, tiddler);
		}
	}
}

config.macros.iFrame = {
    handler: function(place,macroName,params,wikifier,paramString,tiddler) 
    {
        var theFrame = document.createElement("IFRAME");
        theFrame.src = params[0];
        theFrame.height = params[1] ? params[1] : 600;
        if (params[2])
            theFrame.name = params[2];
        theFrame.width = "100%";
        theFrame.frameBorder = 0;
        place.appendChild(theFrame);
    }
}

siteMap = [];
config.macros.siteMap = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler) {
		var url = params.length > 0 ? params[0] : window.location.pathname;
		var m = http.siteMap({ path: url });
		SiteMapEntry(place, m, 0, []);
	}
}

function SiteMapEntry(place,m,level,dir)
{
	for (var i=0; i < m.length; i++) {
		var lc = 0;
		var path = m[i].path;
		if (path == undefined) {
			var img = "/static/plusSite36.png";
			path = path = m[i].prefix;
		}
		else {
			var p; var r;
			for (p = 0;(r = path.indexOf('/',p+1)) >= 0; p = r)
				lc++; 
			if (path != "/" && p + 1 == path.length) {
				lc--; var img = "/static/plusFolder36.png";
			}
			else
				var img = "/static/plusDoc36.png";
		}
		if (lc == level) {
			AddIconPlusLink(place,img,m[i].title,path,m[i].tags);
			dir[lc] = { l: level + 1, ca: [], d: dir };
			siteMap[path] = dir[lc];
		}
		else if (lc > level && dir.length > level) {
			var ca = dir[level].ca;
			ca[ca.length]= m[i];
		}
	}
}

function AddIconPlusLink(place,img,title,url,tags)
{
	var li = createTiddlyElement(place,"div",null,null,null,{ href: "javascript:;" });
	li.style.marginLeft = "1.7em";
	li.onclick = function(ev) {
		var e = ev || window.event;
		e.cancelBubble = true;
	};
	if (img) {
		var im = createTiddlyElement(li,"img");
		li.appendChild(im);
		im.src = img;
		im.onclick = expandFolder;
		im.align = "top";
		im.alt = "Click to expand";
	}
	var ats = {}
	if (url && url.startsWith("#")) {
		createTiddlyLink(li,url.substring(1),true);
		return li;
	}
	else if (url == window.location.pathname) {
		ats.href = "javascript:;";
		ats.title = url;
	}
	else if (url) {
		ats.href = url;
		ats.title = url;
	}
	createTiddlyElement(li,url?"a":"i",null,null,title, ats);
	if (tags)
		createTiddlyElement(li,'span',null,'siteMapTags',[' [',tags,']'].join(''));
	return li;
}

function findTiddlyLink(e)
{
	a = e.getAttribute && e.getAttribute("tiddlyLink");
	if (a) return a;
	for (var c = e.firstChild; c != null; c = c.nextSibling) {
		if (c.nodeType == 1) {
			a = findTiddlyLink(c);
			if (a) return a;
		}
	}
}

function expandFolder(ev)
{
	var target = resolveTarget(ev || window.event);
	var href = target.parentNode.childNodes[1].getAttribute("title");
	if (!href.startsWith('/')) {
		href = "#" + findTiddlyLink(target.parentNode);
	}
	var sub = siteMap[href];
	var div = null;
	switch(leaf(target.src))
	{
	case "plusFolder36.png":
		target.src = "/static/minusFolder36.png";
		div = createTiddlyElement(target.parentNode,"div");
		SiteMapEntry(div,sub.ca,sub.l,sub.d);
	case "plusDoc36.png":
		if (leaf(target.src) == "plusDoc36.png")
			target.src = "/static/minusDoc36.png";
		if (!div)
			div = createTiddlyElement(target.parentNode,"div");
		var tl = http.getTiddlers({page: href});
		if (tl.error)
			AddIconPlusLink(div,null,tl.error);
		else {
			var any = false;
			for (var i = 0; i < tl.length; i++) 
				if (tl[i].search(/SiteTitle|SiteSubtitle|DefaultTiddlers|MainMenu|StyleSheet|ColorPalette/) == -1) {
					if (href != window.location.pathname)
						hr = href + "#" + encodeURIComponent(String.encodeTiddlyLink(tl[i]));
					else
						hr = "#" + tl[i];
					AddIconPlusLink(div,"/static/plusTiddler36.png",tl[i],hr);
					siteMap[hr] = {};
					any = true;
				}
			if (!any)
				AddIconPlusLink(div,null,"this page is empty");
		}
		sub.div = div;
		break;
	case "minusFolder36.png":
		target.src = "/static/plusFolder36.png";
		target.parentNode.removeChild(sub.div);
		break;
	case "minusDoc36.png":
		target.src = "/static/plusDoc36.png";
		target.parentNode.removeChild(sub.div);
		break;
	case "plusTiddler36.png":
		target.src = "/static/minusTiddler36.png";
		var tdtext = href.startsWith("/") ? http.getTiddler({url:href}).text : store.getTiddlerText(href.substring(1));
		var li = createTiddlyElement(target.parentNode,"div",null,null);
		li.style.marginLeft = "1.25em";
		wikify(tdtext,li);
		sub.div = li;
		break;
	case "minusTiddler36.png":
		target.src = "/static/plusTiddler36.png";
		target.parentNode.removeChild(sub.div);
		break;	
	}
}

function leaf(url)
{
	var a = url.split("/");
	return a[a.length-1];
}

config.macros.image = {
	handler: function (place, macroName, params, wikifier, paramString, tiddler) {
		var span = createTiddlyElement(place, "span");
		var hbw = params[3] ? params[3] : "5";
		var vbw = hbw / 2; // heuristic choice
		var vbs = params[4] ? params[4] : "border-bottom: " + hbw + "px solid transparent; border-top: " + hbw + "px solid transparent; ";
		var tat = params[5] ? ' title="' + params[5].htmlEncode() + '"' : '';
		var align = params[1];
		if (align) {
			var width = params[2];
			if (!width) width = "60%";
			width = "width: " + width + "; ";
			switch (align.toLowerCase()) {
				case "<":
				case "left":
					var style = width + "float: left; clear: left; " + vbs + " border-right: " + hbw + "px solid transparent;";
					break;
				case ">":
				case "right":
					var style = width + "float: right; clear: right; " + vbs + " border-left: " + hbw + "px solid transparent;";
					break;
				default:
					var style = vbs + width;
			}
		}
		else
			var style = vbs + "width: 100%";

		var paths = params[0].split("|");
		span.innerHTML = '<img src="'.concat(paths[0], '"', tat, ' style="', style, '"/>');
		if (paths.length > 1) {
			span.firstChild.onclick = function ()
			{ window.location = paths[1]; };
		}
	}
}

config.macros.menu = {
	opened: [],
	handler: function(place,macroName,params,wikifier,paramString,tiddler) 
	{
		// parameters: text contentTiddler tooltip accesskey condition
		if (params[4] && !eval(params[4]))
			return;
		var dl = params[1];
		if (this.opened.indexOf(dl) > -1) {
			this.render(dl, createTiddlyElement(place,'div'));
		}
		else
			createTiddlyButton(place, params[0], params[2], this.onClick, null, null, params[3], { data: dl });
	},
	onClick: function(ev)
	{
		var target = resolveTarget(ev || window.event);
		var data = target.getAttribute("data");
		if (!data)
			return;
		config.macros.menu.render(data,target);
		config.macros.menu.opened.push(data);
	},
	render: function(data,target)
	{
		var text = store.getTiddlerText(data).split('\n');
		for (var i = text.length - 1; i >= 0; i--) {
			var what = text[i].split("|");
			switch (what.shift()) {
				case 'macro':
					invokeMacro(target, what[0], what[1]);
					break;
				case 'tiddler':
					var tn = what[0];
					createTiddlyButton(target, what[1], what[2], config.macros.menu.openTiddler, null, null, what[3], { data: tn });
					break;
				case 'link':
					// link URL text condition
					if (eval(what[2])) {
						var lnk = createExternalLink(target, what[0]);
						lnk.appendChild(document.createTextNode(what[1]));
					}
					break;
			}
		}
		var c = target;
		while (target.childNodes.length > 1) {
			var mc = target.removeChild(target.childNodes[1]);
			insertAfter(c, mc);
			mc = c;
		}
		removeNode(target);
	},
	openTiddler: function(ev)
	{
		var target = resolveTarget(ev || window.event);
		var data = target.getAttribute('data');
		story.displayTiddler(null,data);
		story.focusTiddler(data,'text');
	}
};

config.macros.login = {
	displayLoginDialog: function() {
		if (config.isLoggedIn() == false)
			window.location = http.getLoginUrl({ path: window.location.pathname + '#' + story.viewState(['LoginDialog', 'NoAccessMessage']) }).Url;
	},
	handler: function(place,macroName,params,wikifier,paramString,tiddler) {
		var label = "login";
		var tip = "Log in with your Google id";
		if (paramString == "LoginOnly" && config.isLoggedIn())
			createTiddlyText(place,label);
		else if (config.isLoggedIn() == false)
			createTiddlyButton(place, label, tip, this.displayLoginDialog);
		else {
			this.open = true;
			params[0] = config.loginName + " \u00bb";
			return config.macros.menu.handler(place,macroName,params,wikifier,paramString,tiddler);
		}
	}
};

config.macros.logout = {
	handler: function (place, macroName, params, wikifier, paramString, tiddler) {
		var label = "logout";
		createTiddlyButton(place, label, label, function() {
				window.location = http.getLoginUrl({ path: window.location.pathname }).Url;
			});
	}
};


config.macros.userName = {
	handler: function(place,macroName,params,wikifier,paramString,tiddler) 
	{
		place.appendChild(document.createTextNode(config.options.txtUserName))
	}
}

function onLogin()
{
	window.location.reload();
}

function trace(f) {
  var sfv = "";
  for (var fn in f) {
    if (typeof(f[fn]) != 'function')
      sfv = sfv.concat(fn," = ",f[fn],"\n");
  }
  displayMessage(sfv);
}

function OnCreatePage(reply)
{
    if (reply.success)
        window.location = reply.Url;
}

TiddlyWiki.prototype.saveIfChanged = function(title,text) {
    t = this.createTiddler(title);
    if (t.text != text) {
        this.saveTiddler(title,title,text,config.options.txtUserName, new Date());
        return true;
    }
}	

function OnSavePageProperties()
{
	return true;
	try {
		var sts = store.saveIfChanged("SiteTitle",forms.PageProperties.title);
		var sss = store.saveIfChanged("SiteSubtitle",forms.PageProperties.subtitle);
	} catch (x) {
		if (x)
			displayMessage(x.Message);
		if (sts || sss)
			refreshAll();
		return false;
	}
	if (sts || sss)
		refreshAll();
	return true;
}

function OnCommitCloseForm(fn,reply)
{
	if (reply.success) {
		story.closeTiddler(fn);
		return reply;
	}
	return false;
}

config.macros.defineGroup = {
    handler: function(place,macroName,params,wikifier,paramString,tiddler) 
    {
		if (config.isLoggedIn())
			createTiddlyButton(place,"define group",null,function() {story.displayTiddler(null, "DefineGroup") },"buttonftr")
    }
}

function OnCreateGroup(reply)
{
	if (!reply.success) return;
	listOfAllGroups = listOfAllGroups + "|" + reply.Group;
	setFormFieldValue(forms.DefineGroup,"groupname",reply.Group,listOfAllGroups);
	setFormFieldValue(forms.DefineGroup,"name","");
}

function addToUserListElement(name,ule,check)
{
	if (!ule)
		ule = document.getElementById("groupMemberList");
	var fc = ule.firstChild;
	if (check)
        var c = createTiddlyElement(ule,"input",null,null,null, {href: "javascript:;", type: "checkbox"});
	createTiddlyElement(ule,"a",null,null,name,{href:"/users/" + encodeURIComponent(name)});
	createTiddlyElement(ule,"br");
	if (!fc) {
		var pte = ule.parentElement;
		if (pte.children.length == 1)
			createTiddlyButton(pte,"Remove selected member(s)","Remove members from group",removeSelectedMembers,"cmdButton");
	}
}

function removeSelectedMembers()
{
	var gml = document.getElementById("groupMemberList");
	var i=0;
	for (var i=0; i < gml.children.length; i+=3) {
		if (gml.children[i].checked) {
			forms.DefineGroup.user = gml.children[i+1].firstChild.nodeValue;
			http.removeGroupMember(forms.DefineGroup);
		}
	}
	ListGroupMembers();
}

function ListGroupMembers(reply)
{
	if (!reply)
		return ListGroupMembers(http.getGroupMembers(forms.DefineGroup));
	gml = document.getElementById("groupMemberList");
	removeChildren(gml);
	if (!reply.length)
		gml.appendChild(document.createTextNode("(no members)"));
	else
		for (var i=0; i < reply.length; i++) {
			addToUserListElement(reply[i],gml,true);
		}
}

function OnAddMember(reply)
{
	gml = document.getElementById("groupMemberList");
	if (gml.innerText == "(no members)")
		gml.removeChild(gml.firstChild);
	var m = forms.DefineGroup.user;
	addToUserListElement(m,gml,true);
}

config.macros.recentChanges = {
	handler: function(place)
	{
		config.macros.recentChanges.cache = [];
		var ta = createTiddlyElement(place,"table");
		var tbody = createTiddlyElement(ta,"tbody");
		this.fill(tbody,0,10);
	},
	fill: function(tbody,off,max)
	{
		var rcl = config.macros.recentChanges.cache[off];
		if (!rcl)
			rcl = http.getRecentChanges({ offset: off, limit: max });
		if (rcl.success) {
			config.macros.recentChanges.cache[off] = rcl;
			for (var i = 0; i < rcl.changes.length; i++) {
				var c = rcl.changes[i];
				var tr = createTiddlyElement(tbody,"tr",null,i % 2 ? "evenRow":"oddRow");
				createTiddlyElement(tr,"td",null,null,c.time.substr(0,16));
				createTiddlyElement(tr,"td",null,null,c.who);
				var td = createTiddlyElement(tr,"td");
				var w = "";
				if (c.page == location.pathname)
					createTiddlyLink(td, c.title, true);
				else {
					var a = createTiddlyElement(td,"a",null,null,c.title);
					a.href = c.page + "#" + encodeURIComponent(String.encodeTiddlyLink(c.title));
					w = c.page;
				}
				createTiddlyElement(tr,"td",null,null,w);
			}
			tr = createTiddlyElement(tbody,"tr");
			td = createTiddlyElement(tr, "td",null,null,null,{"colspan":"4"});
			if (rcl.changes.length == max)
			  createTiddlyButton(td,"<<","Earlier changes", function(ev) { 
				var ce = clearParent(resolveTarget(ev || window.event),"tbody");
				config.macros.recentChanges.fill(ce,off + max,max); 
				});
			if (off > 0)
			  createTiddlyButton(td,">>","Later changes", function(ev) { 
				var ce = clearParent(resolveTarget(ev || window.event),"tbody");
				config.macros.recentChanges.fill(ce,off - max,max); 
				});
		}
	}
}

config.macros.recentComments = {
	handler: function (place) {
		var ta = createTiddlyElement(place, "table");
		var tbody = createTiddlyElement(ta, "tbody");
		this.fill(tbody, 0, 10);
	}
	,
	fill: function (tbody, off, max) {
		var rcl = http.getRecentComments({ offset: off, limit: max });
		if (rcl.success) {
			var tiddlers = rcl.tiddlers;
			var tiddict = [];
			for (var j = 0; j < tiddlers.length; j++)
				tiddict[tiddlers[j].id] = tiddlers[j];
			for (var i = 0; i < rcl.comments.length; i++) {
				var c = rcl.comments[i];
				var tr = createTiddlyElement(tbody, "tr", null, i % 2 ? "evenRow" : "oddRow");
				createTiddlyElement(tr, "td", null, null, c.time.substr(0, 16));
				createTiddlyElement(tr, "td", null, null, c.who);
				var tdl = createTiddlyElement(tr, "td");
				var tiddlr = tiddict[c.tiddler];
				if (tiddlr && tiddlr.page && tiddlr.page != window.location.pathname) {
					var a = createExternalLink(tdl, tiddlr.page + "#" + encodeURIComponent(String.encodeTiddlyLink(tiddlr.title)));
					a.appendChild(document.createTextNode(tiddlr.title));
				}
				else
					createTiddlyLink(tdl, tiddlr ? tiddlr.title : "(deleted tiddler)", true);
				var tdb = createTiddlyElement(tr, "td", null, null);
				wikify(c.text, tdb);
			}
			tr = createTiddlyElement(tbody, "tr");
			td = createTiddlyElement(tr, "td", null, null, null);
			if (rcl.comments.length == max)
				createTiddlyButton(td, "<<", "Earlier comments", function (ev) {
					var ce = clearParent(resolveTarget(ev || window.event), "tbody");
					config.macros.recentComments.fill(ce, off + max, max);
				});
			if (off > 0)
				createTiddlyButton(td, ">>", "Later comments", function (ev) {
					var ce = clearParent(resolveTarget(ev || window.event), "tbody");
					config.macros.recentComments.fill(ce, off - max, max);
				});
			td = createTiddlyElement(tr, "td", null, null, null, { "colspan": "3" });
			createTiddlyText(td, "NB: Links in comments to content on other pages don't work on from here");
		}
	}
}

function clearParent(ce, pt)
{
	while (ce.tagName.toLowerCase() != pt)
		ce = ce.parentNode;
	removeChildren(ce);
	return ce;
}

config.macros.fileList = {
	handler: function(place,macro,params,w,ps,tiddler)
	{
		var fl = http.fileList();
		if (fl.success) {
			this.fn = tiddler.title;
			forms[this.fn] = {};
			var flt = "|!Path|!Date|!Type|!Size|"
			for (var i = 0; i < fl.files.length; i++) {
				forms[this.fn][fl.files[i].path] = false;
				flt = [flt, '\n|<<input "', fl.files[i].path, '" checkbox false>> [[', fl.files[i].path, '|', fl.files[i].path, ']]|', fl.files[i].date.formatString('DD MMM YYYY 0hh:0mm'), '|', fl.files[i].mimetype, '|', fl.files[i].size,'|'].join('')
			}
			flt = flt + '\n<<submitButton true "Delete file(s)" "Delete selected files" config.macros.fileList.DeleteSelected()>>';
			flt = flt + ' <<submitButton true "Replace file.." "Replace selected file" config.macros.fileList.ReplaceSelected()>>';
			wikify(flt,place,null,tiddler);
		}
	},
	DeleteSelected: function() {
		for (var fn in forms[this.fn]) {
			var fls = forms[this.fn]
			for (var path in fls) {
				if (path != 'controls' && fls[path]) {
					dr = http.deleteFile({url:path})
					if (dr.success) {
						displayMessage("Deleted " + path);
						delete fls[path];
					}
				}
			}
		}
	},
	ReplaceSelected: function() {
		for (var fn in forms[this.fn]) {
			var fls = forms[this.fn]
			for (var path in fls) {
				if (path != 'controls' && fls[path]) {
					displayMessage("Replace(" + path + ") via " + this.fn);
					wikify("<<uploadDialog replace=" + encodeURIComponent(path) + ">>", story.getTiddler(this.fn));
					return;
				}
			}
		}
	}
};

config.macros.pasteTiddler = {
	handler: function(place)
	{
		var btn = createTiddlyButton(place, "paste tiddler", "Insert tiddler from clipboard", this.onClickPaste, null, null, 'v');
	},
	onClickPaste: function()
	{
		var ptr = http.clipboard({ action: 'paste' });
		if (ptr.success) {
			KeepTiddlers(ptr);
			store.notify(ptr.title, true);
			if (ptr.title.startsWith('_')) {
				story.displayTiddler(null, ptr.title, DEFAULT_EDIT_TEMPLATE);
				story.focusTiddler(ptr.title, "text");
			}
			else
				story.displayTiddler(null, ptr.title);
		}
	}
};

config.macros.recycleBin = {
	handler: function(place, macroName, params, wikifier, paramString)
	{
		this.rows = 0;
		var trash = http.recycleBin({ list: paramString });
		var tta = trash.tiddlers;
		if (tta.length == 0)
			return createTiddlyText(place,"The bin is empty");
		var tbl = createTiddlyElement(place,'table');
		var tbo = createTiddlyElement(tbl,'tbody');
		this.addRow(tbo,"When","Who","Where","What","Why");
		for (var i = 0; i < tta.length; i++) {
			var tx = tta[i];
			this.addRow(tbo,tx.at,tx.by,tx.page,tx.title,tx.comment,tx.key);
		}
		if (config.admin) {
			var emptor = function() {
				if (http.recycleBin({ empty: '*' }).success)
					config.macros.recycleBin.close();
			};
			createTiddlyButton(place,"Empty bin","Lose what's in here",emptor);
		}
	},
	close: function() {
		story.closeTiddler("Recycle bin",null);
	},
	retrieve: function(ev) {
		var tb = resolveTarget(ev || window.event);
		var id = tb.getAttribute('id');
		var tlr = http.recycleBin({ get: id });
		if (tlr && tlr.success) {
			config.macros.recycleBin.close();
			var xt = ShowExternalTiddler(null,tlr);
			xt.path = tlr.path;
			config.commands.rescueTiddler.bin[tlr.title] = xt;
			displayMessage("Use rescue to restore this tiddler to where it was");
		}
	},
	rows: 0,
	addRow: function(tbo,when,who,where,what,why,key) {
			var tr = createTiddlyElement(tbo,'tr',null,this.rows % 2 ? 'oddRow' : 'evenRow');
			var tdw = createTiddlyElement(tr,'td',null,null, typeof when == 'object' ? when.formatString("YYYY-0MM-0DD hh:mm:0ss") : when);
			var tdw = createTiddlyElement(tr,'td',null,null,who);
			var tdw = createTiddlyElement(tr,'td',null,null,where);
			var tdt = createTiddlyElement(tr,'td',null,null, this.rows ? null : what);
			if (this.rows++ && key)
				var ae = createTiddlyButton(tdt,what,null,this.retrieve,'deleted',null,null, { id: key });
			var tdw = createTiddlyElement(tr,'td',null,null,why);
	}
};

config.macros.author = {
	handler: function(place, macroName, params, wikifier, paramString, tiddler)
	{
		if (tiddler.version == 0)
			return createTiddlyButton(place,config.views.wikified.shadowModifier,"This is a special-purpose tiddler",null,'shadowTiddler');
		var an = params.length > 0 ? params[0] : tiddler.modifier;
		var au = authors[an];
		if (!au)
			au = authors[an] = http.getUserInfo({'user': an});
		if (au.tiddler == null || au.tiddler == "")
			createTiddlyElement(place,'a',null,null,an,{title:au.about});
		else if (au.tiddler.indexOf('#') > 0)
			createTiddlyButton(place,an,au.about,config.macros.author.onclick,'penname','user/' + an);
		else 
			createTiddlyText(createExternalLink(place,au.tiddler),an);
	},
	onclick: function(ev)
	{
		var t = resolveTarget(ev || window.event);
		var id = t.getAttribute("id").substring(5);
		var au = authors[id];
		if (au.tiddler != "")
			DisplayNonLocalTiddler(null, au.tiddler);
	}
}

config.macros.myprojects = {
	handler: function(place)
	{
		var projects = http.userProfile().projects;
		if (projects && projects.length) {
			var ps = projects.split(' ');
			for (var p = 0; p < ps.length; p++) {
				var link = createExternalLink(place,'http://' + ps[p]);
				link.innerHTML = ps[p];
				createTiddlyElement(place,'br');
			}
		}
	}
}

config.macros.urlFetch = {
	handler: function (place, macroName, params) {
		var text = http.urlFetch({ url: params[0] });
		var w = params.length == 1 ? "span" : params[1];
		var output = createTiddlyElement(place, w);
		output.innerHTML = text;
	}
}

config.macros.smugFeed = {
	handler: function (place, macroName, params) {
		var relw = params[1] || '100%';
		var nrw = parseInt(relw);
		var rwp = place.offsetWidth;
		if (nrw > 0 && nrw <= 100)
			rwp = Math.floor(nrw * rwp / 100);
		var text = http.smugFeed({ url: params[0], width: rwp, details: 'dim' });
		var img = function(i) { return i.split(' ')[0] };
		var imw = function(i) { return parseInt(i.split(' ')[1]) };
		var imh = function(i) { return parseInt(i.split(' ')[2]) };
		var images = text.images.split('\n');
		if (images) {
			if (relw == -1) {
				for (var i = 0; i < images.length; i++) { // list all images
					createTiddlyText(createExternalLink(place, images[i]), images[i]);
					createTiddlyElement(place, 'br');
				}
			}
			else {
				var wdiv = createTiddlyElement(place, 'div', 'smugframe', 'smug');
				var wcw = wdiv.clientWidth;
				var maxH = window.innerHeight * 9 / 10;
				var mh = maxH;
				var imge = null;
				var otf = null;
				var maxh = 0;
				var sfunc = function () {
						if (images.length) {
							var pin = Math.floor(Math.random() * images.length);
							var pick = images.splice(pin, 1)[0];
							var ima = { src: img(pick) }; 
							ima.width = Math.min(imw(pick),wcw);
							ima.height = imh(pick) * ima.width / imw(pick);
							if (ima.height > maxH) {
								ima.height = maxH;
								delete ima.width;
							}
							maxh = Math.max(maxh,ima.height);
							wdiv.style.height = maxh + 'px';
							if (imge)
								wdiv.removeChild(imge);
							imge = createTiddlyElement(wdiv, 'img', null, 'smug', null, ima);
						}
						else
							window.clearInterval(otf);
						return images.length;
					};
				if (sfunc() && params[2])
					otf = window.setInterval(sfunc, 1000 * parseInt(params[2]));
			}
		}
	}
}

config.macros.downloadAsTiddlyWiki = {
	handler: function(place, macroName, params)
	{
		if (location.protocol == "file:")
			return;
		createTiddlyText(place, "Download");
		var link = config.macros.downloadAsTiddlyWiki.createLink( '.html', '?twd=' + config.options.txtEmptyTiddlyWiki, '.htm'); 
		link.title = "Right-click to download this page as a Tiddlywiki";
		createTiddlyText(link, " TiddlyWiki");
		place.appendChild(link);

		var link = config.macros.downloadAsTiddlyWiki.createLink( '.xml', '?xsl='); 
		link.title = "Right-click to download the content on this page as XML";
		createTiddlyText(link, " XML");
		place.appendChild(link);
	},
	createLink: function(ft,qs,fta) // append default filetype & query string
	{
		var link = document.createElement("a");
		var path = location.pathname;
		if (path.right(ft.length) != ft && (!fta || path.right(fta.length) != fta))
			path = path + ft;
		link.href = path + qs;
		return link;
	}
}


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
		createUploadFrame(place,paramString);
		createTiddlyElement(place,"DIV","displayUploadResult");
		createTiddlyElement(place,"DIV","displayUploads");
	}
}

config.macros.diff = {
	handler: function(place,macroName,params,wikifier,paramString,tiddler) 
	{
		if (tiddler.version == params[0])
			createTiddlyElement(place,'div',null,'disabled',params[0]);
		else
			createTiddlyButton(place,params[0],'compare to this version', this.onClick);
	},
	onClick: function(ev)
	{
		var place = resolveTarget(ev || window.event);
		var vnx = place.firstChild.nodeValue;
		var vny = tiddler.version;
		if (vny == vnx)
			return displayMessage("Same version!");
		if (vny < vnx) {
			var vt = vnx; vnx = vny; vny = vt; // swap order
		}
		var tel = story.findContainingTiddler(place);
		var tlr = store.getTiddler(tel.getAttribute("tiddler"));
		var args = { tid: tlr.id, vn1: vnx, vn2: vny };
		if (vnx == 0)
			args.shadowText = tlr.ovs[0].text;
		if (!args.tid) // shadow tiddler is current
			for (var ix in tlr.ovs)
				if (tlr.ovs[ix].id)
					args.tid = tlr.ovs[ix].id;
		var htr = http.tiddlerDiff(args);
		var deid = 'diff' + tlr.title;
		var de = document.getElementById(deid);
		if (de) removeNode(de);
		de = createTiddlyElement(null,"fieldset",deid);
		createTiddlyElement(de,"legend",null,null,"Comparing version " + vnx + " (red) to version " + vny + " (green)");
		var dce = createTiddlyElement(de,"div",null,'diffout');
		dce.innerHTML = htr;
		var ear = [];
		if (getElementsByClassName('viewer','*',tel,ear))
			insertAfter(ear[0],de);
	}
}

function getChildByClassName(e,name)
{
	for (e = e.firstChild; e; e = e.nextSibling) {
		if (e.classList && e.classList.contains(name))
			break;
	}
	return e;
}

function createUploadFrame(place, qs, id, height, src)
{
	var theFrame = document.createElement('iframe');
	theFrame.src = (src ? src :'/UploadDialog.htm') + '?' + qs + '#' + window.location.pathname;
	theFrame.height = height || 196;
	theFrame.width = "100%";
	theFrame.frameBorder = 0;
	if (id)
		theFrame.id = id;
	place.appendChild(theFrame);
}

function InsertTiddlerText(title, text, message) {
	var curtx = store.getTiddlerText(title);
	if (!curtx)
		store.saveTiddler(title,title,text.htmlDecode(),config.options["txtUserName"],new Date(), "");
	story.displayTiddler(null, title);
	if (message) {
		clearMessage();
		wikify(message.htmlDecode(), getMessageDiv());
	}
}

function availableTemplates() {
	var tl = http.getTemplates({ template: forms.PageProperties && forms.PageProperties.tags && forms.PageProperties.tags.indexOf('template') >= 0 ? forms.PageProperties.title : "" } );
	if (tl.success)
		return tl.templates.join('|');
}

config.macros.confirm_replace = {
	handler: function (place, macroName, params) {
		var doReplace = function() {
			var rpres = http.replaceExistingFile({ filename: params[0] });
			if (rpres.success) {
				clearMessage();
				displayMessage("Replaced " + params[0]);
			}
		};
		var btn = createTiddlyButton(place, "replace", "replace existing file", doReplace);
	}
};

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

function UrlInclude(what) {
	var q = window.location.search;
	var h = window.location.hash;
	var tp = q ? q : h;
	var path = window.location.href;
	if (tp)
		path = path.substring(0,path.indexOf(tp))
	if (q) {
		var qs = q.substring(1).split('&');
		var qf = false;
		for (var iq = 0; iq < qs.length; iq++) {
			if (qs[iq].startsWith('include=')) {
				qs[iq] = qs[iq] + "+" + what;
				qf = true;
			}
		}
		if (!qf)
			qs.push('include=' + what);
		q = '?' + qs.join('&');
	}
	else
		q = "?include=" + what;
	return path + q + h;
}

config.macros.deprecated_tiddlers = {
	list_all: function() {
		var tl = http.getTiddlers({page: window.location.pathname, deprecated: 'only'});
		var dtls = [];
		for (var i = 0; i < tl.length; i++) {
			dtls.push('[[' + tl[i] + '|' + tl[i] + ']]');
		}
		return dtls.join('<br>');
	},
	handler: function(place) {
		wikify(this.list_all(),place);
	}
};

function DeprecatedTiddlers(place,a,b)
{
	wikify("Deprecated tiddlers:<br>" + config.macros.deprecated_tiddlers.list_all(),place);
}


config.macros.giewiki = {
	handler: function(place, macroName, params) {
		var a = createExternalLink(place, "http://giewiki.appspot.com", true);
		createTiddlyText(a, params[1] || "giewiki");
	}
};

config.macros.timestamp = {
	handler: function (place, macroName, params) {
		createTiddlyText(place, config.timeStamp);
	}
};

function importFromDialog(url,what) {
	var liblistId = 'libList' + what;
	if (document.getElementById(liblistId))
		return;
	var deli = document.getElementById('libraryImport');
	if (what.indexOf(':') == -1) // other than fully specified (http:..)
		what = url + ':' + what;
	wikify('<<importTiddlers ' + what + '>>',deli);
}

function editTiddlerHere(place,args,tab) {
	story.createTiddler(place, null, args[2], args[3] || SPECIAL_EDIT_TEMPLATE);
}

function MakePathAFolder(fn) {
	var f = forms[formName(place)];
	av = f[fn];
	if(typeof av === 'string' && !av.endsWith('/'))
		setFormFieldValue(f,fn, av + '/');
}

SpecialEditorTiddlers = [ 'PageProperties', 'MainMenu', 'DefaultTiddlers', 'ColorPalette', 'StyleSheet' ];

Story.prototype.specialCaseEditorOpen = function(tn)
{
	var tps = document.getElementById('tiddlerPageSetup');
	if (!tps)
		return false;
	var tse = getElementsByClassName('tabset','div',tps);
	if (tse)
		return config.macros.tabs.switchTab(tse,tn) || true;
	return window.confirm('show ' + tn);
};

for (var a=0; a<SpecialEditorTiddlers.length; a++) {
	Story.prototype.specialCases[SpecialEditorTiddlers[a]] = Story.prototype.specialCaseEditorOpen;
	}

CommonTasks = {
	RemoveText: function(what,where) {
		var te = store.getTiddler(where);
		var tx = te.text.replace(what,'');
		if (tx != te.text) {
			var se = story.getTiddlerField(where,'text');
			if (se)
				se.value = tx;
			displayMessage(what + " removed from " + where);
			return store.saveTiddler(where,where,tx,config.options.txtUserName,new Date());
		}
		else
			return false;
	},
	RemoveThisLi: function (src) {
		var cul = src.parentNode.parentNode;
		cul.removeChild(src.parentNode);
	}
}

// adapted from http://muffinresearch.co.uk/archives/2006/04/29/getelementsbyclassname-deluxe-edition/
// v1.03 Copyright (c) 2006 Stuart Colville
function getElementsByClassName(strClass, strTag, objContElm, arr) {
	strTag = strTag || "*";
	objContElm = objContElm || document;
	var objColl = objContElm.getElementsByTagName(strTag);
	if (!objColl.length &&  strTag == "*" &&  objContElm.all) objColl = objContElm.all;
	var delim = strClass.indexOf('|') != -1  ? '|' : ' ';
	var arrClass = strClass.split(delim);
	for (var i = 0, j = objColl.length; i < j; i++) {
	var arrObjClass = objColl[i].className.split(' ');
	if (delim == ' ' && arrClass.length > arrObjClass.length) continue;
	var c = 0;
comparisonLoop:
	for (var k = 0, l = arrObjClass.length; k < l; k++) {
		for (var m = 0, n = arrClass.length; m < n; m++) {
			if (arrClass[m] == arrObjClass[k]) c++;
				if (( delim == '|' && c == 1) || (delim == ' ' && c == arrClass.length)) {
					if (arr)
						arr.push(objColl[i]);
					else
						return objColl[i];
					break comparisonLoop;
				}
			}
		}
	}
	return arr && arr.length ? arr.length : 0;
}

/***
Name:	InlineJavascriptPlugin  (static/inlinescript.htm)
Source:	http://www.TiddlyTools.com/#InlineJavascriptPlugin
Changes:'if' attribute added, 'src' attribute dropped
Author:	Eric Shulman - ELS Design Studios (http://www.elsdesign.com)
License:Creative Commons Attribution-ShareAlike 2.5 License (http://creativecommons.org/licenses/by-sa/2.5/)
 ***/
 
version.extensions.inlineJavascript= {major: 1, minor: 6, revision: 10, date: new Date(2010,12,19)};

config.formatters.push( {
	name: "inlineJavascript",
	match: "\\<script",
	lookahead: "\\<script(?: if=\\\"((?:.|\\n)*?)\\\")?(?: label=\\\"((?:.|\\n)*?)\\\")?(?: title=\\\"((?:.|\\n)*?)\\\")?( show)?\\>((?:.|\\n)*?)\\</script\\>",

	handler: function(w) {
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			var act = true;
			if (lookaheadMatch[1] && !eval(lookaheadMatch[1])) // precondition
				act = false;
			if (act && lookaheadMatch[5]) { // there is script code
				if (lookaheadMatch[4]) // show inline script code in tiddler output
					wikify("{{{\n"+lookaheadMatch[0]+"\n}}}\n",w.output);
				if (lookaheadMatch[2]) { // create a link to an 'onclick' script
					// add a link, define click handler, save code in link (pass 'place'), set link attributes
					var link=createTiddlyElement(w.output,"a",null,"tiddlyLinkExisting",lookaheadMatch[2]);
					link.onclick=function(e){var evt = e || window.event; evt.cancelBubble = true; try{return(eval(this.code))}catch(x){alert(x.description?x.description:x.toString())}}
					link.code="function _out(place){"+lookaheadMatch[5]+"\n};_out(this);"
					link.setAttribute("title",lookaheadMatch[3]?lookaheadMatch[3]:"");
					link.setAttribute("href","javascript:;");
					link.style.cursor="pointer";
				}
				else { // run inline script code
					var code="function _out(place){"+lookaheadMatch[5]+"\n};_out(w.output);"
					code=code.replace(/document.write\(/gi,'place.innerHTML+=(');
					try { var out = eval(code); } catch(e) { out = e.description?e.description:e.toString(); }
					if (out && out.length) wikify(out,w.output,w.highlightRegExp,w.tiddler);
				}
			}
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
		}
	}
} );
