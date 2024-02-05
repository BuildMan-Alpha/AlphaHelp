var noSearchFlag = false;
var searchLocalFlag = false;
var runHelpServer = false;
var settingsOverride = null;
var help = null;

var loader = function(settingsFile, runHelpServer, searchLocalFlag, noSearchFlag) {
    var linksFileName = "/home/AlphaHelp/links.json";
    var errorLog = "/home/AlphaHelp/generated/helpserver_error.log";
    var validateLinksFile = "/home/AlphaHelp/helpserver/node_modules/helpserver/validateLinksFile.js";
    var helpfilesBasepath = "/home/AlphaHelp/helpfiles";
    var aliasesFile = "/home/AlphaHelp/aliases.json";
    var annotationPath = "/home/AlphaHelp/annotations";
    var absolutePath = "/documentation/";
    var aliases = {};
    var library = require("./assets/library");
    var Help = require('helpserver');
    var fs = require("fs");
    var https_credentails = null;
	var pe = require("./pe");
    var options = require(settingsFile);
    var serverType = "";
    var helpEmail = "guides@alphasoftware.com";
    if (searchLocalFlag) {
        serverType = "(searchlocal) ";
    } else if (noSearchFlag) {
        linksFileName = "../links.json";
        aliasesFile = "../aliases.json";
        validateLinksFile = "./node_modules/helpserver/validateLinksFile.js";
        errorLog = "../generated/helpserver_error.log";
        helpfilesBasepath = "../helpfiles";
        annotationPath = "../annotations";
        serverType = "(nosearch) ";
    }
    // To test

    if (settingsOverride !== null) {
        options = require(settingsOverride);
    }
    if (options.linksFileName) linksFileName = options.linksFileName;
    if (options.aliasesFile) aliasesFile = options.aliasesFile;
    if (options.validateLinksFile) validateLinksFile = options.validateLinksFile;
    if (options.errorLog) errorLog = options.errorLog;
    if (options.helpfilesBasepath) helpfilesBasepath = options.helpfilesBasepath;
    if (options.annotationPath) annotationPath = options.annotationPath;
    if (options.helpEmail) helpEmail = options.helpEmail;

    if (options.libraryPath) {
        library = require(options.libraryPath + "library");
    }

    if (runHelpServer) {
        console.log("\n\n\n#########################################################\n### Starting the server " + serverType + "- time " + new Date() + "\n");
        if (options.https_port) {
            if (options.privatekey && options.certificate) {
                https_credentails = { key: fs.readFileSync(options.privatekey, 'utf8'), cert: fs.readFileSync(options.certificate, 'utf8') };
            } else if (options.pfx) {
                if (options.passphrase) {
                    https_credentails = { pfx: fs.readFileSync(options.pfx), passphrase: options.passphrase };
                } else {
                    https_credentails = { pfx: fs.readFileSync(options.pfx) };
                }
            }
        }
    }

    var replaceAll = function(str, find, replace) {
        while (str.indexOf(find) >= 0) {
            str = str.replace(find, replace);
        }
        return str;
    };
    var removeMarkup = function(data) {
        if (data.indexOf("*[")) {
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
                    newData += emph + remainder;
                } else if (emph.length > 0 || (i + 1) >= items.length) {
                    newData += "*[" + emph;
                } else {
                    ++i;
                    newData += "*[" + emph + item[i];
                }
            }
            data = newData;
        }
        return data;
    };


    var events = {};
    var tocData = { altTocs: [], defaultPathMetadata: [] };
    options.library = library;
    if (runHelpServer) {
        fs.readFile(errorLog, "utf8", function(err, contents) {
            if (!err && contents) {
                console.log("Last crash report:\n" + contents + "\n");
                fs.unlink(errorLog, function(){});
            }
        });

        // report error from node..
        process.on('uncaughtException', function(err) {
            try {
                var nodeErrorLog = "Helpserver crashed\n" + (new Date).toUTCString() + ' uncaughtException:' + err.message + "\n\nCallstack:\n" + err.stack;
                fs.writeFile(errorLog, nodeErrorLog, function(err2) {
                    process.exit(1);
                });
            } catch (err2) {
                console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
                console.error(err.stack);
                process.exit(1);
            }
        });
    }


    var collectAltToc = function(books) {
        if (books && books.length > 0) {
            var i;
            for (i = 0; i < books.length; ++i) {
                if (books[i].href) {
                    var href = books[i].href;
                    if (href.substring(0, 7) == "/pages/") {
                        href = href.substring(6);
                    }
                    var pathEnd = href.lastIndexOf('/');
                    if (pathEnd > 0) {
                        href = href.substring(0, pathEnd + 1);
                        tocData.altTocs.push(href);
                        tocData.defaultPathMetadata.push({
                            "name": href,
                            "metadata": {
                                "tags": "common",
                                "status": "accept"
                            }
                        });
                    }
                }
                if (books[i].books) {
                    collectAltToc(books[i].books);
                }
            }
        }
    };

    collectAltToc(library);
    tocData.defaultPathMetadata.push({
        "name": "/Miscellaneous/",
        "metadata": {
            "tags": "common",
            "status": "accept"
        }
    });
    options.tocData = tocData;

    // delete require.cache[require.resolve('./assets/library')]

    //--------------------------------------------------------------------------------------
    // page index function - gets called whenever we change xml files in a folder... passes all the files 
    var outputSnippet = function(args, description, type, topic, isStatic) {
        var result = "";
        if (args.isFolder) {
            if (args.format == ".xml") {
                args.path = args.path + "/index.xml";
            }
        }
        if (!topic) {
            topic = args.name;
            if (!topic) {
                topic = "Unknown";
            }
        }
        if (!topic.indexOf) {
            topic = topic["_"];
            if (!topic) {
                topic = "Unknown";
            }
        }
        if (topic.indexOf('<') >= 0 || topic.indexOf('>') >= 0 || topic.indexOf('&') >= 0) {
            topic = "<![CDATA[" + topic + "]]>";
        }

        if (description) {
            if (args.format == ".xml") {
                if (description.indexOf) {
                    if (description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0) {
                        description = "<![CDATA[" + description + "]]>";
                    }
                } else if (description.p) {
                    if (description.p.length > 0) {
                        try {
                            description = description.p[0];
                            if (description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0) {
                                description = "<![CDATA[" + description + "]]>";
                            }
                        } catch (err2) {

                        }
                    }
                }
                if (type == "method") {
                    result = "<methodref" + (isStatic ? " static=\"true\"" : "") + "><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.name + "</ref><description>" + description + "</description></methodref>";
                } else {
                    result = "<item><name href=\"" + args.path + "\">" + topic + "</name><description>" + description + "</description></item>";
                }
            } else {
                result = "<dt><a href='" + args.path + "' >" + topic + "</a></dt>\n<dd>" + description + "</dd>";
            }
        } else {
            if (args.format == ".xml") {
                if (type == "method") {
                    result = "<methodref" + (isStatic ? " static=\"true\"" : "") + "><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.name + "</ref></methodref>";
                } else {
                    result = "<item><name href=\"" + args.path + "\">" + topic + "</name></item>";
                }
            } else {
                result = "<dt><a href='" + args.path + "' >" + topic + "</a></dt>";
            }
        }
        return result;
    }

    events.breadCrumbsTag = function(url) {
        if (typeof url !== 'string') {
            return "";
        }
        if (url.indexOf("\\helpfiles\\") === -1) {
            return "";
        }
        var book = url.split("\\helpfiles\\")[1].split("\\")[0];
        var bookName = "";
        switch (book) {
            case "GettingStarted":
                bookName = "gettingStarted";
                break;
            case "Guides":
                bookName = "guide";
                break;
            case "HowTo":
            case "How To":
                bookName = "howTo";
                break;
            case "Ref":
                bookName = "ref";
                break;
            case "ReleaseNotes":
                bookName = "releaseNotes";
                break;
            case "Troubleshooting":
            case "Solutions":
                bookName = "faq";
                break;
            default:
                bookName = "";
                break;
        }
        return bookName;
    };

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

    events.pageIndexer = function(args, savePage) {
        // just error out for now...
        var filename = args.filename;
        var type = null;
        if (args.all) {
            var i;
            var methodFiles = 0;
            var nonMethodFiles = 0;
            for (i = 0; i < args.all.length; ++i) {
                if (args.all[i].path && (typeof args.all[i].path === "string")) {
                    var testName = args.all[i].path.toLowerCase();
                    var pathEnd = testName.lastIndexOf('/');
                    if (pathEnd > 0)
                        testName = testName.substring(pathEnd);
                    if (testName != '/index.xml') {
                        if (testName.indexOf(' method.') > 0) {
                            ++methodFiles;
                        } else {
                            ++nonMethodFiles;
                        }
                    }
                } else {
                    console.log("Entry " + i + " for " + filename + " has no path string defined.");
                }
            }
            if (methodFiles > 0) { // && nonMethodFiles === 0) {
                type = "method";
            }
        }
        if (filename.indexOf('#') > 0) {
            filename = filename.split('#')[0];
        }
        var extensionIndex = filename.lastIndexOf(".");
        //    if( filename.indexOf("/index.xml") >= 0 || filename.indexOf("/index.html") >= 0 ) {
        //        debugger;
        //    }
        if (filename.substring(extensionIndex).toLowerCase() == ".xml") { //&& filename.indexOf("/index.xml") < 0) {
            var fs = require("fs");
            fs.readFile(filename, "utf8", function(err, data) {
                if (err) {
                    console.log(filename + " was not found");
                    savePage(outputSnippet(args, null, type, false));
                } else {
                    var parseString = require('xml2js').parseString;
                    parseString(data, function(err, result) {
                        var description = null;
                        var topic = null;
                        var static = false;
                        if (err) {
                            console.log(err + " processing file " + filename);
                        } else { 
                            result = eval(result);
                            if (result) {
                                if (result.page) {
                                    if (result.page.topic) {
                                        if (Object.prototype.toString.call(result.page.topic) === '[object Array]') {
                                            topic = result.page.topic[0];
                                        } else {
                                            topic = result.page.topic;
                                        }
                                    }
                                    if (result.page.description) {
                                        if (Object.prototype.toString.call(result.page.description) === '[object Array]') {
                                            description = result.page.description[0];
                                        } else {
                                            description = result.page.description;
                                        }
                                    }
                                    if (result.page.prototype && Object.prototype.toString.call((result.page.prototype)) === '[object Array]') {
                                        if (result.page.prototype[0].$ && result.page.prototype[0].$.static) {
                                            static = result.page.prototype[0].$.static === "true";
                                        }
                                    }
                                }
                            }
                        }
                        //                        if (filename.indexOf("/index.xml") > 0) {
                        if (filename.indexOf("Method.xml") === -1 && type === 'method') {
                            savePage(outputSnippet(args, description, null, topic, static));
                        } else {
                            savePage(outputSnippet(args, description, type, topic, static));
                        }
                    });
                }
            });
        } else if (filename.substring(extensionIndex).toLowerCase() == ".html") { //&& filename.indexOf("/index.xml") < 0) {
            var fs = require("fs");
            fs.readFile(filename, "utf8", function(err, data) {
                var description = null;
                if (!err) {
                    var metaDataTags = data.split("<meta");
                    if (metaDataTags.length > 1) {
                        var i;
                        for (i = 1; i < metaDataTags.length; ++i) {
                            var nameAttribute = metaDataTags[i].split('>')[0].split("name=");
                            if (nameAttribute.length > 1) {
                                nameAttribute = nameAttribute[1].split('"');
                                if (nameAttribute.length > 1) {
                                    if (nameAttribute[1].toLowerCase() == "description") {
                                        var contentAttribute = metaDataTags[i].split("content=");
                                        if (contentAttribute.length > 1) {
                                            contentAttribute = contentAttribute[1].split('"');
                                            if (contentAttribute.length > 1) {
                                                description = contentAttribute[1];
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                savePage(outputSnippet(args, description, type, false));
            });
        } else {
            savePage(outputSnippet(args, null, type, false));
        }
    };

    events.wrapIndex = function(args) {
        var result = "";
        if (args.content.trim().length === 0) {
            return result;
        }

        if (args.format == ".xml") {
            var entries = args.content;
            entries = entries.split("\n");

            var methods = [];
            var articles = [];
            var type = "";
            // for each entry, push to appropriate array 
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].substring(0, 10) == "<methodref") {
                    type = "method";
                } else if (entries[i].substring(0, 5) == "<item") {
                    type = "articles";
                }

                if (type == "method") {
                    methods.push(entries[i]);
                } else {
                    articles.push(entries[i]);
                }
            }
            if (articles.length > 0) {
                result = result + "<list><item><name-title>Name</name-title></item>" + articles.join("\n") + "</list>\n";
            }
            if (methods.length > 0) {
                result = result + "<methods>" + methods.join("\n") + "</methods>\n";
            }
        } else {
            result = "<dl id='generatedTopics'>" + args.content + "</dl>";
        }
        return result;
    };

    events.getDefaultIndexTemplate = function(args) {
        var result = "";
        if (args.format == ".xml") {
            result = "<page><!--list:.--></page>";
        } else {
            result = "<html><body><!--list:.--></body></html>";
        }
        return result;
    };
    //--------------------------------------------------------------------------------------
    var resolveXmlFilePath = function(xmlFile, relative) {
        var xmlPath = xmlFile.split('/');
        var xmlIndex = xmlPath.length - 1;
        var xmlCount = 1;
        var leading = relative.split("../");
        if (leading.length > 1) {
            var xmlIndex = xmlPath.length - leading.length;
            var xmlCount = leading.length;
            leading = leading[leading.length - 1];
        } else {
            leading = leading[0];
        }
        xmlPath.splice(xmlIndex, xmlCount);
        xmlFile = xmlPath.join("/") + "/" + leading;
        return xmlFile;
    };
    //--------------------------------------------------------------------------------------
    var extractTag = function(data, startPattern, endPattern) {
        var tag = null;
        if (data) {
            var tagStart = data.indexOf(startPattern);
            if (tagStart > 0) {
                var tagEnd = data.indexOf(endPattern);
                tagStart += startPattern.length;
                tag = data.substring(tagStart, tagEnd);
            }
        }
        return tag;
    };
    var extractTags = function(data, startPattern, endPattern) {
        var tags = null,
            tag = null;
        var start = 0,
            tagStart = 0,
            tagEnd = 0;
        for (;;) {
            tagStart = data.indexOf(startPattern, start);
            if (tagStart < 0)
                break;
            tagStart += startPattern.length;
            tagEnd = data.indexOf(endPattern, tagStart);
            if (tagEnd < 0)
                break;
            tag = data.substring(tagStart, tagEnd);
            if (tags) {
                tags.push(tag);
            } else {
                tags = [tag];
            }
            start = tagEnd + endPattern.length;
        }
        return tags;
    };
    var replaceTag = function(data, startPattern, endPattern, replacement) {
        var tagStart = data.indexOf(startPattern);
        var tag = null;
        if (tagStart > 0) {
            var tagEnd = data.indexOf(endPattern);
            tagStart += startPattern.length;
            data = data.substring(0, tagStart) + replacement + data.substring(tagEnd);
        }
        return data;
    };
    var expandAnnotations = function(data, annotations, filename, saveIt, done) {
        if (!annotations) {
            annotations = [];
        }
        var index = 0;
        var fs = require('fs');
        // If you want to include multiple annotations, you must place them in <sections>
        var origSections = extractTag(data, "<sections>", "</sections>");
        var nextStep = function() {
            if (index < annotations.length) {
                // Async replacements....
                var thisAnnotation = annotations[index];
                var annotationFile = annotationPath + thisAnnotation.trim();
                ++index;
                fs.readFile(annotationFile, "utf8", function(rErr, annotationConcat) {
                    var annotationSee = extractTag(annotationConcat, "<see>", "</see>");
                    var annotationLinks = extractTag(annotationConcat, "<links>", "</links>");
                    
                    // Extract section(s) from annotation file:
                    annotationConcat = extractTag(annotationConcat, "<sections>", "</sections>");
                    if (!annotationConcat) {
                        annotationConcat = "";
                    }
                    
                    if (rErr || (annotationConcat == "" && annotationLinks == "" && annotationSee == "")) {
                        nextStep();
                    } else {
                        // Add <section> tags from <annotations>. If a page has <sections>, <annotations> MUST be placed inside <sections> tag.
                        if (origSections) {
                            data = data.replace("<annotations>" + thisAnnotation + "</annotations>", annotationConcat);
                        } else {
                            data = data.replace("<annotations>" + thisAnnotation + "</annotations>", "<sections>" + annotationConcat + "</sections>");
                        }

                        // Add <ref> tags from <annotations> IF any exist.
                        if (annotationSee) {
                            // Fetch see tags from data
                            // If the file contains multiple annotations, a previous annotation may have added a <see> tag.
                            var origSee = extractTag(data, "<see>", "</see>");
                            if (origSee) {
                                data = data.replace("</see>", annotationSee + "</see>");
                            } else {
                                data = data.replace("</page>", "<see>" + annotationSee + "</see></page>");
                            }
                        }

                        // Add <links> & <href> tags from <annotations> IF any exist.
                        if (annotationLinks) {
                            // Fetch links tags from data
                            // If the file contains multiple annotations, a previous annotation may have added a <links> tag.
                            var origLinks = extractTag(data, "<links>", "</links>");
                            if (origLinks) {
                                data = data.replace("</links>", annotationLinks + "</links>")
                            } else {
                                data = data.replace("</page>", "<links>" + annotationLinks + "</links></page>")
                            }
                        }
                        saveIt = true;
                        nextStep();
                    }
                });
            } else if (saveIt) {
                // Done 
                fs.writeFile(filename, data, function(err) {
                    if (err) {
                        done(false);
                    } else {
                        done(true);
                    }
                });
            } else {
                done(false);
            }
        };
        nextStep();
    };

    var xsltproc = require('xsltproc');
    events.translateXML = function(xmlFile, htmlFile, callback, basepath) {
console.log("Enter translateXML");
        basepath = basepath || "/documentation/";
        fs.readFile(xmlFile, "utf8", function(err, data) {
            var xsltTransformFile = function(xmlFile, htmlFile, callback) {
                var xslt = xsltproc.transform(options.assetpath + 'assets/xform.xslt', xmlFile);
                var err = null;
                var dataOut = '';
                xslt.stdout.on('data', function(data) {
                    dataOut += data;
                });
                xslt.stderr.on('data', function(data) {
                    err = '' + data;
                });
                xslt.on('exit', function(code) {
                    if (err) {
                        var fs = require('fs');
                        fs.readFile(xmlFile, "utf8", function(err2, errPage) {
                            if (err2) {
                                callback(err2, null);
                            } else {
                                var errparts = err.split(':');
                                var index = -1;
                                if (errparts.length > 2) {
                                    index = parseInt(errparts[1]);
                                }
                                var completeErrPage = function(index) {
                                    errPage = replaceAll(errPage, "<amp>;", "&amp;");
                                    errPage = replaceAll(errPage, "<", "&lt;");
                                    errPage = replaceAll(errPage, ">", "&gt;");
                                    errPage = replaceAll(errPage, "&lt;amp&gt;", "&amp;");

                                    var lines = errPage.split('\n');
                                    if (0 <= index && index < 10000000) {
                                        if (index < lines.length) {
                                            lines[index] = "<span style=\"color:red;background:yellow;\">" + lines[index] + "</span>";
                                        }
                                    }
                                    for (var i = 0; i < lines.length; ++i) {
                                        lines[i] = "<span style=\"background:#bbb;\">" + String("00000" + i).slice(-5) + "&nbsp;</span>" + lines[i];
                                    }
                                    errPage = lines.join("\n");
                                    errPage = "<b>Error Encountered</b><br><div>" + err + "</div><pre>" + errPage + "</pre>";
                                    callback(null, errPage);
                                };
                                if (index < 0) {
                                    var parseString = require('xml2js').parseString;
                                    parseString(errPage, function(err, result) {
                                        var description = null;
                                        if (err) {
                                            console.log("Error running XSLT for page " + xmlFile + "\n");
                                            var lineArg = ('' + err).split('Line:');
                                            if (lineArg.length > 1) {
                                                index = parseInt(lineArg[1].split('\n')[0].trim());
                                            }
                                        }
                                        completeErrPage(index);
                                    });
                                } else {
                                    completeErrPage(index);
                                }
                            }
                        });
                    } else {
                        var fs = require('fs');
                        dataOut = replaceAll(dataOut, "<!--A5_BASE_PATH-->", basepath)
                        fs.writeFile(htmlFile, dataOut, function(err) {
                            var contentDiv = dataOut.split('<meta name="description" content="');
                            if (contentDiv.length > 1) {
                                var firstDesc = contentDiv[1].split('"/>');
                                if (firstDesc.length > 1) {
                                    firstDesc[0] = removeMarkup(firstDesc[0]);
                                    firstDesc[0] = firstDesc[0].replace(/"/g,"&quot;").replace(/'/g,"&apos;");
                                    contentDiv[1] = firstDesc.join('"/>');
                                    dataOut = contentDiv.join('<meta name="description" content="');
                                }
                            }
                            callback(err, dataOut);
                        });
                    }
                });
            };
            if (err) {
                // Need to redirect to search page
                var pathParts = xmlFile.split('/');
                dataOut = '<meta name="robots" content="noindex" /><meta http-equiv="refresh" content="0;URL=\'' + basepath + 'index?search=' + pathParts[pathParts.length - 1].replace(".xml", "") + '" />';
                callback(null, dataOut);
            } else {
                var symlink = extractTag(data, "<symlink>", "</symlink>");
                var remapped = false;
                if (symlink) {
                    var shortLinkReplace = extractTag(data, "<shortlink>", "</shortlink>");
                    var topicReplace = extractTag(data, "<topic", "</topic>");
                    var descReplace = extractTag(data, "<description>", "</description>");
                    var replaceNames = extractTag(data, "<replace>", "</replace>");
                    var replaceAnnotations = extractTags(data, "<annotations>", "</annotations>");
                    var extractBuild = function(data) {
                        var build = data.split('build="');
                        if (build.length > 1) {
                            build = build[1].split('"')[0];
                        } else {
                            build = null;
                        }
                        return build;
                    };

                    var build = extractBuild(data);

                    if (replaceNames) {
                        replaceNames = replaceNames.split("/");
                        if (replaceNames.length < 3) {
                            replaceNames = null;
                        } else if (replaceNames[0].length !== 0) {
                            replaceNames = null;
                        }
                    }

                    var newXmlFile = resolveXmlFilePath(xmlFile, symlink);
                    if (newXmlFile && newXmlFile !== xmlFile) {
                        xmlFile = newXmlFile;
                        remapped = true;
                        fs.readFile(xmlFile, "utf8", function(err2, data2) {
                            if (!err2) {
                                // Create temporary XML that has changes...
                                var splitNameAt = htmlFile.lastIndexOf(".");
                                if (splitNameAt > 0) {
                                    var modXmlFile = htmlFile.substring(0, splitNameAt) + ".sym.xml";
                                    if (build) {
                                        var buildStr = ' build="' + build + '"';
                                        var oldBuild = extractBuild(data2);
                                        if (oldBuild === null) {
                                            var insertPos = data2.indexOf(">");
                                            data2 = data2.substr(0, insertPos) + buildStr + data2.substr(insertPos);
                                        } else {
                                            data2 = data2.replace(' build="' + oldBuild + '"', buildStr);
                                        }
                                    }
                                    if (shortLinkReplace) {
                                        data2 = replaceTag(data2, "<shortlink>", "</shortlink>", shortLinkReplace);
                                    }
                                    if (topicReplace) {
                                        data2 = replaceTag(data2, "<topic", "</topic>", topicReplace);
                                    }
                                    if (descReplace) {
                                        data2 = replaceTag(data2, "<description>", "</description>", descReplace);
                                    }
                                    if (replaceNames) {
                                        var nReplacements = Math.floor(replaceNames.length / 3);
                                        while (nReplacements > 0) {
                                            --nReplacements;
                                            data2 = replaceAll(data2, replaceNames[(nReplacements * 3) + 1], replaceNames[(nReplacements * 3) + 2]);
                                        }
                                    }
                                    var annotations = extractTags(data2, "<annotations>", "</annotations>");
                                    if (replaceAnnotations) {
                                        replaceAnnotations.forEach(function(value, index, arr) {
                                            data2 = data2.replace("</page>", "<sections><annotations>" + value + "</annotations></sections></page>");
                                        });
                                        if (annotations) {
                                            annotations.append(replaceAnnotations);
                                        } else {
                                            annotations = replaceAnnotations;
                                        }
                                    }
                                    if (data2 === data) {
                                        // No changes
                                        if (annotations) {
                                            var modXmlFile = htmlFile.substring(0, splitNameAt) + ".ano.xml";
                                            expandAnnotations(data2, annotations, modXmlFile, false, function(applied) {
                                                if (applied) {
                                                    xsltTransformFile(xmlFile, modXmlFile, callback);
                                                } else {
                                                    xsltTransformFile(modXmlFile, htmlFile, callback);
                                                }
                                            });
                                        } else {
                                            xsltTransformFile(xmlFile, htmlFile, callback);
                                        }
                                    } else {
                                        expandAnnotations(data2, annotations, modXmlFile, true, function(applied) {
                                            if (applied) {
                                                xsltTransformFile(modXmlFile, htmlFile, callback);
                                            } else {
                                                xsltTransformFile(xmlFile, htmlFile, callback);
                                            }
                                        });
                                    }
                                } else {
                                    xsltTransformFile(xmlFile, htmlFile, callback);
                                }
                            } else {
                                xsltTransformFile(xmlFile, htmlFile, callback);
                            }
                        });
                    }
                } else {
                    var annotations = extractTags(data, "<annotations>", "</annotations>");
                    if (annotations) {
                        // If we have annottations
                        var splitNameAt = htmlFile.lastIndexOf(".");
                        if (splitNameAt > 0) {
                            remapped = true;
                            var modXmlFile = htmlFile.substring(0, splitNameAt) + ".ano.xml";
                            expandAnnotations(data, annotations, modXmlFile, false, function(applied) {
                                if (applied) {
                                    xsltTransformFile(modXmlFile, htmlFile, callback);
                                } else {
                                    xsltTransformFile(xmlFile, htmlFile, callback);
                                }
                            });
                        }
                    }
                }
                if (!remapped) {
                    xsltTransformFile(xmlFile, htmlFile, callback);
                }
            }
        });
    };
    events.beforeRefresh = function() {
        var validateLinks = require(validateLinksFile);
        validateLinks(linksFileName, helpfilesBasepath, function(result) {
            if (result.problems) {
                console.log("Found problems with links.json\n" + JSON.stringify(result.problems));
            }
        });
    };
    events.afterRefresh = function() {
        if (options.chainRefreshCommand) {
            var requestOptions = {
                hostname: '127.0.0.1',
                port: options.chainRefreshCommand,
                path: '/refresh',
                method: 'POST'
            };
            var http = require('http');
            var request = http.request(requestOptions, function(response) {});
            //Write our post data to the request
            request.write("");
            //End the request.
            request.end();
        }
        if (options.other) {
            for (var i = 0; i < options.other.length; ++i) {
                options.other[i].help.refresh(function(err, result) {});
            }
        }
    };

    events.extractTitle = function(page) {
        var topicStart = page.search(/<topic[^>]*>/);
        if (topicStart > 0) {
            var len = page.match(/<topic[^>]*>/)[0].length;
            topicStart = topicStart + len;
            var topicEnd = page.indexOf("</topic>");
            if (topicEnd > topicStart) {
                if (page.substring) {
                    var topic = page.substring(topicStart, topicEnd).trim();
                    if (topic.substring(0, 9) === "<![CDATA[") {
                        if (topic.substring(topic.length - 3) === "]]>") {
                            topic = topic.substring(9, topic.length - 3);
                            topic = replaceAll(topic, "<", "&lt;");
                            topic = replaceAll(topic, ">", "&gt;");
                        }
                    }
                    if (topic.length > 0)
                        return topic;
                } else {
                    console.log("substring method was not found." + page);
                }
            }
        }
        return null;
    }
    events.extractDescription = function(page) {
        var descriptionStart = page.indexOf("<description>");
        var endArgument = page.indexOf("</argument");
        if (endArgument > descriptionStart) {
            var startArgument = page.indexOf("<argument");
            if (startArgument > 0 && startArgument < descriptionStart) {
                page = page.substring(endArgument);
                descriptionStart = page.indexOf("<description>");
            }
        }
        if (descriptionStart > 0) {
            var descriptionEnd = page.indexOf("</description>");
            descriptionStart += 13;
            if (descriptionEnd > descriptionStart) {
                var description = page.substring(descriptionStart, descriptionEnd).trim();
                if (description.substring(0, 9) == "<![CDATA[") {
                    description = description.substring(9).trim();
                    var endTagPos = description.lastIndexOf("]]>");
                    if (endTagPos > 0) {
                        description = description.substring(0, endTagPos);
                    }
                }
                if (description.length > 0)
                    return description;
            }
        }
        return null;
    };
    events.decorateTitle = function(title) {
        if (title.indexOf('Api') >= 0) {
            if (title === 'Api') {
                title = "API";
            } else if (title === "Client_Api") {
                title = "Client API";
            } else if (title === "Desktop_Api") {
                title = "Desktop API";
            }
        } else if (title.indexOf(".") < 0) {
            if (title.indexOf('_class') > 0) {
                if (title.substring(title.length - 6) === "_class") {
                    title = title.replace('_class', '');
                }
            } else if (title.indexOf('_namespace') > 0) {
                if (title.substring(title.length - 10) === "_namespace") {
                    title = title.replace('_namespace', '');
                }
            } else if (title.indexOf('_object') > 0) {
                if (title.substring(title.length - 7) === "_object") {
                    title = title.replace('_object', '');
                }
            }
        }
        return title;
    };
    events.addPageSourceComment = function(page, symName) {
        var pageSource;
        page = page.replace(".xml_html", ".xml");
        pageSource = "<!-- page location: c:\\dev\\AlphaHelp\\helpfiles" + replaceAll(page, '/', '\\') + " -->";
        var relLink = replaceAll(page, '\\', '/');
        relLink = relLink.replace(".xml", ".html");
        pageSource =  '<link rel="canonical" href="https://documentation.alphasoftware.com/documentation/pages'+ relLink +'" />\n'+ pageSource;
        if (symName) {
            pageSource += "\n    <!-- link:  *[link:" + symName + "]* -->";
        }
        return pageSource;
    };
    events.getSharableLink = function(page, symName, basepath) {
        basepath = basepath || "/documentation/";
        var shareLink;
        page = page.replace(".xml_html", ".xml");
        shareLink = "https://documentation.alphasoftware.com" + basepath + "pages" + page;
        if (symName) {
            shareLink = encodeURI("https://documentation.alphasoftware.com" + basepath + "index?search=" + symName);
        }
        return shareLink;
    };
    events.generateLocalToc = function(localNames) {
        if (localNames.length > 1) {
            var localToc = "<div class=\"local-toc-title\">IN THIS PAGE</div>\n<ul>\n";
            var lastLvl = -1;
            var pendingEnd = "";
            var returnLevel = [];
            var lastTagPos = -1;
            var isTree = false;
            for (var i = 0; i < localNames.length; ++i) {
                var ln = localNames[i];
                var lvlName = ln.name.toLowerCase().split('_')[0];
                var parentNode = false;
                var lastTagState = ' class="leaf"';
                if (lvlName == 'group') {
                    lvlName = 1;
                } else if (lvlName == 'section' || lvlName == 'section1') {
                    lvlName = 2;
                } else if (lvlName.substring(0, 7) == 'section') {
                    lvlName = parseInt(lvlName.substring(7), 10) + 1;
                    if (lvlName < 2) {
                        lvlName = 2;
                    }
                } else {
                    lvlName = 3;
                }
                if (lastLvl > 0 && lvlName != lastLvl) {
                    if (lvlName > lastLvl) {
                        returnLevel.push("</ul>" + pendingEnd);
                        pendingEnd = "<ul style=\"display:none\">\n";
                        lastTagState = ' branch="true" class="closed"';
                        isTree = true;
                    } else {
                        while (lvlName < lastLvl && returnLevel.length > 0) {
                            if (pendingEnd.length > 0) {
                                localToc += pendingEnd;
                            }
                            pendingEnd = returnLevel.pop();
                            --lastLvl;
                        }
                    }
                }
                lastLvl = lvlName;
                if (lastTagState.length > 0 && lastTagPos > 0) {
                    localToc = localToc.substring(0, lastTagPos) + lastTagState + localToc.substring(lastTagPos);
                }
                if (pendingEnd.length > 0) {
                    localToc += pendingEnd;
                }
                if (returnLevel.length > 0) {
                    for (var j = 0; j < returnLevel.length; ++j) {
                        localToc += "  ";
                    }
                }
                localToc += "<li";
                lastTagPos = localToc.length;
                localToc += "><a href=\"#" + ln.name + "\" >" + ln.content + "</a>";
                pendingEnd = "</li>\n";
            }
            while (returnLevel.length > 0) {
                localToc += pendingEnd;
                pendingEnd = returnLevel.pop();
            }
            localToc += pendingEnd;
            localToc += "</ul>\n</div>";
            //if( isTree )
            localToc = "<div id=\"inline-toc\" onclick=\"localToClickHandler(event)\" >\n" + localToc;
            //else
            // localToc = "<div id=\"local-toc\">\n" + localToc;
            return localToc;
        }
        return "";
    };
    events.loadIndex = function(callback, basepath) {
        basepath = basepath || "/documentation/";
        // Load links file
        fs.readFile(linksFileName, "utf8", function(err, data) {
            var hashObj = {};
            if (err) {
                console.log("Error loading links.json " + err);
            } else {
                var srcObj = null;
                try {
                    srcObj = JSON.parse(data);
                } catch (err) {
                    console.log("Error parsing links.json " + err);
                }
                if (srcObj) {
                    for (var name in srcObj) {
                        var normalName = name.trim().toLowerCase();
                        var path = srcObj[name];
                        if (path.substring(0, 7) === "/pages/") {
                            path = basepath + path.substr(1);
                        }
                        hashObj[normalName] = path;
                    }
                }
            }
            callback(hashObj);
        });

        // Load aliases file
        fs.readFile(aliasesFile, "utf8", function(err, data) {
            var hashObj = {};
            if (err) {
                console.log("Error loading aliases.json " + err);
            } else {
                var srcObj = null;
                try {
                    srcObj = JSON.parse(data);
                } catch (err) {
                    console.log("Error parsing aliases.json " + err);
                }
                if (srcObj) {
                    aliases = srcObj;
                }
            }
        });
    };
    events.extractSymbols = function(txt, title, path) {
        var leading = [
            { "symbol": "*", "replace": "aster|" },
            { "symbol": "$", "replace": "dollr|" },
            { "symbol": "@", "replace": "amper|" },
            { "symbol": "{", "replace": "lcbrc|", "endsymbol": "}", "endreplace": "|rcbrc" }
        ];
        var i, j, k;
        var padText = " " + txt.toLowerCase() + " ";
        var symbols = " ",
            symbol;
        var words, word, parts, subparts;
        var originalTitle = title;

        if (!originalTitle) {
            originalTitle = txt;
        }
        if (title) {
            title = title.toLowerCase();
            padText = " " + title.trim() + padText;
        }
        if (path) {
            path = path.toLowerCase();
            if (path.indexOf('/ref/') >= 0) {
                if (path.indexOf('api/') >= 0) {
                    if (title.indexOf('_') >= 0) {
                        // Lets add words with underbars in title as symols (these get segmented)
                        words = title.split(" ");
                        for (i = 0; i < words.length; ++i) {
                            if (words[i].indexOf('_') > 0) {
                                symbols += words[i] + " ";
                            }
                        }
                    }
                }
            }
        } else if (!title) {
            words = txt.toLowerCase().split(" ");
            for (i = 0; i < words.length; ++i) {
                if (words[i].indexOf('_') > 0) {
                    symbols += words[i] + " ";
                }
            }
        }
        for (i = 0; i < leading.length; ++i) {
            if (padText.indexOf(" " + leading[i].symbol) >= 0) {
                words = padText.split(" " + leading[i].symbol);
                for (j = 0; j < words.length; ++j) {
                    if (leading[i].endsymbol) {
                        word = words[j].split(leading[i].endsymbol);
                        if (word.length > 1) {
                            symbol = leading[i].replace + word[0] + leading[i].endreplace + " ";
                            if (symbols.indexOf(" " + symbol) < 0) {
                                symbols += symbol;
                            }
                        }
                    } else {
                        word = words[j].split(" ")[0].split("(")[0];
                        if (word.length > 0) {
                            symbol = leading[i].replace + word + " ";
                            if (symbols.indexOf(" " + symbol) < 0) {
                                symbols += symbol;
                            }
                        }
                    }
                }
                changed = true;
            }
        }
        if (symbols.length > 1) {
            words = symbols.trim().split(" ");
            for (i = 0; i < words.length; ++i) {
                if (words[i].indexOf(".") > 0) {
                    parts = words[i].split('.');
                    for (j = 0; j < parts.length; ++j) {
                        symbol = parts.slice(0, j + 1).join('.') + " ";
                        if (symbols.indexOf(" " + symbol) < 0) {
                            symbols += symbol;
                        }
                        if (parts[j].indexOf("_") > 0) {
                            subparts = parts[j].split('_');
                            for (k = 0; k < subparts.length; ++k) {
                                symbol = subparts.slice(0, k + 1).join('_') + " ";
                                if (symbols.indexOf(" " + symbol) < 0) {
                                    symbols += symbol;
                                }
                                if (k > 0 && symbols.indexOf(" " + subparts[k]) < 0) {
                                    symbols += subparts[k] + " ";
                                }
                            }
                        }
                    }
                } else if (words[i].indexOf("_") > 0) {
                    parts = words[i].split('_');
                    for (j = 0; j < parts.length; ++j) {
                        symbol = parts.slice(0, j + 1).join('_') + " ";
                        if (symbols.indexOf(" " + symbol) < 0) {
                            symbols += symbol;
                        }
                        if (j > 0 && symbols.indexOf(" " + parts[j]) < 0) {
                            symbols += parts[j] + " ";
                        }
                    }
                }
            }
            symbols = symbols.split("|").join("_");
        }
        var splitByCase = function(caseword) {
            var subWords = [];
            var i;
            var lastType = null;
            var thisType;
            var wordStart = 0;
            for (i = 0; i < caseword.length; ++i) {
                var chr = caseword.charAt(i);
                if (/[A-Za-z]|[\u0080-\u024F]/.test(chr)) {
                    if (chr === chr.toUpperCase()) {
                        thisType = "u";
                    } else if (chr === chr.toLowerCase()) {
                        thisType = "l";
                    } else {
                        thisType = lastType;
                    }
                } else {
                    thisType = lastType;
                }
                if (i > 0 && thisType && thisType !== lastType) {
                    if (lastType === 'u' && thisType === 'l') {
                        if ((wordStart + 1) < i) {
                            subWords.push(caseword.substring(wordStart, i - 1));
                            wordStart = i - 1;
                        }
                    } else if ((wordStart + 1) < i) {
                        subWords.push(caseword.substring(wordStart, i))
                        wordStart = i;
                    }
                }
                lastType = thisType;
            }
            subWords.push(caseword.substring(wordStart));
            return subWords;
        };
        var originalTitleParts = originalTitle.split("_").join(".").split(".");
        for (i = 0; i < originalTitleParts.length; ++i) {
            var caseWords = splitByCase(originalTitleParts[i]);
            if (caseWords.length > 1) {
                // Search for case words
                for (j = 0; j < caseWords.length; ++j) {
                    var subword = caseWords[j].toLowerCase() + " ";
                    if (symbols.indexOf(" " + subword) < 0) {
                        symbols += subword;
                    }
                }
            }
        }
        // Add symbols to denote the separator that is being used
        if (symbols.indexOf("_") > 0) {
            symbols += "underbarseparated";
        }
        if (symbols.indexOf(".") > 0) {
            symbols += "dotseparated";
        }
        symbols = symbols.trim();
        if (symbols.length === 0) {
            if (!path && !title) {
                symbols = txt.toLowerCase().trim();
            }
        }
        originalTitle = originalTitle.trim();
        var specialChars = originalTitle;
        var anySymbol = [
            { "symbol": "%", "replace": " prcnt " },
            { "symbol": "<", "replace": " lssthn " },
            { "symbol": ">", "replace": " grtthn " },
            { "symbol": "=", "replace": " eqlcmp " },
            { "symbol": "!", "replace": " exclm " }
        ];
        for (i = 0; i < anySymbol.length; ++i) {
            if (specialChars.indexOf(anySymbol[i].symbol) >= 0) {
                specialChars = specialChars.split(anySymbol[i].symbol).join(anySymbol[i].replace);
                specialChars = specialChars.split("  ").join(" ");
            }
        }
        if (specialChars !== originalTitle) {
            symbols = symbols + " " + specialChars;
        }
        return symbols;
    };
    events.indexTitle = function(title) {
        var i;
        var extra = "";
        var anySymbol = [
            { "symbol": "%", "replace": "&#37;" },
            { "symbol": "<", "replace": "&lt;" },
            { "symbol": ">", "replace": "&gt;" },
            { "symbol": "=", "replace": "&#61;" },
            { "symbol": "!", "replace": "&#33;" },
            { "symbol": "$", "replace": "&#36;", "extra": "dllrsym " }
        ];
        for (i = 0; i < anySymbol.length; ++i) {
            if (title.indexOf(anySymbol[i].symbol) >= 0) {
                title = title.split(anySymbol[i].symbol).join(anySymbol[i].replace);
                if (anySymbol[i].extra)
                    extra += anySymbol[i].extra;
            }
        }
        if (extra.length > 0) {
            extra = extra.trim();
            title = title + "<!-- " + extra + " --->"
        }
        return title;
    };
    events.postProcessContent = function(data, basepath) {
		return pe.postProcessContent(data, basepath, help, aliases);
    };

    events.embedXmlPage = function(data) {
        var nested = data.split("<page depth=\"");
        if (nested.length > 1) {
            data = nested[0];
            for (var i = 1; i < nested.length; ++i) {
                var term = nested[i].indexOf('"');
                data += "<page depth=\"";
                if (term > 0) {
                    data += (parseInt(nested[i].substring(0, term)) + 1); // increase the initial depth
                    data += nested[i].substring(term);
                } else {
                    data += nested[i]
                }
            }
        }
        if (data.substring(0, 5) == "<page") {
            // Add depth to the page tag
            data = "<page depth=\"2\"" + data.substring(5);
        }
        return data;
    }

    events.canFlatten = function(pageName) {
        var flattenChildren = [
            { path: "/Ref/Client_Api/", level: 1 },
            { path: "/Ref/Api/Functions/", level: 2 },
            { path: "/Ref/Api/Namespace/", level: 1 },
            { path: "/Ref/Api/Objects/", level: 1 }
        ];
        for (var i = 0; i < flattenChildren.length; ++i) {
            var child = flattenChildren[i];
            var pos = pageName.indexOf(child.path);
            if (pos >= 0) {
                var part = pageName.substring(pos + child.path.length);
                if (child.level > 0) {
                    if (part.split('/').length > child.level) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    events.calculateFeedback = function(title, page, basepath) {
        basepath = basepath || "/documentation/";

        // rewrite to URL ENCODE THE URL.
        return "?subject=Problem with page: " + title + " [" + page + "]" + "&body=Describe problem with the %22https://documentation.alphasoftware.com" + basepath + "pages" + replaceAll(page, " ", "%2520").replace(".xml_html", ".xml") + "%22 documentation page (located 'c:\\dev\\AlphaHelp\\helpfiles" + replaceAll(page.replace(".xml_html", ".xml"), "/", "\\") + "'):";
    }

    //Modify the body record posted to elastic search
    //events.beforePageIndex = function (fo, body) {    
    //}

    // Hook for parsing the query command
    events.parseQuery = function(args) {
        var words = args.pattern.split(" ");
        if (words.length > 1) {
            if (words[0] === "in:title") {
                args.lookIn = "title";
                args.pattern = args.pattern.substr(8).trim();
            }
        }
    };

    events.noSearchResults = function(pattern) {
        var url = "mailto:"+helpEmail+"?subject=No Search Results Found for '" + pattern + "'&body=What can we help you find today?";
        return '<div id="search-no-results"><br><br><p>No results found.</p><p>Can\'t find what you\'re looking for? <a href="' + url + '">Contact us!</a></p></div>';
    };

    events.processForIndex = function(config, data, page, callbackPage, complete) {
        var annotations = extractTags(data, "<annotations>", "</annotations>");
        if (annotations) {
            var index = 0;
            var nextStep = function() {
                if (index < annotations.length) {
                    // Async replacements....
                    var thisAnnotation = annotations[index];
                    var annotationFile = annotationPath + thisAnnotation.trim();
                    ++index;
                    fs.readFile(annotationFile, "utf8", function(rErr, annotationConcat) {
                        if (!rErr) {
                            data += annotationConcat;
                        }
                        nextStep();
                    });
                } else {
                    complete(config, data, page, callbackPage);
                }
            };
            nextStep();
        } else {
            complete(config, data, page, callbackPage);
        }
    };

    events.missingPathPage = function(page, fromPath, req, callback, basepath) {
        basepath = basepath || "/documentation/";

        var pathParts = page.split('/');
        if (pathParts.length > 1 && pathParts[pathParts.length - 1] == '')
            dataOut = '<meta name="robots" content="noindex" /><meta http-equiv="refresh" content="0;URL=\'' + basepath + 'index?search=' + pathParts[pathParts.length - 2] + '" />';
        else
            dataOut = '<meta name="robots" content="noindex" /><meta http-equiv="refresh" content="0;URL=\'' + basepath + 'index?search=' + pathParts[pathParts.length - 1] + '" />';
        callback(null, dataOut);
    };

    // Modify elastic search query *before* it is run but *after* the default query has been built
    //events.beforeQuery = function (elast, args) {
    //};


    options.events = events;
    //    console.log("Run help server:" + runHelpServer);
    if (runHelpServer) {
        //--------------------------------------------------------------------------------------------
        var express = require('express');
        var app = express();
        help = Help(options);
        if (help.getAbsolutePath) {
            absolutePath = help.getAbsolutePath();
            //            console.log(absolutePath);
        }
        if (options.other) {
            for (var i = 0; i < options.other.length; ++i) {
                options.other[i].help = Help(loader(options.other[i].settings, false, searchLocalFlag, noSearchFlag));
                options.other[i].path = options.other[i].path.toLowerCase();
                if (options.other[i].help.getAbsolutePath) {
                    options.other[i].absolutePath = options.other[i].help.getAbsolutePath();
                }
            }
        }
        app.use("/", function(req, res) {
            if (options.stdHeaders) {
                var headerIndex;
                for (headerIndex in options.stdHeaders) {
                    res.setHeader(headerIndex, options.stdHeaders[headerIndex]);
                }
            }
            // If settings file defines 
            //   metadatafiles - an array of strings, for valid filenames
            //   metadatapath - the path these files are served from
            // then these will be served up.
            //   i.e.
            //   "metadatafiles" : "robots.txt",
            //   "metadatapath" : "/dev/AlphaHelp/metadata/",
            if (options.metadatafiles && help.config.metadatapath && req.path.length > 1 ) {                
                if(options.metadatafiles.indexOf(req.path.substring(1)) > -1) {
                    var metadataFile = help.config.metadatapath + req.path.substring(1);
                    var fs = require("fs");
                    fs.readFile(metadataFile, function(err, data) {
                        if( err ) {
                            res.status(404).send('Not found');
                        } else {
                            help.onSendExpress(res);
                            res.send(data);
                        }
                    });
                    return;
                }
            }
            if (req.path.substring(0, 10) == "/describe/" || req.path.substring(0, 14) == "/web/describe/") {
                var relPath = req.path.substring(9);
                if (req.path.substring(0, 14) == "/web/describe/")
                    relPath = req.path.substring(13);
                help.getmetadata(relPath, function(data) {
                    var htmlResult = "<table>";
                    htmlResult += "<tr> <th>File Location</th><td><input value=\"c:\\dev\\AlphaHelp\\helpfiles" + replaceAll(decodeURI(relPath), "/", "\\") + "\" style=\"width:7in;\" /><td></tr>";
                    if (data.status) {
                        htmlResult += "<tr> <th>Status</th><td><input value=\"" + data.status + "\" style=\"width:7in;\" /><td></tr>";
                    }
                    if (data.tags) {
                        htmlResult += "<tr> <th>Tags</th><td><input value=\"" + data.tags + "\" style=\"width:7in;\" /><td></tr>";
                    }
                    if (data.keywords) {
                        htmlResult += "<tr> <th>Keywords</th><td><input value=\"" + data.keywords + "\" style=\"width:7in;\" /><td></tr>";
                    }
                    if (data.notes) {
                        htmlResult += "<tr> <th>Notes</th><td><input value=\"" + data.notes + "\" style=\"width:7in;\" /><td></tr>";
                    }
                    htmlResult += "</table>";
                    help.onSendExpress(res);
                    res.send(htmlResult);
                });
            } else if (req.path.substring(0, 11) == "/structure/") {
                var relPath = req.path.substring(10);
                var manifestFile = help.config.generated + "manifest/" + replaceAll(unescape(relPath), '/', '_').replace(".html", ".json");
                var fs = require("fs");
                fs.readFile(manifestFile, function(err, data) {
                    var subtoc = {};
                    if (!err && data && data !== "") {
                        mdata = JSON.parse(data);
                        if (mdata.toc)
                            subtoc = mdata.toc;
                    }
                    help.onSendExpress(res);
                    res.send(JSON.stringify(subtoc));
                });
            } else if (req.path.substring(0, 9) == "/schemas/") {
                res.type('json');
                if (req.path.indexOf('..') >= 0) {
                    // Guard against escape path....
                    res.send('{ "error" : "schema definition not found." }');
                } else {
                    require('fs').readFile(help.config.generated + "/.." + req.path, function(err, data) {
                        if (err) {
                            res.send('{ "error" : "schema definition not found." }');
                        } else {
                            res.send(data);
                        }
                    });
                }
            } else if (req.path === "/apihelp") {
                help.search(req.query.topic, function(err, data) {
                    if (err) {
                        help.onSendExpress(res);
                        res.send(JSON.stringify({ error: err }));
                    } else {
                        // search through the data
                        var lookFor = "api/";
                        var foundItem = null;
                        var i;
                        for (i = 0; i < data.length; ++i) {
                            if (data[i].path.toLowerCase().indexOf(lookFor) >= 0) {
                                foundItem = data[i];
                                break;
                            }
                        }
                        if (foundItem) {
                            var redirectToPage = false;
                            if (req.query.getpage) {
                                if (req.query.getpage === "true") {
                                    redirectToPage = true;
                                }
                            }
                            if (redirectToPage) {
                                // don't want to use /documentation/, but it is not critical to make this case work with /transformDocumentation/
                                res.redirect(absolutePath + "pages" + foundItem.path);
                            } else {
                                help.onSendExpress(res);
                                res.send(JSON.stringify(foundItem));
                            }
                        } else {
                            // TBD - show the 'not-found' page with results...
                            help.onSendExpress(res);
                            if (data.length > 0)
                                res.send(JSON.stringify({ error: "No API matches found for " + req.query.topic, closest: data }));
                            else
                                res.send(JSON.stringify({ error: "No matches found for " + req.query.topic }));
                        }
                    }
                }, 0, 20);
            } else if (req.path.substring(0, 8) === '/images/') {
                res.redirect("/help" + req.path);
            } else if ((req.path + ".").indexOf('/favicon.') >= 0) {
                require('fs').readFile(options.assetpath + "assets/favicon.ico", function(err, data) {
                    if (!err && data) {
                        res.setHeader('Content-Type', 'image/x-icon');
                        res.send(data);
                    } else {
                        console.log("favicon is missing");
                    }
                });
            } else if ((req.path.toLowerCase() === '/') ||
                (req.path.toLowerCase() === '/pages') ||
                (req.path.toLowerCase() === '/pages/') ||
                (req.path.toLowerCase() === '/pages/index.html') ||
                (req.path.toLowerCase() === '/documentation') ||
                (req.path.toLowerCase() === '/documentation/') ||
                (req.path.toLowerCase() === '/documentation/pages') ||
                (req.path.toLowerCase() === '/documentation/pages/') ||
                (req.path.toLowerCase() === '/documentation/pages/index.html')) {
                var path = "/index.html";
                help.get(path, function(err, data, type) {
                    if (err) {
                        help.onSendExpress(res);
                        res.send(err);
                    } else {
                        if (type) {
                            res.type(type);
                        }
                        help.onSendExpress(res);
                        res.send(data);
                    }
                });
            } else {
                var helpHandler = help;
                if (options.other) {
                    // Find alternate handlers....
                    for (var i = 0; i < options.other.length; ++i) {
                        if ((req.path + "/").substr(0, options.other[i].path.length).toLowerCase() === options.other[i].path) {
                            helpHandler = options.other[i].help;
                        }
                    }
                }
                var pagePrefix = helpHandler.getAbsolutePath().toLowerCase();
                if ((req.path.toLowerCase() === pagePrefix + 'pages/index.html') ||
                    (req.path.toLowerCase() === pagePrefix) ||
                    (req.path.toLowerCase() === pagePrefix.substr(0, pagePrefix.length - 1)) ||
                    (req.path.toLowerCase() === pagePrefix + 'pages/') ||
                    (req.path.toLowerCase() === pagePrefix + 'pages')) {
                    var path = "/index.html";
                    helpHandler.get(path, function(err, data, type) {
                        if (err) {
                            helpHandler.onSendExpress(res);
                            res.send(err);
                        } else {
                            if (type) {
                                res.type(type);
                            }
                            helpHandler.onSendExpress(res);
                            res.send(data);
                        }
                    });
                } else {
                    helpHandler.expressuse(req, res);
                }
            }

            // Removing. Auto-refresh is crashing; suspect links.json has grown too large
            // use /refresh endpoint for now
            //if (req.path.toLowerCase().indexOf(".xml") !== -1 && noSearchFlag) {
                //helpHandler.refresh(function() {}); 
            //}
        });
        if (options.useSSL) {
            // HTTP redirects to HTTPS...
            var http = require('http');
            var appRD = express();
            appRD.use("/", function(req, res) {
                res.redirect('https://' + req.headers.host + req.url);
            })
            var httpServer = http.createServer(appRD);
            httpServer.listen(options.port);
        } else {
            app.listen(options.port);
        }
        if (https_credentails) {
            var https = require('https');
            var httpsServer = https.createServer(https_credentails, app);
            httpsServer.listen(options.https_port, function() {
                console.log('Listening on ports ' + options.port + " and " + options.https_port);
            });
        } else {
            console.log('Listening on port ' + options.port);
        }
    }
    return options;
};

if (require.main === module) {
    runHelpServer = true;
    for (arg in process.argv) {
        if (process.argv[arg].search("-nosearch") !== -1 || process.argv[arg].search("-ns") !== -1) {
            noSearchFlag = true;
        }
        if (process.argv[arg].search("-local") !== -1 || process.argv[arg].search("-l") !== -1) {
            searchLocalFlag = true;
        }
        if (process.argv[arg].search("-help") !== -1 || process.argv[arg].search("-h") !== -1) {
            console.log("Help for helpserver.js");
            console.log("=================================================================================");
            console.log("Input Flags:\n");
            console.log("-nosearch, -ns                     Start helpserver without elastic search");
            console.log("-local, -l                         Start helpserver using local search");
            console.log("-settings, -s [file]               Specify a settings file.");
            console.log("-help, -h                          Displays this help message.\n");
            console.log("=================================================================================");
            return;
        }
        if (process.argv[arg].search("-settings") !== -1 || process.argv[arg].search("-s") !== -1) {
            settingsOverride = process.argv[parseInt(arg, 10) + 1];
            console.log(settingsOverride);
        }
    }
    if (searchLocalFlag) {
        loader(settingsOverride || "./settingslocal", runHelpServer, searchLocalFlag, noSearchFlag);
    } else if (noSearchFlag) {
        loader(settingsOverride || "./settingsnosearch", runHelpServer, searchLocalFlag, noSearchFlag);
    } else {
        loader(settingsOverride || "./settings", runHelpServer, searchLocalFlag, noSearchFlag);
    }
} else {
    // Defferred load....
    exports.loader = loader;
}