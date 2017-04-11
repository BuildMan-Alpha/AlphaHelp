// collect all the XML files, read all the topics, create missing 'link' definitions
/* global indexOf */
/* global substring */
var fs = require('fs');
var pathModule = require('path');
var files = fs.readFileSync("../generated/list.json", "utf8");
var list = JSON.parse(files);
var async = require('async');
var secondaryLinks = {};

var links = {}, link;
var usedNames = {};
for (link in links) {
    usedNames[link.toLowerCase()] = links[link];
}
var extractTag = function (page, startTag, endTag) {
    var tagStart = page.indexOf(startTag);
    if (tagStart > 0) {
        page = page.substring(tagStart + startTag.length);
        var tagEnd = page.indexOf(endTag);
        if (tagEnd > 0) {
            return page.substring(0, tagEnd);
        }
    }
    return "";
};

var removeCDATA = function (str) {
    if (str.substring(0, 9) === "<![CDATA[") {
        str = str.substring(9).split("]]>")[0].trim();
    }
    return str;    
}

var containsNoSpecialChar = function (str) {
    // The following characters are banned from shortlinks
    return str.match(/[\+%&()<>?$*]/g) === null;
}

async.eachSeries(list, function (fo, callbackLoop) {
    fo.file = fo.file.replace("/home/AlphaHelp/", "/dev/AlphaHelp/");
    if (fo.file.toLowerCase().indexOf('.xml') > 0 || fo.file.toLowerCase().indexOf('.html') > 0) {
        fs.readFile(fo.file, "utf8", function (err, page) {
            if (!err) {
                var topic = null;
                if (fo.file.toLowerCase().indexOf('.xml') > 0) {
                    topic = removeCDATA(extractTag(page, "<shortlink>", "</shortlink>").trim()).toLowerCase();
                    if (topic.length === 0) {
                        topic = removeCDATA(extractTag(page, "<topic>", "</topic>").trim()).toLowerCase();
                    } else {
                        var secondarytopic = removeCDATA(extractTag(page, "<topic>", "</topic>").trim());
                        if (secondarytopic.length !== 0) {
                            secondarytopic = secondarytopic.toLowerCase();
                            if (secondarytopic !== topic.toLowerCase() && containsNoSpecialChar(secondarytopic)) {
                                if (!secondaryLinks[secondarytopic]) {
                                    secondaryLinks[secondarytopic] = "/pages/" + fo.file.split("\\").join("/").split("/helpfiles/")[1];
                                }
                            }
                        }
                    }
                } else {
                    var metatags = page.split("<meta");
                    var i;
                    for (i = 1; i < metatags.length; ++i) {
                        var metatag = metatags[i].split(">")[0];
                        if (metatag.replace(" ", "").indexOf('name="shortlink"') >= 0) {
                            if (metatag.indexOf('content=') > 0) {
                                metatag = metatag.split('content=')[1].trim();
                                var metatags = metatag.split(metatag.substring(0, 1));
                                if (metatags.length > 2) {
                                    topic = metatags[1].toLowerCase();
                                    break;
                                }
                            }
                        }
                    }
                    if (!topic) {
                        topic = extractTag(page, "<title>", "</title>").trim().toLowerCase();
                        if (!topic) {
                            console.log("Warning no title or shortlink defined for " + fo.file);
                            topic = "";
                        }
                    }
                }
                var pathName = "/pages/" + fo.file.split("\\").join("/").split("/helpfiles/")[1];
                if (topic.length > 0 && containsNoSpecialChar(topic)) {
                    topic = removeCDATA(topic).toLowerCase();
                    var usedName = usedNames[topic];
                    if (usedName) {
                        if (usedName !== pathName) {
                            var replacePage = false;
                            if (usedName.substring(0, 7) === "/pages/") {
                                replacePage = true;
                                usedName = usedName.substring(6).toLowerCase();
                                for (var i = 0; i < list.length; ++i) {
                                    if (list[i].file.toLowerCase().indexOf(usedName) >= 0) {
                                        replacePage = false;
                                        break;
                                    }
                                }
                            }
                            console.log("Duplicate symbol " + topic + " path " + pathName + " old key = " + usedName);
                        }
                    } else {
                        usedNames[topic.toLowerCase()] = pathName;
                        links[topic] = pathName;
                    }
                } else {
                    if (topic.length === 0) {
                        console.log("No topic for " + pathName);
                    } else if (containsNoSpecialChar(topic) === false) {
                        console.log("Topic for " + pathName + " contains banned symbols: " + topic);
                    }
                }
            }
            callbackLoop();
        });
    } else {
        callbackLoop();
    }
}, function () {
    // Add unused secondary links
    var secondaryLink;
    for(secondaryLink in secondaryLinks) {
        if( !links[secondaryLink] ) {
            links[secondaryLink] = secondaryLinks[secondaryLink];
        }
    }
    // Write the changes...
    fs.writeFile("../links.json", JSON.stringify(links, null, "  "), function (errW) {
        if (errW) {
            console.log("Err writing links " + errW);
        } else {
            console.log("links updated");
        }
    });
});
