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
var aliases = {};
var duplicates = [];
var usedNames = {};
for (link in links) {
    usedNames[link.toLowerCase()] = links[link];
}

var extractTagRegex = function (page, tag) {
    var startTag = new RegExp('<'+tag+'[^>]*>');
    var endTag = new RegExp('</'+tag+'>');
    var temp = page;
    var tagStart = temp.search(startTag);
    if (tagStart > 0) {
        temp = temp.split(startTag)[1];
        var tagEnd = temp.search(endTag);
        if (tagEnd > 0) {
            temp = temp.split(endTag)[0];
            return temp;
        }
    }
    return "";
}

/*
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
*/

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
                var pageTopic = null;
                var pageShortlink = null;
                var topic = null;
                if (fo.file.toLowerCase().indexOf('.xml') > 0) {
                    pageShortlink = removeCDATA(extractTagRegex(page,"shortlink").trim()).toLowerCase();
                    pageTopic = removeCDATA(extractTagRegex(page, "topic").trim()).toLowerCase();
                    topic = pageShortlink;
                    if (topic.length === 0) {
                        topic = pageTopic;
                    } else {
                        // Secondary Topic is replaced with aliases
                        // var secondarytopic = pageTopic;
                        // if (secondarytopic.length !== 0) {
                        //     secondarytopic = secondarytopic.toLowerCase();
                        //     if (secondarytopic !== topic.toLowerCase() && containsNoSpecialChar(secondarytopic)) {
                        //         if (!secondaryLinks[secondarytopic]) {
                        //             secondaryLinks[secondarytopic] = "/pages/" + fo.file.split("\\").join("/").split("/helpfiles/")[1];
                        //         }
                        //     }
                        // }
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
                                    pageShortlink = metatags[1].toLowerCase();
                                    topic = pageShortlink;
                                    break;
                                }
                            }
                        }
                    }
                    pageTopic = extractTagRegex(page,"title").trim().toLowerCase();
                    if (!topic) {
                        topic = pageTopic
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
                            if (duplicates.indexOf(topic) === -1) {
                                duplicates.push(topic);
                            }
                            console.log("Duplicate symbol " + topic + " path " + pathName + " old key = " + usedName);
                        }
                    } else {
                        usedNames[topic.toLowerCase()] = pathName;
                        links[topic] = pathName;
                        aliases[pageTopic.toLowerCase()] = topic.toLowerCase();
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
    // var secondaryLink;
    // for(secondaryLink in secondaryLinks) {
    //     if( !links[secondaryLink] ) {
    //         links[secondaryLink] = secondaryLinks[secondaryLink];
    //     }
    // }

    // Remove duplicates from aliases:
    for (var i = 0; i < duplicates.length; i++) {
        var lookup = duplicates[i];
        delete aliases[lookup];
    }
    // Write the changes...
    fs.writeFile("../links.json", JSON.stringify(links, null, "  "), function (errW) {
        if (errW) {
            console.log("Error writing links " + errW);
        } else {
            console.log("links updated");
        }
    });

    fs.writeFile("../aliases.json", JSON.stringify(aliases, null, "  "), function (errW) {
        if (errW) {
            console.log("Error writing aliases " + errW);
        } else {
            console.log("aliases updated");
        }
    })
});
