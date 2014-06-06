<?xml version="1.0" encoding="ISO-8859-1"?>
<!-- Copyright (c) UnaMesa Association 2004-2009; see /static/iewiki.js -->
<!-- giewiki ver.: 1.10.0 -->
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method='html' version='1.0' encoding='UTF-8' indent='yes'/>
<xsl:template match="/">
<html>
<head>
<link rel='alternate' type='application/rss+xml' title='RSS' href='index.xml' />
<title>
</title>
<style id="styleArea" type="text/css">
#messageArea {display:none;}
#copyright {display:none;}
#storeArea {display:none;}
#storeArea div {padding:0.5em; margin:1em 0em 0em 0em; border-color:#fff #666 #444 #ddd; border-style:solid; border-width:2px; overflow:auto;}
#shadowArea {display:none;}
#javascriptWarning {width:100%; text-align:center; font-weight:bold; background-color:#dd1100; color:#fff; padding:1em 0em;}
</style>
<script src="/config.js" type="text/javascript"></script>
<script src="/static/iewiki.js" type="text/javascript"></script>
</head>
<body onload="main()">
<div id="copyright">
	Based on TiddlyWiki created by Jeremy Ruston, Copyright 2007 UnaMesa Association
</div>
<noscript>
<div id="javascriptWarning">
	This page requires JavaScript.
</div>
</noscript>
<div id="contentWrapper"></div>
<div id="shadowArea">
<div title="ColorPalette">
<pre>Background: #f4f3f2
Foreground: #000
PrimaryPale: #8cf
PrimaryLight: #18f
PrimaryMid: #04b
PrimaryDark: #014
SecondaryPale: #ffc
SecondaryLight: #fe8
SecondaryMid: #db4
SecondaryDark: #841
TertiaryPale: #eee
TertiaryLight: #ccc
TertiaryMid: #999
TertiaryDark: #666
Error: #f88
</pre>
</div>
<div title="StyleSheetColors">
<pre>
/*{{{*/
body {background:[[ColorPalette::Background]]; color:[[ColorPalette::Foreground]];}

a {color:[[ColorPalette::PrimaryMid]];}
a:hover {background-color:[[ColorPalette::PrimaryMid]]; color:[[ColorPalette::Background]];}
a img {border:0;}

h1,h2,h3,h4,h5,h6 {color:[[ColorPalette::SecondaryDark]]; background:transparent;}
h1 {border-bottom:2px solid [[ColorPalette::TertiaryLight]];}
h2,h3 {border-bottom:1px solid [[ColorPalette::TertiaryLight]];}

.button {color:[[ColorPalette::PrimaryDark]]; border:1px solid [[ColorPalette::Background]];}
.button:hover {color:[[ColorPalette::PrimaryDark]]; background:[[ColorPalette::SecondaryLight]]; border-color:[[ColorPalette::SecondaryMid]];}
.button:active {color:[[ColorPalette::Background]]; background:[[ColorPalette::SecondaryMid]]; border:1px solid [[ColorPalette::SecondaryDark]];}

.header {background:[[ColorPalette::PrimaryMid]];}
.headerShadow {color:[[ColorPalette::Foreground]];}
.headerShadow a {font-weight:normal; color:[[ColorPalette::Foreground]];}
.headerForeground {color:[[ColorPalette::Background]];}
.headerForeground a {font-weight:normal; color:[[ColorPalette::PrimaryPale]];}

.tabSelected{color:[[ColorPalette::PrimaryDark]];
background:[[ColorPalette::TertiaryPale]];
border-left:1px solid [[ColorPalette::TertiaryLight]];
border-top:1px solid [[ColorPalette::TertiaryLight]];
border-right:1px solid [[ColorPalette::TertiaryLight]];
}
.tabUnselected {color:[[ColorPalette::Background]]; background:[[ColorPalette::TertiaryMid]];}
.tabContents {color:[[ColorPalette::PrimaryDark]]; background:[[ColorPalette::TertiaryPale]]; border:1px solid [[ColorPalette::TertiaryLight]];}
.tabContents .button {border:0; padding: 0.2em 0.4em;}

#sidebar {}
#sidebarOptions input {border:1px solid [[ColorPalette::PrimaryMid]];}
#sidebarOptions .sliderPanel {background:[[ColorPalette::PrimaryPale]];}
#sidebarOptions .sliderPanel a {border:none;color:[[ColorPalette::PrimaryMid]];}
#sidebarOptions .sliderPanel a:hover {color:[[ColorPalette::Background]]; background:[[ColorPalette::PrimaryMid]];}
#sidebarOptions .sliderPanel a:active {color:[[ColorPalette::PrimaryMid]]; background:[[ColorPalette::Background]];}

.wizard {background:[[ColorPalette::PrimaryPale]]; border:1px solid [[ColorPalette::PrimaryMid]];}
.wizard h1 {color:[[ColorPalette::PrimaryDark]]; border:none;}
.wizard h2 {color:[[ColorPalette::Foreground]]; border:none;}
.wizardStep {background:[[ColorPalette::Background]]; color:[[ColorPalette::Foreground]];
border:1px solid [[ColorPalette::PrimaryMid]];}
.wizardStep.wizardStepDone {background:[[ColorPalette::TertiaryLight]];}
.wizardFooter {background:[[ColorPalette::PrimaryPale]];}
.wizardFooter .status {background:[[ColorPalette::PrimaryDark]]; color:[[ColorPalette::Background]];}
.wizard .button {color:[[ColorPalette::Foreground]]; background:[[ColorPalette::SecondaryLight]]; border: 1px solid;
border-color:[[ColorPalette::SecondaryPale]] [[ColorPalette::SecondaryDark]] [[ColorPalette::SecondaryDark]] [[ColorPalette::SecondaryPale]];}
.wizard .button:hover {color:[[ColorPalette::Foreground]]; background:[[ColorPalette::Background]];}
.wizard .button:active {color:[[ColorPalette::Background]]; background:[[ColorPalette::Foreground]]; border: 1px solid;
border-color:[[ColorPalette::PrimaryDark]] [[ColorPalette::PrimaryPale]] [[ColorPalette::PrimaryPale]] [[ColorPalette::PrimaryDark]];}

.wizard .notChanged {background:transparent;}
.wizard .changedLocally {background:#80ff80;}
.wizard .changedServer {background:#8080ff;}
.wizard .changedBoth {background:#ff8080;}
.wizard .notFound {background:#ffff80;}
.wizard .putToServer {background:#ff80ff;}
.wizard .gotFromServer {background:#80ffff;}

#messageArea {border:1px solid [[ColorPalette::SecondaryMid]]; background:[[ColorPalette::SecondaryLight]]; color:[[ColorPalette::Foreground]];}
#messageArea .button {color:[[ColorPalette::PrimaryMid]]; background:[[ColorPalette::SecondaryPale]]; border:none;}

.popupTiddler {background:[[ColorPalette::TertiaryPale]]; border:2px solid [[ColorPalette::TertiaryMid]];}

.popup {background:[[ColorPalette::TertiaryPale]]; color:[[ColorPalette::TertiaryDark]]; border-left:1px solid [[ColorPalette::TertiaryMid]]; border-top:1px solid [[ColorPalette::TertiaryMid]]; border-right:2px solid [[ColorPalette::TertiaryDark]]; border-bottom:2px solid [[ColorPalette::TertiaryDark]];}
.popup hr {color:[[ColorPalette::PrimaryDark]]; background:[[ColorPalette::PrimaryDark]]; border-bottom:1px;}
.popup li.disabled {color:[[ColorPalette::TertiaryMid]];}
.popup li a, .popup li a:visited {color:[[ColorPalette::Foreground]]; border: none;}
.popup li a:hover {background:[[ColorPalette::SecondaryLight]]; color:[[ColorPalette::Foreground]]; border: none;}
.popup li a:active {background:[[ColorPalette::SecondaryPale]]; color:[[ColorPalette::Foreground]]; border: none;}
.popupHighlight {background:[[ColorPalette::Background]]; color:[[ColorPalette::Foreground]];}
.listBreak div {border-bottom:1px solid [[ColorPalette::TertiaryDark]];}

.tiddler .defaultCommand {font-weight:bold;}

.shadow .title {color:[[ColorPalette::TertiaryDark]];}

.title {color:[[ColorPalette::SecondaryDark]];}
.subtitle {color:[[ColorPalette::TertiaryDark]];}

.toolbar {color:[[ColorPalette::PrimaryMid]];}
.commentToolbar {color:[[ColorPalette::PrimaryMid]];}
.toolbar a {color:[[ColorPalette::TertiaryLight]];}
.commentToolbar a {color:[[ColorPalette::TertiaryDark]];}
.selected .toolbar a {color:[[ColorPalette::TertiaryMid]];}
.selected .commentToolbar a {color:[[ColorPalette::TertiaryDark]];}
.selected .toolbar a:hover {color:[[ColorPalette::Foreground]];}
.selected .commentToolbar a:hover {color:[[ColorPalette::Foreground]];}

.tagging, .tagged {border:1px solid [[ColorPalette::TertiaryPale]]; background-color:[[ColorPalette::TertiaryPale]];}
.selected .tagging, .selected .tagged {background-color:[[ColorPalette::TertiaryLight]]; border:1px solid [[ColorPalette::TertiaryMid]];}
.tagging .listTitle, .tagged .listTitle {color:[[ColorPalette::PrimaryDark]];}
.tagging .button, .tagged .button {border:none;}

.footer {color:[[ColorPalette::TertiaryLight]];}
.selected .footer {color:[[ColorPalette::TertiaryMid]];}

.sparkline {background:[[ColorPalette::PrimaryPale]]; border:0;}
.sparktick {background:[[ColorPalette::PrimaryDark]];}

.error, .errorButton {color:[[ColorPalette::Foreground]]; background:[[ColorPalette::Error]];}
.warning {color:[[ColorPalette::Foreground]]; background:[[ColorPalette::SecondaryPale]];}
.lowlight {background:[[ColorPalette::TertiaryLight]];}

.zoomer {background:none; color:[[ColorPalette::TertiaryMid]]; border:3px solid [[ColorPalette::TertiaryMid]];}

.imageLink, #displayArea .imageLink {background:transparent;}

.annotation {background:[[ColorPalette::SecondaryLight]]; color:[[ColorPalette::Foreground]]; border:2px solid [[ColorPalette::SecondaryMid]];}

.viewer .listTitle {list-style-type:none; margin-left:-2em;}
.viewer .button {border:1px solid [[ColorPalette::SecondaryMid]];}
.tabContents .button {border:1px solid [[ColorPalette::TertiaryPale]];}
.tabContents .button:hover {border-color:[[ColorPalette::SecondaryMid]];}
.viewer blockquote {border-left:3px solid [[ColorPalette::TertiaryDark]];}

.viewer table, table.twtable {border:2px solid [[ColorPalette::TertiaryDark]];}
.viewer th, .viewer thead td, .twtable th, .twtable thead td {background:[[ColorPalette::SecondaryMid]]; border:1px solid [[ColorPalette::TertiaryDark]]; color:[[ColorPalette::Background]];}
.viewer td, .viewer tr, .twtable td, .twtable tr {border:1px solid [[ColorPalette::TertiaryDark]];}

.viewer pre {border:1px solid [[ColorPalette::SecondaryLight]]; background:[[ColorPalette::SecondaryPale]];}
.viewer code {color:[[ColorPalette::SecondaryDark]];}
.viewer hr {border:0; border-top:dashed 1px [[ColorPalette::TertiaryDark]]; color:[[ColorPalette::TertiaryDark]];}
.viewer table { border: 0px }
.viewer td {border: 1px solid #fff;} .oddRow {color: #333; background: #ddd;} .evenRow { color: #222; background: #eee;} 
.oddRowComment {color: #332; background: #ddc;} .evenRowComment { color: #222; background: #eec;}
.oddRowMessage {color: #223; background: #dcf;} .evenRowMessage { color: #223; background: #def;}
.oddRowNote {color: #332; background: #dec;} .evenRowNote { color: #222; background: #efc;}

.highlight, .marked {background:[[ColorPalette::SecondaryLight]];}

.editor input {border:0px solid [[ColorPalette::PrimaryMid]];}
.editor textarea {border:0px solid [[ColorPalette::PrimaryMid]]; width:100%;}
.editorFooter {color:[[ColorPalette::TertiaryMid]];}

.commentArea {background:[[ColorPalette::Background]];}
.commentTD {background:[[ColorPalette::Background]];}
.btnReplies {border:0;}

.redbutton { color: #cc0000 }
.redbutton:hover { color: #ff0000 }

/*}}}*/
</pre>
</div>
<div title="StyleSheetLayout">
<pre>
/*{{{*/
* html .tiddler {height:1%;}

body {font-size:.75em; font-family:arial,helvetica; margin:0; padding:0;}

h1,h2,h3,h4,h5,h6 {font-weight:bold; text-decoration:none;}
h1,h2,h3 {padding-bottom:1px; margin-top:1.2em;margin-bottom:0.3em;}
h4,h5,h6 {margin-top:1em;}
h1 {font-size:1.35em;}
h2 {font-size:1.25em;}
h3 {font-size:1.1em;}
h4 {font-size:1em;}
h5 {font-size:.9em;}

hr {height:1px;}

a {text-decoration:none;}

dt {font-weight:bold;}

ol {list-style-type:decimal;}
ol ol {list-style-type:lower-alpha;}
ol ol ol {list-style-type:lower-roman;}
ol ol ol ol {list-style-type:decimal;}
ol ol ol ol ol {list-style-type:lower-alpha;}
ol ol ol ol ol ol {list-style-type:lower-roman;}
ol ol ol ol ol ol ol {list-style-type:decimal;}

fieldset { padding:0px 8px 4px 4px; }

.txtOptionInput {width:11em;}

#contentWrapper .chkOptionInput {border:0;}

.externalLink {text-decoration:underline;}

.indent {margin-left:3em;}
.outdent {margin-left:3em; text-indent:-3em;}
code.escaped {white-space:nowrap;}

.tiddlyLinkExisting {font-weight:bold;}
.tiddlyLinkNonExisting {font-style:italic;}

/* the 'a' is required for IE, otherwise it renders the whole tiddler in bold */
a.tiddlyLinkNonExisting.shadow {font-weight:bold;}

#mainMenu .tiddlyLinkExisting,
#mainMenu .tiddlyLinkNonExisting,
#sidebarTabs .tiddlyLinkNonExisting {font-weight:normal; font-style:normal;}
#sidebarTabs .tiddlyLinkExisting {font-weight:bold; font-style:normal;}

#headerArea { margin: 0.5em; }
.siteTitle {font-size:3em;}
.siteSubtitle {font-size:1.2em;}

#mainMenu {position:absolute; left:0; width:10em; text-align:right; line-height:1.6em; padding:1.5em 0.5em 0.5em 0.5em; font-size:1.1em;}

#sidebar {position:absolute; right:3px; width:16em; font-size:.9em;}
#sidebarOptions {padding-top:0.3em;}
#sidebarOptions a {margin:0em 0.2em; padding:0.2em 0.3em; display:block;}
#sidebarOptions input {margin:0.4em 0.5em;}
#sidebarOptions .sliderPanel {margin-left:1em; padding:0.5em; font-size:.85em;}
#sidebarOptions .sliderPanel a {font-weight:bold; display:inline; padding:0;}
#sidebarOptions .sliderPanel input {margin:0 0 .3em 0;}
#sidebarTabs .tabContents {width:15em; overflow:hidden;}

.wizard {padding:0.1em 1em 0em 2em;}
.wizard h1 {font-size:2em; font-weight:bold; background:none; padding:0em 0em 0em 0em; margin:0.4em 0em 0.2em 0em;}
.wizard h2 {font-size:1.2em; font-weight:bold; background:none; padding:0em 0em 0em 0em; margin:0.4em 0em 0.2em 0em;}
.wizardStep {padding:1em 1em 1em 1em;}
.wizard .button {margin:0.5em 0em 0em 0em; font-size:1.2em;}
.wizardFooter {padding:0.8em 0.4em 0.8em 0em;}
.wizardFooter .status {padding:0em 0.4em 0em 0.4em; margin-left:1em;}
.wizard .button {padding:0.1em 0.2em 0.1em 0.2em;}

#messageArea {position:fixed; top:2em; right:0em; margin:0.5em; padding:0.5em; z-index:2000; _position:absolute;}
.messageToolbar {display:block; text-align:right; padding:0.2em 0.2em 0.2em 0.2em;}
#messageArea a {text-decoration:underline;}

.tiddlerPopupButton {padding:0.2em 0.2em 0.2em 0.2em;}
.popupTiddler {position: absolute; z-index:300; padding:1em 1em 1em 1em; margin:0;}

.popup {position:absolute; z-index:300; font-size:.9em; padding:0; list-style:none; margin:0;}
.popup .popupMessage {padding:0.4em;}
.popup hr {display:block; height:1px; width:auto; padding:0; margin:0.2em 0em;}
.popup li.disabled {padding:0.4em;}
.popup li a {display:block; padding:0.4em; font-weight:normal; cursor:pointer;}
.listBreak {font-size:1px; line-height:1px;}

.listBreak div {margin:2px 0;}
.tabset {padding:1em 0em 0em 0.5em;}
.tab {margin:0em 0em 0em 0.25em; padding:2px;}
.tabContents {padding:0.5em;}
.tabContents ul, .tabContents ol {margin:0; padding:0;}
.txtMainTab .tabContents li {list-style:none;}
.tabContents li.listLink { margin-left:.75em;}
.tabContents .tiddler {padding:0.1em 0.5em 0.5em 0.5em}

#contentWrapper {display:block;}
#splashScreen {display:none;}

#displayArea {margin:1em 17em 0em 14em;}

.toolbar {text-align:right; font-size:.9em;}
.commentToolbar {text-align:left; font-size:.9em;}

.tiddler {padding:1em 1em 0em 1em;}

.missing .viewer,.missing .title {font-style:italic;}

.title {font-size:1.6em; font-weight:bold;}

.missing .subtitle {display:none;}
.subtitle {font-size:1.1em;}

.tiddler .button {padding:0.2em 0.4em;}
.tiddler .disabled {padding:0.2em 0.6em;}

.tagging {margin:0.5em 0.5em 0.5em 0; float:left; display:none;}
.isTag .tagging {display:block;}
.tagged {margin:0.5em; float:right;}
.tagging, .tagged {font-size:0.9em; padding:0.25em;}
.tagging ul, .tagged ul {list-style:none; margin:0.25em; padding:0;}
.tagClear {clear:both;}

.footer {font-size:.9em;}
.footer li {display:inline;}

.annotation {padding:0.5em; margin:0.5em;}

* html .viewer pre {width:99%; padding:0 0 1em 0;}
.viewer {line-height:1.4em; padding-top:0.5em;}
.viewer .button {margin:0em 0.25em; padding:0em 0.25em;}
.viewer blockquote {line-height:1.5em; padding-left:0.8em;margin-left:2.5em;}
.viewer ul, .viewer ol {margin-left:0.5em; padding-left:1.5em;}

.viewer table, table.twtable {border-collapse:collapse; margin:0em 0em; 0em; 0em; font-size:1.0em;}

.viewer th, .viewer td, .viewer tr,.viewer caption,.twtable th, .twtable td, .twtable tr,.twtable caption {padding:3px;}
table.listView {font-size:0.85em; margin:0.8em 1.0em;}
table.listView th, table.listView td, table.listView tr {padding:0px 3px 0px 3px;}

.viewer pre {padding:0.5em; margin-left:0.5em; font-size:1.2em; line-height:1.4em; overflow:auto;}
.viewer code {font-size:1.2em; line-height:1.4em;}

.editor {font-size:1.1em;}
.editor input, .editor textarea {display:block; width:100%; font:inherit;}
.editorFooter {padding:0.25em 0em; font-size:.9em;}
.editorFooter .button {padding-top:0px; padding-bottom:0px;}

.fieldsetFix {border:0; padding:0; margin:1px 0px 1px 0px;}

.sparkline {line-height:1em;}
.sparktick {outline:0;}

.zoomer {font-size:1.1em; position:absolute; overflow:hidden;}
.zoomer div {padding:1em;}

.commentTable {width:100%; font-size:1.0em;}
.commentTable td {vertical-align:text-top;}
.commentArea {border:0px; width:100%; font:inherit;}
.commentToolbar { padding-bottom:5px;}
.replyTD { padding-left:1.25em }
.buttonftr {position:relative; top:0em; right:0em; }
.linkbutton { font-weight: bold }
.siteMapTags { color: #ff0000 }

.diffout { font-size:1.0em; font-family: courier; }
.diffminus { background-color: #d0ffdd; }
.diffplus { background-color: #ffd0dd; }
/*}}}*/
</pre>
</div>
<div title="StyleSheetLocale">
<pre>/***
StyleSheet for use when a translation requires any css style changes.
This StyleSheet can be used directly by languages such as Chinese, Japanese and Korean which need larger font sizes.
***/
/*{{{*/
body {font-size:0.8em;}
#sidebarOptions {font-size:1.05em;}
#sidebarOptions a {font-style:normal;}
#sidebarOptions .sliderPanel {font-size:0.95em;}
.subtitle {font-size:0.8em;}
.viewer table.listView {font-size:0.95em;}
/*}}}*/
</pre>
</div>
<div title="StyleSheetPrint">
	<pre>
		/*{{{*/
		@media print {
		#mainMenu, #sidebar, #messageArea, .toolbar, #backstageButton, #backstageArea {display: none ! important;}
		#displayArea {margin: 1em 1em 0em 1em;}
		/* Fixes a feature in Firefox 1.5.0.2 where print preview displays the noscript content */
		noscript {display:none;}
		}
		/*}}}*/
	</pre>
</div>
<div title="PageTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div id='headerArea'&gt;
&lt;span class='siteTitle' refresh='content' tiddler='SiteTitle'&gt;&lt;/span&gt;&amp;nbsp;
&lt;span class='siteSubtitle' refresh='content' tiddler='SiteSubtitle'&gt;&lt;/span&gt;
&lt;/div&gt;
&lt;div id='mainMenu' refresh='content' tiddler='MainMenu'&gt;&lt;/div&gt;
&lt;div id='sidebar'&gt;
&lt;div id='sidebarOptions' refresh='content' tiddler='SideBarOptions'&gt;&lt;/div&gt;
&lt;div id='sidebarTabs' refresh='content' force='true' tiddler='SideBarTabs'&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;div id='displayArea'&gt;
&lt;div id='messageArea'&gt;&lt;/div&gt;
&lt;div id='tiddlerDisplay'&gt;&lt;/div&gt;
&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="ViewTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='toolbar' macro='toolbar [[ToolbarCommands::ViewToolbar]]'&gt;&lt;/div&gt;
&lt;div class='title' macro='view title'&gt;&lt;/div&gt;
&lt;div class='subtitle'&gt;&lt;span macro='author'&gt;&lt;/span&gt;&lt;span macro='view modified date "DD MMM YYYY" ", "'&gt;&lt;/span&gt; &lt;span macro='history'&gt;&lt;/span&gt;&lt;/div&gt;
&lt;div class='tagging' macro='tagging'&gt;&lt;/div&gt;
&lt;div class='tagged' macro='tags'&gt;&lt;/div&gt;
&lt;div class='viewer' macro='view versions wikified'&gt;&lt;/div&gt;
&lt;div class='viewer' macro='view text wikified'&gt;&lt;/div&gt;
&lt;div class='tagClear'&gt;&lt;/div&gt;
&lt;hr/&gt;
&lt;div class='comments' macro='comments'&gt;&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="EditTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='toolbar' macro='toolbar [[ToolbarCommands::EditToolbar]]'&gt;&lt;/div&gt;
&lt;div class='title' macro='view title'&gt;&lt;/div&gt;
&lt;fieldset&gt;&lt;legend&gt;Title&lt;/legend&gt;&lt;div class='editor' macro='edit title'&gt;&lt;/div&gt;&lt;/fieldset&gt;
&lt;div macro='annotations'&gt;&lt;/div&gt;
&lt;fieldset&gt;&lt;legend&gt;Text&lt;/legend&gt;&lt;div class='editor' macro='edit text'&gt;&lt;/div&gt;
&lt;table style='width:100%;'&gt;&lt;tr&gt;&lt;td&gt;&lt;div class='commentToolbar' macro='toolbar [[ToolbarCommands::TextToolbar]]'&gt;&lt;/td&gt;&lt;td align='right'&gt;&lt;div class='toolbar' macro='toolbar [[ToolbarCommands::EditToolbar]]'&gt;&lt;/div&gt;&lt;/td&gt;&lt;/tr&gt;&lt;/table&gt; &lt;/fieldset&gt;
&lt;fieldset id='preview' style='display:none'&gt;&lt;legend&gt;Preview&lt;/legend&gt;&lt;div class='preview' &gt;&lt;/div&gt;&lt;/fieldset&gt;
&lt;fieldset id='tag' class='tagFrame'&gt;&lt;legend&gt;Tags&lt;/legend&gt;&lt;div class='editor' macro='edit tags'&gt;&lt;/div&gt;&lt;div class='editorFooter'&gt;&lt;span macro='message views.editor.tagPrompt'&gt;&lt;/span&gt;&lt;span macro='tagChooser'&gt;&lt;/span&gt;&lt;/div&gt;&lt;/fieldset&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="SpecialEditTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='editor' macro='edit text'&gt;&lt;/div&gt;
&lt;div class='commentToolbar' macro='toolbar [[ToolbarCommands::SpecialEditToolbar]]'&gt;&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="SpecialViewTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='viewer' macro='view text wikified'&gt;&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="SpecialViewTOTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='toolbar' macro='toolbar [[ToolbarCommands::MiniToolbar]]'&gt;&lt;/div&gt;
&lt;div class='title' macro='view title'&gt;&lt;/div&gt;
&lt;div class='viewer' macro='view text wikified'&gt;&lt;/div&gt;
&lt;div class='tagClear'&gt;&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="ViewOnlyTemplate">
<pre>&lt;!--{{{--&gt;
&lt;div class='toolbar' macro='toolbar [[ToolbarCommands::MiniToolbar]]'&gt;&lt;/div&gt;
&lt;div class='viewer' macro='view text wikified'&gt;&lt;/div&gt;
&lt;div class='tagClear'&gt;&lt;/div&gt;
&lt;!--}}}--&gt;
</pre>
</div>
<div title="UserProfile" viewTemplate="ViewOnlyTemplate">
<pre>
&lt;script&gt;forms.UserProfile = http.userProfile();&lt;/script&gt;
|My pen name&lt;br&gt;&lt;&lt;input txtUserName text 50&gt;&gt;|
|About me (displayed as a tooltip)&lt;br&gt;&lt;&lt;input aboutme textarea 5*50&gt;&gt;|
|Email address for receiving messages&lt;br&gt;&lt;&lt;input txtEmail text 50&gt;&gt;|
|When my pen name is clicked, display this page or tiddler (/path#title)&lt;br&gt;&lt;&lt;input tiddler text 55&gt;&gt; &lt;script label=&quot;Display&quot; title=&quot;Display tiddler now&quot;&gt;DisplayNonLocalTiddler(null,forms.UserProfile.tiddler);&lt;/script&gt;|
|My projects&lt;br&gt; &lt;&lt;myprojects&gt;&gt;&lt;&lt;input newproject text 55&gt;&gt; &lt;script if=&quot;config.project == ''&quot; label=&quot;Add&quot; title=&quot;Add project&quot;&gt;var n = 'newproject'; if (config.macros.input.showField(n)) { if (ConfirmIfMessage(http.addProject({'domain': forms.UserProfile.newproject}))) if (http.addProject({'domain': forms.UserProfile.newproject, 'confirmed': true}).Success) story.refreshTiddler("UserProfile",null,true)} else config.macros.input.showField(n,true);&lt;/script&gt;&lt;br&gt;|
|&lt;script label=&quot;Save&quot; title=&quot;Save&quot;&gt;OnCommitCloseForm("UserProfile",http.userProfile(forms.UserProfile));&lt;/script&gt;|
&lt;script&gt;config.macros.input.showField('newproject',false);&lt;/script&gt;
</pre>
</div>
<div title="UserMenu">
<pre>
macro|login|
macro|logout|
tiddler|UserProfile|my profile|Edit my profile|
link|/_ah/admin|DataStore|config.admin
</pre>
</div>
<div title="PageSetup" viewTemplate="SpecialViewTOTemplate">
<pre>
&lt;&lt;tabs chkPageSetup
'PageProperties' 'Title, access, template/includes' 'js;editTiddlerHere;PageProperties;SpecialViewTemplate'
'MainMenu' 'The left column' 'js;editTiddlerHere;MainMenu'
'DefaultTiddlers' 'Middle column initial content' 'js;editTiddlerHere;DefaultTiddlers'
'ColorPalette' 'Color palette' 'js;editTiddlerHere;ColorPalette'
'StyleSheet' 'Custom styles' 'js;editTiddlerHere;StyleSheet'
'All..' 'Other special tiddlers' 'js;editTiddlerHere;SpecialTiddlers;SpecialViewTemplate'
&gt;&gt;
!Common tweaks
* &lt;script label=&quot;Remove&quot;&gt;CommonTasks.RemoveText('[[PageSetup]]\n','MainMenu')&amp;&amp;CommonTasks.RemoveThisLi()&lt;/script&gt; PageSetup from MainMenu (it is available from the editing menu).
* &lt;script label=&quot;Remove&quot;&gt;CommonTasks.RemoveText('[[PageSetup]]','DefaultTiddlers')&amp;&amp;CommonTasks.RemoveThisLi()&lt;/script&gt; PageSetup from DefaultTiddlers.
</pre>
</div>
<div title="EditingMenu">
<pre>
macro|newTiddler|
macro|newJournal|"DD MMM YYYY" "journal"
tiddler|CreateNewPage|new page|Create new page|p
tiddler|UploadDialog|upload file|Upload a local file|u
tiddler|PageSetup|page setup|Edit page properties and presentation|p
tiddler|File list|file list|list of uploaded files|f
tiddler|Recycle bin|recycle bin|List of 'deleted' tiddlers|r
</pre>
</div>
<div title="File list" viewTemplate="SpecialViewTOTemplate">
<pre>
&lt;&lt;fileList&gt;&gt;
</pre>
</div>
<div title="Recycle bin"  viewTemplate="SpecialViewTOTemplate">
<pre>
&lt;&lt;recycleBin *&gt;&gt;
</pre>
</div>
<div title="OptionsPanel">
<pre>
These options are saved in your profile
&lt;&lt;option chkRegExpSearch&gt;&gt; RegExpSearch
&lt;&lt;option chkCaseSensitiveSearch&gt;&gt; CaseSensitiveSearch
&lt;&lt;option chkAnimate&gt;&gt; EnableAnimations

See also the AdvancedOptions
----
&lt;&lt;downloadAsTiddlyWiki&gt;&gt;
</pre>
</div>
<div title="LoginDialog" viewTemplate="ViewOnlyTemplate">
	<pre>&lt;&lt;loginDialog&gt;&gt;</pre>
</div>
<div title="SiteMap" viewTemplate="ViewOnlyTemplate">
	<pre>&lt;&lt;siteMap&gt;&gt;</pre>
</div>
<div title="RecentChanges" viewTemplate="ViewOnlyTemplate">
  <pre>&lt;html&gt;&lt;div class='title'&gt;Recent changes&lt;/div&gt;&lt;/html&gt;
&lt;&lt;recentChanges&gt;&gt;</pre>
</div>
<div title="RecentComments" viewTemplate="ViewOnlyTemplate">
  <pre>&lt;html&gt;&lt;div class='title'&gt;Recent comments&lt;/div&gt;&lt;/html&gt;
&lt;&lt;recentComments&gt;&gt;</pre>
</div>
<div title="UploadDialog" viewTemplate="ViewOnlyTemplate">
	<pre>&lt;&lt;uploadDialog&gt;&gt;</pre>
</div>
<div title="CreateNewPage" viewTemplate="ViewOnlyTemplate">
    <pre>&lt;script&gt;accessTypes = &quot;all|edit|add|comment|view|none|&quot;
var fn = formName(place);
forms[fn] = http.createPage({defaults:"get"});
if (fn != "CreateNewPage") {
	forms[fn].title = fn;
	forms[fn].address = CheckNewAddress(fn);
	}
forms[fn].title_changed = function(f,id,v) { f.title = v; setFormFieldValue(f,"address",CheckNewAddress(v)); }
;&lt;/script&gt;&lt;html&gt;&lt;div class='title'&gt;Create new page&lt;/div&gt;&lt;/html&gt;
|&gt;|&gt;|Title&lt;br&gt;&lt;&lt;input text title 70&gt;&gt;|
|&gt;|&gt;|Subtitle&lt;br&gt;&lt;&lt;input text subtitle 70&gt;&gt;|
|&gt;|&gt;|Address (end with a / to make a folder)&lt;br&gt;&lt;&lt;input text address 70&gt;&gt;|
|&gt;|&gt;|Access permissions|
|Group&lt;br&gt;&lt;&lt;input select group javascript:accessTypes&gt;&gt;|Authenticated&lt;br&gt;&lt;&lt;input select authenticated javascript:accessTypes&gt;&gt;|Anonymous&lt;br&gt;&lt;&lt;input select anonymous &quot;javascript:accessTypes&quot;&gt;&gt;|
|&gt;|&gt;|&lt;script label=&quot;Create new page&quot; title=&quot;Create new page&quot;&gt;OnCreatePage(http.createPage(GetForm(place)));&lt;/script&gt;&lt;script&gt;forms.CreateNewPage.controls['title'].focus();&lt;/script&gt;|</pre>
</div>
<div title="DefineGroup" >
<pre>
	&lt;script&gt;
var fn = formName(place);
listOfAllGroups = http.getGroups();
if (!listOfAllGroups.length)
	listOfAllGroups[0] = "(none defined)";
else
	listOfAllGroups.unshift("Select...");
listOfAllGroups = listOfAllGroups.join('|');
forms[fn] = { 'updateaccess': true };
	&lt;/script&gt;
|Group&lt;br&gt;&lt;&lt;input select groupname javascript:listOfAllGroups "" ListGroupMembers()&gt;&gt;|New group&lt;br&gt;&lt;&lt;input text name 36&gt;&gt; &lt;script label=&quot;Create&quot; title=&quot;Create group&quot;&gt;OnCreateGroup(http.createGroup(forms.DefineGroup));&lt;/script&gt;|
|Members:|&lt;html&gt;&lt;div id="groupMemberList"&gt;&lt;/html&gt;|
||&gt;|Add user as member&lt;br&gt;&lt;&lt;input text user 36&gt;&gt; &lt;script label=&quot;Add&quot; title=&quot;Add user&quot;&gt;OnAddMember(http.addGroupMember(forms.DefineGroup));&lt;/script&gt;|

</pre>
</div>
<xsl:for-each select="document/shadowArea/div">
	<xsl:copy-of select="."/>
</xsl:for-each>
</div>
	<div id="storeArea">
		<xsl:for-each select="document/storeArea/div">
			<xsl:copy-of select="."/>
		</xsl:for-each>
	</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>