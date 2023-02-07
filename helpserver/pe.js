
var buildClasses = require("./builds.json");

function postProcessContent(data, basepath, help,aliases) {
	basepath = basepath || "/documentation/";
	if (data.indexOf('class="buildBadge" data-build="') > 0) {
		// Lets change build badge entries on the fly...
		var replaceBuilds = data.split('class="buildBadge" data-build="');
		var i, j, buildNumber, isPrerelease;
		for (i = 1; i < replaceBuilds.length; ++i) {
			buildNumber = parseInt(replaceBuilds[i].split('"')[0]);
			isPrerelease = true;
			for (j = 0; j < buildClasses.length; ++j) {
				if (buildNumber <= buildClasses[j].upto) {
					data = data.split('class="buildBadge" data-build="' + buildNumber + '"').join('class="versionTag ' + buildClasses[j].version + '"');
					isPrerelease = false;
					break;
				}
			}
			if (isPrerelease) {
				data = data.split('class="buildBadge" data-build="' + buildNumber + '"').join('class="versionTagPrerelease"');
				isPrerelease = false;
			}
		}
	}
	if (data.indexOf("*[")) {
		var metaDescriptionPos = data.indexOf('<meta name="description"');
		if (metaDescriptionPos >= 0) {
			var contentSearch = 'content="' + data.substring(metaDescriptionPos).split('"')[3] + '"';
			var contentReplace = contentSearch.split("*[").join("").split("]*").join();
			if (contentSearch != contentReplace) {
				data = data.split(contentSearch).join(contentReplace);
			}
		}
		var items = data.split("*[");
		var i;
		var newData = items[0];
		for (i = 1; i < items.length; ++i) {
			var emph = items[i];
			var endPos = emph.indexOf(']*');
			if (endPos > 0) {
				var remainder = emph.substring(endPos + 2);
				emph = emph.substring(0, endPos);
				var typeSeparator = emph.indexOf(':');
				var snippet = "<b>" + emph + "</b>";
				if (typeSeparator > 0) {
					var implicitType = false;
					var typeName = emph.substring(0, typeSeparator);
					if (typeName.indexOf(' ') < 0) {
						if (typeName == 'http' || typeName == 'https' || typeName == 'ftp' || typeName == 'ftps') {
							typeName = "link"; // implicit link....
							implicitType = true;
						} else {
							emph = emph.substring(typeSeparator + 1);
						}
						snippet = '<span class="emphasize-' + typeName + '">' + emph + "</span>";
						if (typeName == "link" || typeName == 'download' || typeName == 'video' || typeName == 'extlink') {
							var isURI = function(sample) {
								var uriParts = sample.split(':');
								if (uriParts.length > 1) {
									if (uriParts[0] == 'http' || uriParts[0] == 'https' || uriParts[0] == 'ftp' || uriParts[0] == 'ftps') {
										return true;
									}
								}
								return false;
							}
							var linkdef = emph;
							var atSignPos = linkdef.indexOf("@");
							if (atSignPos > 0) {
								if (linkdef.substring(0, 7) != "mailto:") {
									linkdef = linkdef.substring(atSignPos + 1);
									if (linkdef) {
										if (!isURI(linkdef)) {
											var newlinkdef = help.lookupLink(linkdef);
											if (newlinkdef || implicitType) {
												//console.log("Set linkdef to "+newlinkdef);
												linkdef = newlinkdef;
											}
										}
										if (linkdef) {
											emph = emph.substring(0, atSignPos);
										}
									}
								}
							} else {
								var lookupurl = null;
								lookupurl = help.lookupLink(linkdef);
								if (!lookupurl && linkdef) {
									// do alias lookup here
									lookupurl = aliases[linkdef.toLowerCase()];
									if (lookupurl) {
										lookupurl = help.lookupLink(lookupurl);
									}
								}
								linkdef = lookupurl;
							}
							if (!linkdef) { // If no symbolic match, lets see if we have a symbolic value
								if (isURI(emph)) {
									linkdef = emph;
								}
							}
							if (linkdef) {
								if (linkdef.substring(0, 1) == '/') {
									if (linkdef.substring(0, 15) != basepath) {
										linkdef = basepath + linkdef.substr(1);
									}
								}
								if (typeName == "link") {
									snippet = '<a href="' + linkdef + '">' + emph + "</a>";
								} else if (typeName == "extlink") {
									snippet = '<a href="' + linkdef + '" target="_blank" >' + emph + "</a>";
								} else {
									snippet = '<a href="' + linkdef + '" target="_blank" class="emphasize-' + typeName + '">' + emph + "</a>";
								}
							}
						}
					}
				}
				newData += snippet + remainder;
			} else if (emph.length > 0 || (i + 1) >= items.length) {
				newData += "*[" + emph;
			} else {
				++i;
				newData += "*[" + emph + items[i];
			}
		}
		data = newData;
	}
	return data;
}
	
module.exports.postProcessContent = postProcessContent;