var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var options = require("./settingsnosearch");
var library = require("./assets/library");
var Help = require('helpserver');
var fs = require("fs");
var replaceAll = function(str, find, replace) {
    while (str.indexOf(find) >= 0) {
        str = str.replace(find, replace);
    }
    return str;
};

fs.readFile("../generated/helpserver_error.log","utf8",function(err,contents) {
     if(!err && contents ) {
        console.log(contents);
        fs.unlink("../generated/helpserver_error.log");
     } 
});

// report error from node..
process.on('uncaughtException', function (err) {
    try {
        var nodeErrorLog = "Helpserver crashed\n" + (new Date).toUTCString() + ' uncaughtException:' + err.message + "\n\nCallstack:\n" + err.stack;
        fs.writeFile( "../generated/helpserver_error.log" , nodeErrorLog , function(err2) {
            process.exit(1);			
        });
    } catch(err2) {		 
        console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
});

// Check for required folders...
if (!fs.existsSync(options.generated)) {
    fs.mkdirSync(options.generated);
}
if (!fs.existsSync(options.generated + "/topics")) {
    fs.mkdirSync(options.generated + "/topics");
}
if (process.platform == "win32") {
    // If windows platform, check that windows port of 'xsltproc' is available...
    if (!fs.existsSync("./xsltproc.exe")) {
        function copyFile(source, target) {
            var rd = fs.createReadStream(source);
            var wr = fs.createWriteStream(target);
            rd.pipe(wr);
        }
        copyFile("./xsltproc_win/xsltproc.exe","./xsltproc.exe");
        copyFile("./xsltproc_win/iconv.dll","./iconv.dll");
        copyFile("./xsltproc_win/libexslt.dll","./libexslt.dll");
        copyFile("./xsltproc_win/libxml2.dll","./libxml2.dll");
        copyFile("./xsltproc_win/libxslt.dll","./libxslt.dll");
        copyFile("./xsltproc_win/msvcr71.dll","./msvcr71.dll");
        copyFile("./xsltproc_win/zlib1.dll","./zlib1.dll");
    }
}


var events = {};
var tocData = { altTocs: [], defaultPathMetadata: [] };
options.library = library;

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
var outputSnippet = function(args, description, type, topic ) {
    var result = "";
    if (args.isFolder) {
        if (args.format == ".xml") {
            args.path = args.path + "/index.xml";
        }
    }
    if( !topic ) {
       topic = args.name;
       if( !topic ) {
           topic = "Unknown";   
       }
    }
    if (topic.indexOf('<') >= 0 || topic.indexOf('>') >= 0 || topic.indexOf('&') >= 0) {
         topic = "<![CDATA[" + topic + "]]>";
    }
    
    if (description) {
        if (args.format == ".xml") {
            if( description.indexOf ) {
                if (description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0) {
                    description = "<![CDATA[" + description + "]]>";
                }
            } else if( description.p ) {
                if( description.p.length > 0 ) {
                    try  {
                        description = description.p[0];
                        if (description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0) {
                            description = "<![CDATA[" + description + "]]>";
                        }
                    } catch( err2 ) {
                        
                    }
                }
            }
            if (type == "method") {
                result = "<methodref><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.path + "\">" + args.name + "</ref><description>" + description + "</description></methodref>";
            } else {
                result = "<item><name href=\"" + args.path + "\">" + topic + "</name><description>" + description + "</description></item>";
            }
        } else {
            result = "<dt><a href='" + args.path + "' >" + topic + "</a></dt>\n<dd>" + description + "</dd>";
        }
    } else {
        if (args.format == ".xml") {
            if (type == "method") {
                result = "<methodref><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.name + "</ref></methodref>";
            } else {
                result = "<item><name href=\"" + args.path + "\">" + topic + "</name></item>";
            }
        } else {
            result = "<dt><a href='" + args.path + "' >" + topic + "</a></dt>";
        }
    }
    return result;
}

events.pageIndexer = function(args, savePage) {
    // just error out for now...
    var filename = args.filename;
    var type = null;
    if (args.all) {
        var i;
        var methodFiles = 0;
        var nonMethodFiles = 0;
        for (i = 0; i < args.all.length; ++i) {
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
        }
        if (methodFiles > 0 && nonMethodFiles == 0) {
            type = "method";
        }
    }
    if( filename.indexOf('#') > 0 ) {
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
                savePage(outputSnippet(args, null, type));
            } else {
                var parseString = require('xml2js').parseString;
                parseString(data, function(err, result) {
                    var description = null;
                    var topic = null;
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
                            }
                        }
                    }
                    savePage(outputSnippet(args, description, type , topic ));
                });
            }
        });
    } else if (filename.substring(extensionIndex).toLowerCase() == ".html") { //&& filename.indexOf("/index.xml") < 0) {
        var fs = require("fs");
        fs.readFile(filename, "utf8", function(err, data) {
            var description = null;
            if( !err ) {
                var metaDataTags = data.split("<meta");
                if( metaDataTags.length > 1) {
                    var i;
                    for( i = 1 ; i < metaDataTags.length ; ++i ) {
                        var nameAttribute = metaDataTags[i].split('>')[0].split("name=");
                        if( nameAttribute.length > 1 ) {
                            nameAttribute =  nameAttribute[1].split('"');
                            if( nameAttribute.length > 1 ) {
                                if( nameAttribute[1].toLowerCase() == "description" ) {
                                     var contentAttribute = metaDataTags[i].split("content=");
                                     if( contentAttribute.length > 1 ) {
                                        contentAttribute = contentAttribute[1].split('"');
                                        if( contentAttribute.length > 1 ) {
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
            savePage(outputSnippet(args, description, type));
        });
    } else {
        savePage(outputSnippet(args, null, type));
    }
};

events.wrapIndex = function(args) {
    var result = "";
    if (args.format == ".xml") {
        if (args.content.substring(0, 10) == "<methodref") {
            result = "<methods>" + args.content + "</methods>"
        } else {
            result = "<list><item><name-title>Name</name-title></item>" + args.content + "</list>";
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
var xsltproc = require('xsltproc');
events.translateXML = function(xmlFile, htmlFile, callback) {
    var xslt = xsltproc.transform(options.assetpath + 'assets/xform.xslt', xmlFile);
    var err = null;
    var dataOut = '';
    xslt.stdout.on('data', function(data) {
        dataOut += data;
    });
    xslt.stderr.on('data', function(data) {
        err = ''+data;
    });
    xslt.on('exit', function(code) {
        if (err) {
            var fs = require('fs');
            fs.readFile(xmlFile, "utf8",function(err2,errPage) {
                if( err2 ) {
                    callback(err2, null);
                } else {
                    var errparts = err.split(':');
                    var index = -1;
                    if( errparts.length > 2 ) {
                        index = parseInt(errparts[1]);                        
                    }   
                    var completeErrPage = function(index) {
                        errPage = replaceAll(errPage,"<amp>;","&amp;");
                        errPage = replaceAll(errPage,"<","&lt;");
                        errPage = replaceAll(errPage,">","&gt;");         
                        errPage = replaceAll(errPage,"&lt;amp&gt;","&amp;");
                        
                        var lines = errPage.split('\n');
                        if( 0 <= index && index < 10000000 )
                        {
                            if( index < lines.length ) {
                                lines[index] = "<span style=\"color:red;background:yellow;\">"+lines[index]+"</span>";
                            }
                        }
                        for( var i = 0 ; i < lines.length ; ++i ) {
                            lines[i] = "<span style=\"background:#bbb;\">"+String("00000" + i).slice(-5)+"&nbsp;</span>" + lines[i];
                        }
                        errPage = lines.join("\n");
                        errPage = "<b>Error Encountered</b><br><div>"+err+"</div><pre>"+errPage+"</pre>";
                        callback(null, errPage);                        
                    };
                    if( index < 0 ) {
                        var parseString = require('xml2js').parseString;
                        parseString(errPage, function(err, result) {
                            var description = null;
                            if (err) {
                                var lineArg = (''+err).split('Line:');
                                if( lineArg.length > 1 ) {
                                    index = parseInt( lineArg[1].split('\n')[0].trim() );
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
            fs.writeFile(htmlFile, dataOut, function(err) {
                callback(err, dataOut);
            });
        }
    });
};
events.beforeRefresh = function() {

};
events.extractTitle = function(page) {
    var topicStart = page.indexOf("<topic>");
    if (topicStart > 0) {
        var topicEnd = page.indexOf("</topic>");
        topicStart += 7;
        if (topicEnd > topicStart) {
            var topic = page.substring(topicStart, topicEnd).trim();
            if (topic.length > 0)
                return topic;
        }
    }
    return null;
}
events.extractDescription = function(page) {
    var descriptionStart = page.indexOf("<description>");
    var endArgument = page.indexOf("</argument");
    if( endArgument > descriptionStart ) {
        var startArgument = page.indexOf("<argument");
        if( startArgument > 0 && startArgument < descriptionStart ) {
            page = page.substring(endArgument);
            descriptionStart = page.indexOf("<description>");
        }
    }
    if( descriptionStart > 0 ) {
        var descriptionEnd = page.indexOf("</description>");
        descriptionStart += 13;
        if( descriptionEnd > descriptionStart ) {
            var  description = page.substring(descriptionStart,descriptionEnd).trim();
            if( description.substring(0,9) == "<![CDATA[" ) {
                description = description.substring(9).trim();
                var endTagPos = description.lastIndexOf("]]>");
                if( endTagPos > 0 ) {
                    description = description.substring(0,endTagPos);
                }
            }
            if( description.length > 0 )
                return description;
        }
    }
    return null;
}

events.decorateTitle = function(title) {
   if( title.indexOf('Api') >= 0 ) {
       if( title == 'Api' ) {
           title = "API";
       } else if( title == "Client_Api" ) {
           title = "Client API";
       } else if( title == "Desktop_Api" ) {
           title = "Desktop API";
       }
   }
   return title;  
};
events.addPageSourceComment = function(page,symName) {
    var pageSource;
    page = page.replace(".xml_html",".xml");
    pageSource = "<!-- page location: c:\\dev\\AlphaHelp\\helpfiles"+replaceAll(page,'/','\\')+" -->";
    if( symName ) {
        pageSource += "\n    <!-- link:  *[link:"+symName+"]* -->";
    }
    return pageSource;
};
events.generateLocalToc = function(localNames) {
   if( localNames.length > 1 ) { 
        var localToc = "<div class=\"local-toc-title\">IN THIS PAGE</div>\n<ul>\n";
        var lastLvl = -1;
        var pendingEnd = "";
        var returnLevel = [];
        var lastTagPos = -1;
        var isTree = false;
        for( var i = 0 ; i < localNames.length ; ++i ) {
            var ln = localNames[i];
            var lvlName = ln.name.toLowerCase().split('_')[0];
            var parentNode = false;
            var lastTagState = ' class="leaf"';
            if( lvlName == 'group' ) {
                lvlName = 1;
            } else if( lvlName == 'section' ) {
                lvlName = 2;
            } else {
                lvlName = 3;
            }
            if( lastLvl > 0 && lvlName != lastLvl ) {
                if( lvlName > lastLvl ) {
                    returnLevel.push("</ul>"+pendingEnd);
                    pendingEnd = "<ul style=\"display:none\">\n";
                    lastTagState = ' branch="true" class="closed"'; 
                    isTree = true;
                } else {
                    while( lvlName < lastLvl && returnLevel.length > 0 ) {
                        if( pendingEnd.length > 0 ) {
                            localToc += pendingEnd;
                        }
                        pendingEnd = returnLevel.pop();
                        --lastLvl;
                    }
                }
            }
            lastLvl = lvlName;
            if( lastTagState.length > 0 && lastTagPos > 0 ) {
                localToc = localToc.substring(0,lastTagPos) + lastTagState + localToc.substring(lastTagPos);
            }
            if( pendingEnd.length > 0 ) {
                localToc += pendingEnd;
            }
            if( returnLevel.length > 0 ) {
                for( var j = 0 ; j < returnLevel.length ; ++j ) {
                    localToc += "  ";
                }
            }
            localToc += "<li";
            lastTagPos = localToc.length;
            localToc += "><a href=\"#"+ln.name+"\" >"+ln.content+"</a>";
            pendingEnd = "</li>\n";
        }
        while( returnLevel.length > 0 ) {
            localToc += pendingEnd;
            pendingEnd = returnLevel.pop();
        }
        localToc += pendingEnd;
        localToc += "</ul>\n</div>";
        if( isTree )
            localToc = "<div id=\"inline-toc\" onclick=\"localToClickHandler(event)\" >\n" + localToc;
        else
            localToc = "<div id=\"local-toc\">\n" + localToc;
        return localToc;  
   }
   return "";
};

events.loadIndex = function(callback) {
    fs.readFile("../links.json","utf8",function(err,data) {
         var hashObj = {};
         var srcObj = null;
         try {
             srcObj = JSON.parse(data);
         } catch(err) {            
         }
         if( srcObj ) {
             for( var name in srcObj ) {
                 var normalName = name.trim().toLowerCase();
                 hashObj[normalName] = srcObj[name];
             }
         }
         callback(hashObj);
    });
};

var createBrokenLinkEmail =  function(problems) {
    var i;
    var message = "";
    for( i = 0 ; i < problems.length ; ++i ) {
        message = "Link ["+problems[i].name+"] has path that cannot be resolve: "+problems[i].path+"\n";
    }
var emailcred = require("./emailcred");

var nodemailer = require('nodemailer'); 
// create reusable transporter object using the default SMTP transport 
var transporter = nodemailer.createTransport('smtps://'+emailcred.user+":"+emailcred.password+"@"+emailcred.host);
 
// setup e-mail data with unicode symbols 
var mailOptions = {
    from: emailcred.user, // sender address 
    to: 'documentation@alphasoftware.com', // list of receivers 
    subject: 'Problem with links', // Subject line 
    text: message, 
};
 
// send mail with defined transport object 
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});
} 

events.postProcessContent = function(data) {
    if( data.indexOf("*[")) {
        var metaDescriptionPos = data.indexOf('<meta name="description"');
        if( metaDescriptionPos >= 0 ) {
            var contentSearch = 'content="'+data.substring(metaDescriptionPos).split('"')[3]+'"';
            var contentReplace = contentSearch.split("*[").join("").split("]*").join();
            if( contentSearch != contentReplace ) {
                data = data.split(contentSearch).join(contentReplace);
            }
        }
        var items = data.split("*[");
        var i;
        var newData = items[0];
        for( i = 1 ; i < items.length ; ++i ) {
            var emph = items[i];
            var endPos = emph.indexOf(']*'); 
            if( endPos > 0 ) {
                var remainder = emph.substring(endPos+2);
                emph = emph.substring(0,endPos);
                var typeSeparator = emph.indexOf(':');
                var snippet = "<b>"+emph+"</b>";
                if( typeSeparator > 0 ) {
                    var typeName = emph.substring(0,typeSeparator);
                    if( typeName.indexOf(' ') < 0 ) {
                        if( typeName == 'http' || typeName == 'https' || typeName == 'ftp' || typeName == 'ftps' ) {
                             typeName = "link"; // implicit link....
                        } else {     
                             emph = emph.substring(typeSeparator+1);
                        }
                        snippet = '<span class="emphasize-'+typeName+'">'+emph+"</span>";
                        if( typeName == "link" || typeName == 'download' || typeName == 'video' || typeName == 'extlink' ) {
                            var isURI = function(sample) {
                                var uriParts = sample.split(':');
                                if( uriParts.length > 1 ) {
                                    if( uriParts[0] == 'http' || uriParts[0] == 'https' || uriParts[0] == 'ftp' || uriParts[0] == 'ftps' ) {
                                        return true;
                                    }
                                }
                                return false;                                
                            }
                            var linkdef = emph;
                            var atSignPos = linkdef.indexOf("@");
                            if( atSignPos > 0 ) {
                                if( linkdef.substring(0,7) != "mailto:" ) {
                                    linkdef = linkdef.substring(atSignPos+1);
                                    if( linkdef ) {
                                        if( !isURI(linkdef) ) {
                                            linkdef = help.lookupLink(linkdef);
                                        }
                                        if( linkdef ) {
                                            emph = emph.substring(0,atSignPos);
                                        }
                                    }
                                }
                            } else {
                                linkdef = help.lookupLink(linkdef);
                            }
                            if( !linkdef ) { // If no symbolic match, lets see if we have a symbolic value
                                if( isURI(emph) ) {
                                    linkdef = emph;
                                }
                            }
                            if( linkdef ) {
                                if( typeName == "link" ) {
                                    snippet = '<a href="'+linkdef+'">'+emph+"</a>";
                                } else if( typeName == "extlink" ) {
                                    snippet = '<a href="'+linkdef+'" target="_blank" >'+emph+"</a>";
                                } else {
                                    snippet = '<a href="'+linkdef+'" target="_blank" class="emphasize-'+typeName+'">'+emph+"</a>";
                                }
                            }
                        } 
                    }
                }
                newData += snippet + remainder;
            } else if( emph.length > 0 || (i+1) >= items.length ) {
                newData += "*["+emph;
            } else {
                ++i;
                newData += "*["+emph+item[i];
            }
        }
        data = newData;
    }
    return data;
};

options.events = events;
//--------------------------------------------------------------------------------------------

var help = Help(options);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", function(req, res) {
    if (req.path == "/test") {
        res.end(JSON.stringify(req.body, null, 2))
    } else if( req.path == "/validateLinks") {
        var validateLinks = require("./node_modules/helpserver/validateLinksFile.js");
        validateLinks("../links.json", "../helpfiles",function(result) {
            if( result.problems ) {
                createBrokenLinkEmail(result.problems);
            }
            res.end(JSON.stringify(result, null, 2));
        });
    } else if (req.path.substring(0, 10) == "/describe/" || req.path.substring(0, 14) == "/web/describe/" || req.path.substring(0, 14) == "/web/main/describe/") {
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
            console.log(JSON.stringify(data));
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
    } else if (req.path == "/apihelp" || req.path == "/web/apihelp") {
        help.search(req.query.topic, function(err, data) {
            if (err) {
                help.onSendExpress(res);
                res.send("Error doing search " + err);
            } else {
                // search through the data
                var lookFor = "/design/api/";
                var foundItem = null;
                var i;
                for (i = 0; i < data.length; ++i) {
                    if (data[i].path.toLowerCase().indexOf(lookFor) >= 0) {
                        foundItem = data[i];
                        break;
                    } else {
                        console.log("Miss " + data[i].path);
                    }
                }
                if (foundItem) {
                    if (foundItem.hash) {
                        res.redirect("/main#" + foundItem.path + "#" + foundItem.hash);
                    } else {
                        console.log('lookup ' + foundItem.path)
                        res.redirect("/main#" + foundItem.path);
                    }
                } else {
                    // TBD - show the 'not-found' page with results...
                    help.onSendExpress(res);
                    res.send("No matches found for " + req.query.topic);
                }
            }
        }, 0, 20);
    } else if (req.path.substring(0, 8) == '/images/') {
        res.redirect("/help" + req.path);
    } else {
        help.expressuse(req, res);
    }
});

app.listen(options.port);
console.log('Listening on port ' + options.port);

// test if we need to do initial refresh
if (!fs.existsSync(options.generated + "/_alltree.json")) {
    console.log("Initial refresh...");
    help.refresh(function (err, result) {
        console.log("Refresh complete...");
    });
}
