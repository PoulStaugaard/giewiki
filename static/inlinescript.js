/***
Name:	InlineJavascriptPlugin  (http:./inlinescript.htm)
Source:	http://www.TiddlyTools.com/#InlineJavascriptPlugin
Author:	Eric Shulman - ELS Design Studios (http://www.elsdesign.com)
License:Creative Commons Attribution-ShareAlike 2.5 License (http://creativecommons.org/licenses/by-sa/2.5/)
 ***/
 
version.extensions.inlineJavascript= {major: 1, minor: 6, revision: 0, date: new Date(2007,2,19)};

config.formatters.push( {
	name: "inlineJavascript",
	match: "\\<script",
	lookahead: "\\<script(?: src=\\\"((?:.|\\n)*?)\\\")?(?: label=\\\"((?:.|\\n)*?)\\\")?(?: title=\\\"((?:.|\\n)*?)\\\")?( show)?\\>((?:.|\\n)*?)\\</script\\>",

	handler: function(w) {
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) {
			if (lookaheadMatch[1]) { // load a script library
				// make script tag, set src, add to body to execute, then remove for cleanup
				var script = document.createElement("script"); script.src = lookaheadMatch[1];
				document.body.appendChild(script); document.body.removeChild(script);
			}
			if (lookaheadMatch[5]) { // there is script code
				if (lookaheadMatch[4]) // show inline script code in tiddler output
					wikify("{{{\n"+lookaheadMatch[0]+"\n}}}\n",w.output);
				if (lookaheadMatch[2]) { // create a link to an 'onclick' script
					// add a link, define click handler, save code in link (pass 'place'), set link attributes
					var link=createTiddlyElement(w.output,"a",null,"tiddlyLinkExisting",lookaheadMatch[2]);
					link.onclick=function(){try{return(eval(this.code))}catch(e){alert(e.description?e.description:e.toString())}}
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
} )
