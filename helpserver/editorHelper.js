
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

var pe = require("./pe");
var fs = require("fs")

var inHtml = fs.readFileSync(args.in).toString();
var outHtml;

outHtml = pe.postProcessContent(inHtml, "");

fs.writeFileSync(args.out, outHtml);

process.exit(0);
