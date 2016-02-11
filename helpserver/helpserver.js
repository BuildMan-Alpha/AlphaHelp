var express = require('express');
var app = express();
var options = require("./settings");
var library = require("./assets/library");
var Help = require('helpserver');
var replaceAll = function (str, find, replace) {
    while (str.indexOf(find) >= 0)
        str = str.replace(find, replace);
    return str;
};

var events = {};
var tocData = { altTocs : [] , defaultPathMetadata : [] };
options.library = library;

var collectAltToc = function(books) {
    if( books && books.length > 0 ) {
        var i;
        for( i = 0 ; i < books.length ; ++i ) {
            if( books[i].href ) {
                var href = books[i].href;
                if( href.substring(0,7) == "/pages/" ) {
                    href = href.substring(6);
                }
                var pathEnd = href.lastIndexOf('/');
                if( pathEnd > 0 ) {
                    href = href.substring(0,pathEnd+1);
                    tocData.altTocs.push( href );
                    tocData.defaultPathMetadata.push({
                            "name": href,
                            "metadata": {
                                "tags": "common",
                                "status": "accept"
                            }
                        });
                }
            }
            if( books[i].books ) {
                collectAltToc( books[i].books );
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
var outputSnippet = function(args,description,type) {
    var result = "";
    if( args.isFolder ) {
        if( args.format == ".xml" ) {
            args.path = args.path + "/index.xml"; 
        }
    }
    if( description ) {
        if( args.format == ".xml" ) {
            if( description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0)
                description = "<![CDATA["+description+"]]>";
                if( type == "method" ) {
                    result =  "<methodref><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.path + "\">" + args.name + "</ref><description>" + description + "</description></methodref>";
                } else {
                    result =  "<item><name href=\"" + args.path + "\">" + args.name + "</name><description>" + description + "</description></item>";
                }
        } else {
                result = "<dt><a href='" + args.path + "' >" + args.name + "</a></dt>\n<dd>" + description + "</dd>";
        }
    } else {
        if( args.format == ".xml" ) {
            if( type == "method" ) {
                result = "<methodref><name>" + args.name + "</name><ref href=\"" + args.path + "\">" + args.name + "</ref></methodref>";
            } else  {
                result = "<item><name href=\"" + args.path + "\">" + args.name + "</name></item>";
            }
        } else {
            result = "<dt><a href='" + args.path + "' >" + args.name + "</a></dt>";
        }
    }
    return result;
}

events.pageIndexer = function (args, savePage) {
    // just error out for now...
    var filename = args.filename;
    var type = null;
    if( args.all ) {
        var i;
        var methodFiles = 0;
        var nonMethodFiles = 0;
        for( i = 0 ; i < args.all.length ; ++i ) {
            var testName = args.all[i].path.toLowerCase();
            var pathEnd = testName.lastIndexOf('/');
            if( pathEnd > 0 )
                testName = testName.substring(pathEnd);
            if( testName != '/index.xml' ) {
                if( testName.indexOf(' method.') > 0 ) {
                    ++methodFiles;
                } else {
                    ++nonMethodFiles;
                }
            }    
        }
        if( methodFiles > 0 && nonMethodFiles == 0 ) {
            type = "method";
        }
        
    }
    var extensionIndex = filename.lastIndexOf(".");    
//    if( filename.indexOf("/index.xml") >= 0 || filename.indexOf("/index.html") >= 0 ) {
//        debugger;
//    }
    if (filename.substring(extensionIndex).toLowerCase() == ".xml" ) { //&& filename.indexOf("/index.xml") < 0) {
        var fs = require("fs");
        fs.readFile(filename, "utf8", function (err, data) {
            if (err) {
                console.log(filename + " was not found");
                savePage(outputSnippet(args,null,type));
            } else {
                var parseString = require('xml2js').parseString;
                parseString(data, function (err, result) {
                    var description = null;
                    if (err) {
                        console.log(err + " processing file " + filename);
                    } else {
                        result = eval(result);
                        if (result) {
                            if (result.page) {
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
                    savePage(outputSnippet(args,description,type));
                });
            }
        });
    } else {
        savePage(outputSnippet(args,null,type));
    }
};

events.wrapIndex = function( args ) {
    var result = "";
    if( args.format == ".xml" ) {
        if( args.content.substring(0,10) == "<methodref" ) {
            result = "<methods>"+args.content+"</methods>"
        } else {
            result = "<list><item><name-title>Name</name-title></item>"+args.content+"</list>";
        }
    } else {
        result = "<dl id='generatedTopics'>"+args.content+"</dl>";
    }
    return result;
};

events.getDefaultIndexTemplate = function( args ) {
    var result = "";
    if( args.format == ".xml" ) {
        result = "<page><!--list:.--></page>";
    } else {
        result = "<html><body><!--list:.--></body></html>";
    }
    return result;
};
//--------------------------------------------------------------------------------------
var xsltproc = require('xsltproc');
events.translateXML = function(xmlFile,htmlFile,callback) {
   var xslt = xsltproc.transform(options.assetpath+'assets/xform.xslt', xmlFile);
   var err = null;
   var dataOut = '';
   xslt.stdout.on('data', function (data) {
      dataOut += data;
   }); 
   xslt.stderr.on('data', function (data) {
      err = data;
   }); 
   xslt.on('exit', function (code) {
      if( err ) {
           callback(err,null);
      } else {
           var fs = require('fs');
           fs.writeFile(htmlFile,dataOut,function(err) {
               callback(err,dataOut);
           });
      }
   });
};
events.beforeRefresh = function() {
    
};
options.events = events;
//--------------------------------------------------------------------------------------------
var help = Help(options);

app.use("/", function (req, res) {
    if (req.path.substring(0, 10) == "/describe/" || req.path.substring(0, 14) == "/web/describe/") {
        var relPath = req.path.substring(9);
        if (req.path.substring(0, 14) == "/web/describe/")
            relPath = req.path.substring(13);
        help.getmetadata(relPath, function (data) {
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
        fs.readFile(manifestFile, function (err, data) {
            var subtoc = {};
            if (!err && data && data !== "") {
                mdata = JSON.parse(data);
                if (mdata.toc)
                    subtoc = mdata.toc;
            }
            help.onSendExpress(res);
            res.send(JSON.stringify(subtoc));
        });
    } else if (req.path == "/apihelp" || req.path == "/web/apihelp" || req.path == "/web/main/apihelp") {
        help.search(req.query.topic, function (err, data) {
            if (err) {
                help.onSendExpress(res);
                res.send(JSON.stringify({ error: err }));
            } else {
                // search through the data
                var lookFor = "/design/api/";
                var foundItem = null;
                var i;
                for (i = 0; i < data.length; ++i) {
                    if (data[i].path.toLowerCase().indexOf(lookFor) >= 0) {
                        foundItem = data[i];
                        break;
                    }
                }
                if (foundItem) {
                    help.onSendExpress(res);
                    res.send(JSON.stringify(foundItem));
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
    } else if (req.path.substring(0, 8) == '/images/') {
        res.redirect("/help" + req.path);
    } else {
        help.expressuse(req, res);
    }
});

app.listen(options.port);
console.log('Listening on port ' + options.port);