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

var totalFiles = 0;
var logNoTopic = false;
var filter = "[^a-z0-9 _]";

var beginMessage = "Generating list of files that contain shortlinks with characters that are not spaces, letters, numbers, or underscores..."
for (arg in process.argv) {
    if (process.argv[arg].search("-filter") !== -1 || process.argv[arg].search("-f") !== -1) {
        filter = process.argv[arg].split("=")[1];
        beginMessage = "Generating list of files that contain the following characters in the shortlink: " + filter;
        filter = "[" + filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "]";
    }
    if (process.argv[arg].search("-logMissing") !== -1 || process.argv[arg].search("-l") !== -1) {
        beginMessage = "Generating list of files with no shortlink or topic tag..."
        logNoTopic = true;
    }
    if (process.argv[arg].search("-help") !== -1 || process.argv[arg].search("-h") !== -1) {
        console.log("Help for listBannedTopicPages.js");
        console.log("=================================================================================");
        console.log("Input Flags:\n");
        console.log("-filter=charList, -f=charList      If specified, lists files that contain one or ");
        console.log("                                   more of the specified characters.")
        console.log("-logMissing, -l                    Only list files with no topic or shortlink");
        console.log("-help -h                           Displays this help message.\n");
        console.log("=================================================================================");
        console.log("Examples:\n");
        console.log("### List all files containing an '@' character:");
        console.log('> node listBannedTopicPages.js -f=@\n');
        console.log("### List only files that have no topic or shortlink:");
        console.log("> node listBannedTopicPages.js -l")
        return;
    }
}

console.log(beginMessage);

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

var regex = new RegExp(filter, "gi");

var containsNoSpecialChar = function (str) {
    var matcher = str.toLowerCase();
    matcher = matcher;
    return matcher.match(regex) === null;
}

async.eachSeries(list, function (fo, callbackLoop) {
    fo.file = fo.file.replace("/home/AlphaHelp/", "/dev/AlphaHelp/");
    if (fo.file.toLowerCase().indexOf('.xml') > 0 || fo.file.toLowerCase().indexOf('.html') > 0) {
        fs.readFile(fo.file, "utf8", function (err, page) {
            if (!err) {
                var topic = null;
                if (fo.file.toLowerCase().indexOf('.xml') > 0) {
                    topic = removeCDATA(extractTag(page, "<shortlink>", "</shortlink>").trim());
                    if (topic.length === 0) {
                        topic = removeCDATA(extractTag(page, "<topic>", "</topic>").trim());
                    }
                } else {
                    var metatags = page.split("<meta");
                    var i;
                    for (i = 1; i < metatags.length; ++i) {
                        var metatag = metatags[i].split(">")[0];
                        if (metatag.replace(" ", "").indexOf('name="shortlink"') > 0) {
                            if (metatag.indexOf('content=') > 0) {
                                metatag = metatag.split('content=')[1].trim();
                                var metatags = metatag.split(metatag.substring(0, 1));
                                if (metatags.length > 2) {
                                    topic = metatags[1];
                                    break;
                                }
                            }
                        }
                    }
                    if (!topic) {
                        topic = extractTag(page, "<title>", "</title>").trim();
                        if (!topic) {
                            topic = "";
                        }
                    }
                }

                var pathName = fo.file.split("\\").join("/").split("/helpfiles/")[1];
                if (logNoTopic) {
                    if (topic.length === 0) {
                        totalFiles++;
                        console.log(pathName);
                    }
                } else {
                    if (containsNoSpecialChar(topic) === false) {
                        totalFiles++;
                        console.log(topic + "\t File: " + pathName);
                    }
                }
            }
            callbackLoop();
        });
    } else {
        callbackLoop();
    }
}, function () {
    console.log("\n");
    console.log("================================");
    console.log("Process complete.");
    console.log(totalFiles + " files found.");
    console.log("================================");
});
