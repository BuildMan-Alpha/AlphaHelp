/* global indexOf */
/* global substring */
var http = require("http");
var options = {
  host: 'www.alphasoftware.com',
  port: 80,
  path: '/documentation/files.json'
};
var fs = require('fs');
var pathModule = require('path');
var files = '';
var list = null;
var async = require('async');
var querystring = require("querystring");
var currentIssue = [];
var issuesFilename = "../generated/issues.json";
var issuesNeedComma = false;
var links = {};

var reportIssue = function (filename) {
    var problem = JSON.stringify({ filename: filename, issues: currentIssue }, null, " ");
    if (issuesNeedComma)
        problem = "\n, " + problem;
    else
        problem = "\n  " + problem;
    fs.appendFileSync(issuesFilename, problem);
    issuesNeedComma = true;
}

fs.writeFileSync(issuesFilename, "[");

// Lookup and index.html / index.xml / index.md for a path...
var LookupIndexPage = function (parentPath) {
    var indexName = (parentPath + "index.").toLowerCase();
    var noIndex = true;
    for (i = 0; i < list.length; ++i) {
        if (list[i].toLowerCase().substring(0, indexName.length) == indexName) {
            indexName = list[i];
            noIndex = false;
            break;
        }
    }
    if (noIndex) {
        indexName = parentPath + "index.xml";
    }
    return indexName;
};

// Lets resolve to the parent folder for all the matched items...
var GetCommonFolder = function (paths) {
    var basePath = paths[0].substring(0, paths[0].lastIndexOf('/') + 1);
    var commonFolder = basePath.toLowerCase();
    for (i = 1; i < paths.length; ++i) {
        if (paths[i].substring(0, paths[i].lastIndexOf('/') + 1).toLowerCase() != commonFolder) {
            commonFolder = null;
            break;
        }
    }
    if (!commonFolder) {
        basePath = null;
    }
    return basePath;
}

var RobustLink = function(path) {
    path = path.toLowerCase();
    for( var sc in links ) {
        if( links[sc].toLowerCase().indexOf(path) >= 0 ) {
            return "/documentation/index?search="+sc;
        } 
    }
    return null;
}


// Look for an href
var ResolveLink = function (href, fromPath) {
    var prefix1 = "http://www.alphasoftware.com/testdoc";
    var prefix2 = "http://www.alphasoftware.com/documentation";
    var prefix3 = "http://documentation.alphasoftware.com/testdoc";
    if( !href )
       return href;
    if( !href.substring )
       return href; 
    if( href.substring(0,28) == "/documentation/index?search=" )
       return href; 
    if( href.substring(0,prefix1.length) == prefix1 ) {
        href = href.substring(prefix1.length);
    } else if( href.substring(0,prefix2.length) == prefix2 ) {
        href = href.substring(prefix2.length);
    } else if( href.substring(0,prefix3.length) == prefix3 ) {
        href = href.substring(prefix3.length);
    }
    if( href.substring(0,7) == "/pages/" ) {
        var rlink = RobustLink( href.substring(6) );
        if( rlink ) {
            return rlink;
        }
        href = href.substring(6);
        // return 'index' page
    } else if( href.substring(0,1) == "/" ) {
        var rlink = RobustLink( href );
        if( rlink ) {
            return rlink;
        }
    }
    if ( href.indexOf("tiki-print") >= 0
      || href.indexOf("tiki-editpage.php") >= 0
        ) { 
        // tiki print/editpage is a no-op in the new help system...
        href = "#";
    } else if (href.indexOf("://") < 0
        && href.substring(0, 1) != '#'
        && href != ';'
        && href.indexOf("theme.css") < 0
        && href.indexOf("javascript:void(0)") < 0
        && href.substring(0, 18) != '/unknown_reference'
        && href.substring(0, 20) != '/ambiguous_reference'
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
                    if (resolveLink.indexOf("+") > 0) {
                        resolveLink = resolveLink.split("+").join(" ");
                    }
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
        var isXmlIndex = false;
        if (lowName.length > 1) {
            if (lowName[lowName.length - 1] == 'xml' && lowName[lowName.length - 2] == '/index') {
                isXmlIndex = true;
            }
            lowName[lowName.length - 1] = "";
        }
        lowName = lowName.join('.');
        var lownameAsPath = lowName.substring(0, lowName.length - 1) + "/";
        var rename = null;
        var found = false;
        var samename = [];
        var samenamePath = [];
        if (isXmlIndex) {
            lowName = lowLink.split('/');
            lowName[lowName.length - 1] = "";
            lowName = lowName.join('/');
            lownameAsPath = lowName;
        }

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
                } else {
                    var endingInPath = test.lastIndexOf(lownameAsPath);
                    if (endingInPath >= 0) {
                        var pathName = test.substring(0, endingInPath + lownameAsPath.length);
                        var j;
                        for (j = 0; j < samenamePath.length; ++j) {
                            if (samenamePath[j].toLowerCase() == pathName) {
                                pathName = null;
                                break;
                            }
                        }
                        if (pathName) {
                            samenamePath.push(list[i].substring(0, endingInPath + lownameAsPath.length));
                        }
                    }
                }
            }
        }
        if (!found) {
            if (isXmlIndex && samename.length > 1) {
                samename = [LookupIndexPage(samename[0].substring(0, lowName.length))];
            } else if (samename.length > 1) {
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
                                test.splice(0, test.length - match);
                                testThisPath = test.join('/');
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
                if (samename.length > 1) {
                    var noSuffix = [];
                    for (i = 0; i < samename.length; ++i) {
                        var test = samename[i].toLowerCase();
                        var testPos = test.indexOf(lowName);
                        if (testPos >= 0) {
                            test = test.substring(testPos + lowName.length);
                        }
                        if (test.indexOf('.') < 0) {
                            noSuffix.push(samename[i]);
                        }
                    }
                    if (noSuffix.length == 1) {
                        samename = noSuffix;
                    } else {                    
                        // Lets check if the folders are the same...
                        var commonFolder = GetCommonFolder(samename);
                        // Lets resolve to the parent folder for all the matched items...
                        if (commonFolder) {
                            samename = [LookupIndexPage(commonFolder)];
                        } else if (noSuffix.length > 1) {
                            samename = noSuffix;
                        }
                        if (samename.length > 1) {
                            // Last test = check for same branch as calling page...
                            var samePrefix = [];
                            var lastPrefixIndex = 1;
                            var prefixParts = fromPath.split('/');
                            var prefixMatch = "/" + prefixParts[1].toLowerCase() + "/";
                            for (; ;) {
                                for (i = 0; i < samename.length; ++i) {
                                    if (samename[i].toLowerCase().indexOf(prefixMatch) == 0) {
                                        samePrefix.push(samename[i]);
                                    }
                                }
                                if (samePrefix.length > 1 && (lastPrefixIndex + 1) < prefixParts.length) {
                                    samename = samePrefix;
                                    samePrefix = [];
                                    lastPrefixIndex += 1;
                                    prefixMatch += prefixParts[lastPrefixIndex].toLowerCase() + "/";
                                } else {
                                    break;
                                }
                            }
                            if (samePrefix.length > 0) {
                                samename = samePrefix;
                            }
                            if (samename.length > 1) {
                                var commonFolder = GetCommonFolder(samename);
                                // Lets resolve to the parent folder for all the matched items...
                                if (commonFolder) {
                                    samename = [LookupIndexPage(commonFolder)];
                                }
                            }
                        }
                    }
                }
            } else if (samenamePath.length == 1) {
                samename = [LookupIndexPage(samenamePath[0])];
            }
            if (samename.length == 1) {
                href = samename[0];
            } else if (samename.length > 1) {
                var isAmbig = true;        
                // Special case - html -> xml conversion, html version is still around
                if (samename.length == 2) {
                    var ext0 = samename[0].lastIndexOf('.');
                    var ext1 = samename[1].lastIndexOf('.');
                    if (ext0 > 0 && ext1 > 0) {
                        ext0 = samename[0].substring(ext0);
                        ext1 = samename[1].substring(ext1);
                        if (ext0 == '.xml' && ext1 == ".html") {
                            href = samename[0];
                            isAmbig = false;
                        } else if (ext1 == '.xml' && ext0 == ".html") {
                            href = samename[1];
                            isAmbig = false;
                        }
                    }
                }
                if (isAmbig) {
                    //href = "/ambiguous_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath) + "&count=" + samename.length + "&link1=" + querystring.escape(samename[0]) + "&link2=" + querystring.escape(samename[1]);
                    if (samename.length > 3) {
                        currentIssue.push({ problem: "ambiguous", href: href, count: samename.length, matches: [samename[0], samename[1], samename[2]] });
                    } else {
                        currentIssue.push({ problem: "ambiguous", href: href, matches: samename });
                    }
                }
            } else {
                currentIssue.push({ problem: "unknown", href: href });
                //href = "/unknown_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath);
            }
        }
    }
    return href;
};

// Look for closest reference (late lookup for new XML)
var ResolveClosestLink = function (text, fromPath) {
    var rlink = links[text.trim()];
    if( rlink ) {
        return rlink;
    }
    var href = null;
    var samename = [];
    var hasFolderMatch = null;
    var lowRef = text.toLowerCase();
    var searchRef = function () {
        var i;
        var folderMatchs = [];
        var namematch = [];
        for (i = 0; i < list.length; ++i) {
            var pos = list[i].toLowerCase().lastIndexOf(lowRef);
            if (pos >= 0) {
                var pathEndPos = list[i].lastIndexOf('/');
                if (pos >= pathEndPos) {
                    namematch.push(list[i]);
                } else {
                    var indexFn = list[i].substring(pathEndPos + 1).toLowerCase();
                    var parentFolderName = list[i].split('/');
                    if (parentFolderName.length > 1) {
                        parentFolderName = parentFolderName[parentFolderName.length - 2];
                        if (parentFolderName.toLowerCase().lastIndexOf(lowRef) >= 0) {
                            if (indexFn == "index.xml" || indexFn == "index.html" || indexFn == "index.md") {
                                namematch.push(list[i]);
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
        if (samename.length == 0 && namematch.length > 0) {
            samename = namematch;
        }
        if (namematch.length == 0 && folderMatchs.length > 0) {
            samename = folderMatchs;
            hasFolderMatch = folderMatchs;
        } else if (!hasFolderMatch && folderMatchs.length > 0) {
            hasFolderMatch = folderMatchs;
        }
        return (samename.length == 1) || hasFolderMatch;
    };

    if (!searchRef()) {
        var foundResult = false;
        if (lowRef.indexOf('  ') >= 0) {
            lowRef = lowRef.split(' ');
            for (i = lowRef.length - 1; i >= 0; --i) {
                if (lowRef[i] == "") {
                    lowRef.splice(i, 1);
                }
            }
            lowRef = lowRef.join(' ');
            if (searchRef()) {
                foundResult = true;
            }
        }
        if (!foundResult) {
            if (!searchRef()) {
                if (lowRef.indexOf(' method') >= 0 || lowRef.indexOf(' function') >= 0
                    || lowRef.indexOf(' class') >= 0 || lowRef.indexOf(' namespace') >= 0
                    ) {
                    lowRef = lowRef.split(' ');
                    lowRef.splice(lowRef.length - 1, 1);
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
        var startsWith = [];
        if (samename.length > 1) {
            lowRef = "/" + text.toLowerCase() + ".";
            for (i = 0; i < samename.length; ++i) {
                if (samename[i].toLowerCase().indexOf(lowRef) >= 0) {
                    startsWith.push(samename[i]);
                }
            }
            if (startsWith.length == 1) {
                samename = startsWith;
            }
        }
        if (samename.length > 1) {
            var compareApiDef = function(one,two) {
                var cleanupApiDef = function(funPage) {
                    funPage = funPage.replace("().",".");
                    funPage = funPage.replace("function.",".");
                    funPage = funPage.replace("method.",".");
                    if( funPage.substring(funPage.length-1) == "." )
                        funPage = funPage.substring(0,funPage.length-1);
                    return funPage.trim();
                };
                if( one == two )
                     return true;
                if( cleanupApiDef(one) == cleanupApiDef(two) )
                     return true;
                return false;                
            }
            for (i = 0; i < samename.length; ++i) {
                var namePart = samename[i].lastIndexOf('/');
                if( namePart > 0 ) {
                    namePart = samename[i].substring(namePart);
                    namePart = namePart.split(".")[0].toLowerCase()+".";
                    if( compareApiDef(namePart,lowRef) ) {
                        samename = [samename[i]];
                        break;
                    }
                }
            }            
        }
        if (samename.length != 1 && hasFolderMatch) {
            for (i = 0; i < hasFolderMatch.length; ++i) {
                if (fromPath.toLowerCase().indexOf(hasFolderMatch[i].replace('index.xml', '').toLowerCase()) == 0) {
                    var newsamename = [];
                    newsamename.push(hasFolderMatch[i]);
                    samename = newsamename;
                    startsWith = [];
                    break;
                }
            }
            if (startsWith.length > 1) {
                samename = startsWith;
            }
        } else if (startsWith.length > 1) {
            samename = startsWith;
        }
        if (samename.length > 1) {
            // Lets check if the folders are the same...
            var commonFolder = GetCommonFolder(samename);
            // Lets resolve to the parent folder for all the matched items...
            if (commonFolder) {
                samename = [LookupIndexPage(commonFolder)];
            }
        }
        if (samename.length == 1) {
            href = samename[0];
        } else {
            if (samename.length > 3) {
                currentIssue.push({ problem: "ambiguous", href: text, count: samename.length, matches: [samename[0], samename[1], samename[2]] });
            } else {
                currentIssue.push({ problem: "ambiguous", href: text, matches: samename });
            }
            // else href = "/ambiguous_reference?page=" + querystring.escape(href) + "&from=" + querystring.escape(fromPath) + "&count=" + samename.length + "&link1=" + querystring.escape(samename[0]) + "&link2=" + querystring.escape(samename[1]);
        }
    } else {
        currentIssue.push({ problem: "unknown", href: text });
    }
    return href;
};

fs.readFile("../links.json", "utf8", function (err2, linksData) {
    links = JSON.parse(linksData)
    var link;
http.get(options, function(res) {
  res.on('data', function(chunk) {
    files += chunk;
  });
  res.on('end', function() {
    list = JSON.parse(files);
async.eachSeries(list, function (path, callbackLoop) {
    var filename = "../helpfiles" + path;
    fs.readFile(filename, "utf8", function (err, data) {
        var extension = path.substring(path.lastIndexOf('.'));
        currentIssue = [];
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
                currentIssue.push({ problem: "bad_xml" });
            }
            if (document) {
                var expandReferences = function (node) {
                    var i;
                    if (node.name == "ref" ) {
                        if (node.attr.href) {
                            var newHref = ResolveLink( node.attr.href , path );
                            if (newHref != node.attr.href) {
                                newHref = ResolveLink(newHref,path);
                                var hrefPosition = changedData.indexOf("href=\"" + node.attr.href + "\"");
                                if (hrefPosition < 0)
                                    hrefPosition = changedData.indexOf("href='" + node.attr.href + "'");
                                if (hrefPosition > 0) {                                    
                                    if( newHref.substring(0,28) == "/documentation/index?search=" ) {
                                         changedData = changedData.substring(0, hrefPosition ) + "link=" + changedData.substring(hrefPosition+5, hrefPosition + 6)+ newHref.substring(28) + changedData.substring(hrefPosition + 6 + node.attr.href.length);
                                    } else {
                                         changedData = changedData.substring(0, hrefPosition + 6) + newHref + changedData.substring(hrefPosition + 6 + node.attr.href.length);
                                    }
                                } else {
                                    console.log('!Failed to update href ' + node.attr.href);
                                }
                            }
                        } else if(!node.attr.link) {
                            var href = ResolveClosestLink(node.val.trim(), path);
                            if (href) {
                                var rlink = RobustLink(href);
                                if( rlink )
                                    href = rlink;
                                var findRefLoc = changedData.indexOf('<ref>' + node.val);
                                if (findRefLoc > 0) {
                                    if( newHref.substring(0,28) == "/documentation/index?search=" ) {
                                        changedData = changedData.substring(0, findRefLoc + 4) + " link=\"" + href.substring(28) + "\">" + changedData.substring(findRefLoc + 5);
                                    } else {
                                        changedData = changedData.substring(0, findRefLoc + 4) + " href=\"" + href + "\">" + changedData.substring(findRefLoc + 5);
                                    }
                                } else {
                                    console.log("!Failed to update ref " + node.val);
                                }
                            }
                        }
                    } else if( node.name == "link" ) {
                        if (node.attr.href) {
                            var newHref = ResolveLink( node.attr.href , path );
                            if (newHref != node.attr.href) {
                                href = ResolveLink(href,path);
                                var hrefPosition = changedData.indexOf("href=\"" + node.attr.href + "\"");
                                if (hrefPosition < 0)
                                    hrefPosition = changedData.indexOf("href='" + node.attr.href + "'");
                                if (hrefPosition > 0) {
                                    changedData = changedData.substring(0, hrefPosition + 6) + newHref + changedData.substring(hrefPosition + 6 + node.attr.href.length);
                                } else {
                                    console.log('!Failed to update href ' + node.attr.href);
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
            if (currentIssue.length) {
                reportIssue(filename);
            }
            // Write out fixup files
            if (changedData != data) {
                fs.writeFile(filename , changedData, function (err) {
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

            if (currentIssue.length) {
                reportIssue(filename);
            }
            if (changedData != data) {
                fs.writeFile(filename+ "_fixup", changedData, function (err) {
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
    fs.appendFileSync(issuesFilename, "\n]");
});


  });
}).on('error', function(e) {
  console.log("Got error: " + e.message);
}); 


});