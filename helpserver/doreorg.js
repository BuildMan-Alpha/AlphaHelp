// Do the reorg (using the reorg files provided)
var fs = require('fs');
var replaceAll = function (str, find, replace) {
	while (str.indexOf(find) >= 0)
		str = str.replace(find, replace);
	return str;
};
var copyFile = function (fn, data, callback) {
	var subFolders = fn.split('/');
	var i;
	var fullPath = "/dev/AlphaHelp/reorg";
	for( i  = 0 ; i < subFolders.length-1 ; ++i ) {
		if( subFolders[i] != '' ) {
			fullPath += '/'+subFolders[i];
			if (!fs.existsSync(fullPath)) {
				fs.mkdirSync(fullPath);
			}
		}
	}
	fs.writeFileSync(fullPath+"/"+subFolders[subFolders.length-1],data);	
	callback();
};

if (!fs.existsSync("/dev/AlphaHelp/reorg")) {
	fs.mkdirSync("/dev/AlphaHelp/reorg");
}

fs.readFile("/dev/AlphaHelp/generated/reorg.json", "utf8", function (err, data) {
	if (err) {
		console.log("Error " + err);
	} else {
		var files = JSON.parse(data);
		var async = require('async');
		async.eachSeries(files, function (file, callbackLoop) {
			var srcFile = file.from;
			var extnPos = srcFile.lastIndexOf('.');
			if (extnPos > 0) {
				var extn = srcFile.substring(extnPos).toLowerCase();
				if (extn == ".html") {
					fs.readFile("/dev/AlphaHelp/helpfiles" + srcFile, "utf8", function (err, html) {
						var jsonFile =  replaceAll(srcFile.substring(0, extnPos), "/", "_") + ".json";
						fs.readFile("/dev/AlphaHelp/generated/fixup/" + jsonFile, "utf8", function (err, jdata) {
							if (!err) {
								// Lets restructure the links...
								var obj = JSON.parse(jdata);
								if( obj.href ) {
									var htmlparser = require("htmlparser2");
									var href = [];
									var parser = new htmlparser.Parser({
										onopentag: function (name, attribs) {
											if (name === "a" && attribs.href) {
												if (attribs.href.substring(0, 1) == '#') {
													;
												} else if (attribs.href.substring(0, 5) == 'http:') {
													;
												} else if (attribs.href.substring(0, 6) == 'https:') {
													;
												} else if (attribs.href.substr(0, 11) != 'javascript:') {
													if( attribs.href.length > 1 )
														href.push(attribs.href);
												}
											}
										},
										ontext: function (text) {
										},
										onclosetag: function (name) {
										}
									});
									parser.write(html);
									parser.end();
									var i , j;
									for( i = 0; i < href.length ; ++i ) {
										var cleanHref = href[i].toLowerCase();
										var cleanHrefPath = cleanHref.lastIndexOf('/');
										if( cleanHrefPath >= 0 ) {
											cleanHref = cleanHref.substring(cleanHrefPath+1);
										}
										for( j = 0; j < obj.href.length ; ++j ) {
											cleanHref = cleanHref.substring(cleanHrefPath+1);
											if( obj.href[j].from.toLowerCase().indexOf( cleanHref ) >= 0 ) {
												var basePath = file.to.substring(0,file.to.lastIndexOf('/')+1).toLowerCase();
												var newHREF = obj.href[j].to;
												var pathPrefix  = "";
												while( basePath.length > 1 ) {
													if( newHREF.substring(0,basePath.length).toLowerCase() == basePath ) {
												        newHREF = pathPrefix+newHREF.substring(basePath.length);
														break;
													}
													if( basePath.length < 2 )
														break;
													basePath = basePath.substring(0,basePath.length-2); // Eat trailing '/'
													if( basePath.lastIndexOf('/') < 0 )
														break;
													basePath = basePath.substring(0,basePath.lastIndexOf('/')+1); // back up to prior '/'
													pathPrefix = pathPrefix + "../";
												}
												if( href[i] != newHREF ) {
													html = replaceAll( html , '"'+href[i]+'"' , '<[(IMGPLACE)]>' );
													html = replaceAll( html , "<[(IMGPLACE)]>" , '"'+newHREF+'"' );
													console.log('replaced '+ href[i] +" with " + newHREF );
												}												
												break;
											}
										}	
									}									
								}
							}
							copyFile( file.to, html, function () {
								callbackLoop();
							});
						});
					});
				} else {
					fs.readFile("/dev/AlphaHelp/helpfiles" + srcFile, function (err, data) {
						copyFile( file.to, data, function () {
							callbackLoop();
						});
					});
				}
			}
		},function() {
			console.log("Completed processing");
		});
	}
});
