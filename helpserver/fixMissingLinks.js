/* global indexOf */
/* global substring */
var fs = require('fs');
var pathModule = require('path');
var files = fs.readFileSync("c:/data/files.json", "utf8");
var list = JSON.parse(files);
var async = require('async');
var querystring = require("querystring");

// Look for an href
var ResolveLink = function (href, fromPath) {
    if (href.indexOf("://") < 0
        && href.substring(0, 1) != '#'
        && href != ';'
        && href.indexOf("theme.css") < 0
        && href.indexOf("javascript:void(0)") < 0
        ) {
        var location = fromPath.substring(0, fromPath.lastIndexOf('/'));
        if (location == "") {
            location = "/";
        }

        var resolveLink = pathModule.resolve(location, href);
        resolveLink = resolveLink.split('#')[0];
        var pathAndArg = resolveLink.split('?');
        if (pathAndArg.length > 1) {
            var lowLink = resolveLink.toLowerCase();
            if (lowLink.indexOf("tiki-index.php") >= 0
                || lowLink.indexOf("tiki-editpage.php") >= 0
                ) {
                var pageArg = pathAndArg[1].split("page=");
                if (pageArg.length > 1) {
                    resolveLink = pathModule.resolve(location, decodeURI(pageArg[1])) + ".html";
                }
            } else {
                resolveLink = resolveLink[0];
            }
        }
        resolveLink = resolveLink.split('\\').join('/');
        resolveLink = resolveLink.substring(resolveLink.indexOf('/'));
        if (resolveLink.indexOf('%') >= 0 || resolveLink.indexOf('&') >= 0 || resolveLink.indexOf('+') >= 0) {
            try {
                resolveLink = decodeURI(resolveLink);
            } catch (err) {
                ;
            }
        }
        var i;
        var lowLink = resolveLink.toLowerCase();
        var lowName = lowLink.substring(lowLink.lastIndexOf('/')).split('.');
        if (lowName.length > 1) {
            lowName[lowName.length - 1] = "";
        }
        lowName = lowName.join('.');
        var rename = null;
        var found = false;
        var samename = [];
        for (i = 0; i < list.length; ++i) {
            var test = list[i];
            if (test == resolveLink) {
                found = true;
                break;
            } else {
                test = test.toLowerCase();
                if (test == lowLink) {
                    rename = list[i];
                    found = true;
                    break;
                } else if (test.indexOf(lowName) >= 0) {
                    samename.push(list[i]);
                }
            }
        }
        if (!found) {
            if (samename.length > 1) {
                var newsamename = [];
                var lowParts = lowLink.split('/');
                var match = 2;
                while (lowParts.length >= match) {
                    var endTest = lowParts;
                    if (lowParts.length > match)
                        lowParts.splice(0, lowParts.length - match).join('/');
                    for (i = 0; i < samename.length; ++i) {
                        var testThisPath = samename[i].toLowerCase();
                        var test = testThisPath.split('/');
                        if (test.length >= match) {
                            if (test.length > match) {
                                testThisPath = test.splice(0, test.length - match).join('/');
                            }
                            if (testThisPath == endTest) {
                                newsamename.push(samename[i]);
                            }
                        }
                    }
                    if (newsamename.length > 0) {
                        samename = newsamename;
                        newsamename = [];
                        if (newsamename.length == 1)
                            break;
                    } else {
                        break;
                    }
                    ++match;
                }
            }
            if (samename.length == 1) {
                href = samename[0];
            } else if (samename.length > 1) {
                href = "/ambiguous_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath) + "&count=" + samename.length + "&link1=" + querystring.escape(samename[0]) + "&link2=" + querystring.escape(samename[1]);
                // Special case - html -> xml conversion, html version is still around
                if (samename.length == 2) {
                    var ext0 = samename[0].lastIndexOf('.');
                    var ext1 = samename[1].lastIndexOf('.');
                    if (ext0 > 0 && ext1 > 0) {
                        ext0 = samename[0].substring(ext0);
                        ext1 = samename[1].substring(ext1);
                        if (ext0 == '.xml' && ext1 == ".html") {
                            href = samename[0];
                        } else if (ext1 == '.xml' && ext0 == ".html") {
                            href = samename[1];
                        }
                    }
                }
            } else {
                href = "/unknown_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath);
            }
        }
    }
    return href;
};
// Look for closest reference (late lookup for new XML)
var ResolveClosestLink = function (text, fromPath) {
    var href = null;
    var samename = [];
    var hasFolderMatch = null;
    var lowRef = text.toLowerCase();
    var searchRef = function () {
        var i;
        var folderMatchs = [];
        for (i = 0; i < list.length; ++i) {
            var pos = list[i].toLowerCase().lastIndexOf(lowRef);
            if (pos >= 0) {
                var pathEndPos = list[i].lastIndexOf('/');
                if (pos >= pathEndPos) {
                    samename.push(list[i]);
                } else {
                    var indexFn = list[i].substring(pathEndPos + 1).toLowerCase();
                    var parentFolderName = list[i].split('/');
                    if (parentFolderName.length > 1) {
                        parentFolderName = parentFolderName[parentFolderName.length - 2];
                        if (parentFolderName.toLowerCase().lastIndexOf(lowRef) >= 0) {
                            if (indexFn == "index.xml" || indexFn == "index.html" || indexFn == "index.md") {
                                samename.push(list[i]);
                            } else {
                                var j;
                                var haveMatch = false;
                                var pathAdd = list[i].split('/');
                                pathAdd[pathAdd.length - 1] = "index.xml";
                                pathAdd = pathAdd.join('/');
                                for (j = 0; j < folderMatchs.length; ++j) {
                                    if (folderMatchs[j].toLowerCase() == pathAdd.toLowerCase()) {
                                        haveMatch = true;
                                        break;
                                    }
                                }
                                if (!haveMatch) {
                                    folderMatchs.push(pathAdd);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (samename.length == 0 && folderMatchs.length > 0) {
            samename = folderMatchs;
            hasFolderMatch = folderMatchs;
        } else if (!hasFolderMatch && folderMatchs.length > 0) {
            hasFolderMatch = folderMatchs;
        }
        return (samename.length == 1) || hasFolderMatch;
    };

    if (!searchRef()) {
        if (lowRef.indexOf('  ') >= 0) {
            lowRef = lowRef.split(' ');
            for (i = lowRef.length - 1; i >= 0; --i) {
                if (lowRef[i] == "") {
                    lowRef = lowRef.splice(i, 1);
                }
            }
            lowRef = lowRef.join(' ');
            if (!searchRef()) {
                if (lowRef.indexOf(' method') >= 0 || lowRef.indexOf(' function') >= 0
                    || lowRef.indexOf(' class') >= 0 || lowRef.indexOf(' namespace') >= 0
                    ) {
                    lowRef = lowRef.split(' ');
                    lowRef = lowRef.splice(lowRef.length - 1, 1);
                    lowRef = lowRef.join(' ');
                    searchRef();
                }
                if (lowRef.indexOf("()") > 0) {
                    lowRef = lowRef.split('()')[0];
                    searchRef();
                }
                if (!searchRef()) {
                    if (lowRef.indexOf('.') > 0) {
                        lowRef = lowRef.split('.');
                        lowRef[0] = "";
                        lowRef = lowRef.join('.');
                        searchRef();
                    }
                }
            }
        }
    }
    if (samename.length > 0) {
        if (samename.length != 1 && hasFolderMatch) {
            for (i = 0; i < hasFolderMatch.length; ++i) {
                if (fromPath.toLowerCase().indexOf(hasFolderMatch[i].replace('index.xml', '').toLowerCase()) == 0) {
                    var newsamename = [];
                    newsamename.push(hasFolderMatch[i]);
                    samename = newsamename;
                    break;
                }
            }
        }
        if (samename.length == 1) {
            href = samename[0];
            // else href = "/ambiguous_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath) + "&count=" + samename.length + "&link1=" + querystring.escape(samename[0]) + "&link2=" + querystring.escape(samename[1]);
        }
    }
    return href;
};



async.eachSeries(list, function (path, callbackLoop) {
    var filename = "/dev/AlphaHelp/helpfiles" + path;
    fs.readFile(filename, "utf8", function (err, data) {
        var extension = path.substring(path.lastIndexOf('.'));
        if (err) {
            console.log("Error " + err + " processing file " + path);
            callbackLoop();
        } else if (extension == ".xml") {
            // Look for XML links
            var changedData = data;
            var xmldoc = require('xmldoc');
            console.log("Process " + path);
            var document = null;
            try {
                document = new xmldoc.XmlDocument(data);
            } catch (err) {
                console.log("+Error:" + err);
            }
            if (document) {
                var expandReferences = function (node) {
                    var i;
                    if (node.name == "ref") {
                        if (node.attr.href) {
                            var newHref = ResolveLink(node.attr.href, path);
                            if (newHref != node.attr.href) {
                                var hrefPosition = changedData.indexOf("href=\"" + node.attr.href + "\"");
                                if (hrefPosition < 0)
                                    hrefPosition = changedData.indexOf("href='" + node.attr.href + "'");
                                if (hrefPosition > 0) {
                                    changedData = changedData.substring(0, hrefPosition + 6) + newHref + changedData.substring(hrefPosition + 6 + node.attr.href.length);
                                } else {
                                    console.log('!Failed to update href ' + node.attr.href);
                                }
                            }
                        } else {
                            var href = ResolveClosestLink(node.val, path);
                            if (href) {
                                var findRefLoc = changedData.indexOf('<ref>' + node.val);
                                if (findRefLoc > 0) {
                                    changedData = changedData.substring(0, findRefLoc + 4) + " href=\"" + href + "\">" + changedData.substring(findRefLoc + 5);
                                } else {
                                    console.log("!Failed to update ref " + node.val);
                                }
                            }
                        }
                    }
                    if (node.children && node.children.length) {
                        for (i = 0; i < node.children.length; ++i) {
                            expandReferences(node.children[i]);
                        }
                    }
                }
                expandReferences(document);
            }
            // Write out fixup files
            if (changedData != data) {
                fs.writeFile(filename + "_fixup", changedData, function (err) {
                    if (err) {
                        console.log("Error Saving file");
                    } else {
                        console.log("Saved " + filename + "_fixup");
                    }
                    callbackLoop();
                });
            } else {
                callbackLoop();
            }
        } else if (extension == ".html") {
            var changedData = data;
            console.log("Process " + path);
            var htmlparser = require("htmlparser2");
            var parser = new htmlparser.Parser({
                onopentag: function (name, attribs) {
                    if (attribs.href) {
                        var newHref = ResolveLink(attribs.href, path);
                        if (newHref != attribs.href) {
                            var hrefPosition = changedData.indexOf("href=\"" + attribs.href + "\"");
                            if (hrefPosition < 0)
                                hrefPosition = changedData.indexOf("href='" + attribs.href + "'");
                            if (hrefPosition > 0) {
                                changedData = changedData.substring(0, hrefPosition + 6) + newHref + changedData.substring(hrefPosition + 6 + attribs.href.length);
                            } else {
                                console.log('!Failed to update href ' + attribs.href);
                            }
                        }
                    }
                },
                ontext: function (text) {
                },
                onclosetag: function (name) {
                }
            });
            parser.write(data);
            parser.end();
            if (changedData != data) {
                fs.writeFile(filename + "_fixup", changedData, function (err) {
                    if (err) {
                        console.log("Error Saving file");
                    } else {
                        console.log("Saved " + filename + "_fixup");
                    }
                    callbackLoop();
                });
            } else {
                callbackLoop();
            }
        } else {
            callbackLoop();
        }
    });
}, function () {
    console.log('Done!');
});