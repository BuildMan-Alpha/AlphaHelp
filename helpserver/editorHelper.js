
function usage() {
	console.log("Usage: node.exe editorHelp.js -in=\"in.html\" -out=\"out.html\"");
}

var args = {};

for (var arg of process.argv) {
	var result = /[-\/](?<argName>.*)[=](?<argValue>.*)/.exec(arg);
	if (result !== undefined && result !== null) {
		args[result.groups.argName.toLowerCase()] = result.groups.argValue;
		continue;
	}  
}

if (args.in === undefined || args.in === null) {
	console.log("-in=file needs to be specified on the command line.");
	usage();
	process.exit(1);
} 
if (args.out === undefined || args.out === null) {
	console.log("-out=file needs to be specified on the command line.");
	usage();
	process.exit(2);
} 

var path = require("path");
var aliasesFile = path.resolve(process.argv[1], "../../aliases.json");

var aliases = {};

var events = {};
events.lookupLink = function(indexLinks, symName) {
	if (indexLinks && symName) {
		var indexVal = symName.toLowerCase();
		var val = indexLinks[indexVal];
		if (!val) {
			// lookup in aliases
			indexVal = aliases[indexVal];
			if (indexVal) {
				val = indexLinks[indexVal];
			}
		}
		return val;
	}
	return null;
};

var options = require("./settingsnosearch");
options.events = events;
var pe = require("./pe");
var fs = require("fs")
var Help = require('helpserver');
var help = Help(options);

var jsonData = fs.readFileSync(aliasesFile, "utf8");
var hashObj = {};
var srcObj = null;
try {
	srcObj = JSON.parse(data);
} catch (err) {
	console.log("Error parsing aliases.json " + err);
}
if (srcObj) {
	aliases = srcObj;
}

var inHtml = fs.readFileSync(args.in).toString();
var outHtml;

outHtml = pe.postProcessContent(inHtml, "", help, aliases);

fs.writeFileSync(args.out, outHtml);

process.exit(0);
