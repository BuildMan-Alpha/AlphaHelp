
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var options = require("./settingslocal");
var library = require("./assets/library");
var Help = require('helpserver');
var replaceAll = function (str, find, replace) {
    while (str.indexOf(find) >= 0) {
        str = str.replace(find, replace);
    }
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
            if( description.indexOf('<') >= 0 || description.indexOf('>') >= 0 || description.indexOf('&') >= 0) {
                description = "<![CDATA["+description+"]]>";
            }
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
            if( args.all[i].path ) {
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
events.extractTitle = function(page) {
    var topicStart = page.indexOf("<topic>");
    if( topicStart > 0 ) {
        var topicEnd = page.indexOf("</topic>");
        topicStart += 7;
        if( topicEnd > topicStart ) {
            var  topic = page.substring(topicStart,topicEnd).trim();
            if( topic.length > 0 )
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
events.addPageSourceComment = function(page) {
    page = page.replace(".xml_html",".xml");
    return "<!-- page location: c:\\dev\\AlphaHelp\\helpfiles"+replaceAll(page,'/','\\')+" -->";
}
events.extractSymbols = function(txt,title,path) {
     var leading = [
      { "symbol" : "*" , "replace" : "aster|"}  ,
      { "symbol" : "$" , "replace" : "dollr|" } ,
      { "symbol" : "@" , "replace" : "amper|" } ,
      { "symbol" : "{" , "replace" : "lcbrc|" , "endsymbol" :  "}" , "endreplace" : "|rcbrc" } 
     ];
     var i , j;
     var padText = " "+txt.toLowerCase()+" ";
     var symbols = " " , symbol;
     var words , word , parts;
     if( title ) {
         title = title.toLowerCase();
         padText = " "+ title.trim() + padText;
     }
     if( path ) {
         path = path.toLowerCase();
         if( path.indexOf('/ref/') >= 0 ) {
             if( path.indexOf('api/') >= 0 ) {
                 if( title.indexOf('_') >= 0 ) {
                     // Lets add words with underbars in title as symols (these get segmented)
                     words = title.split(" ");
                     for( i = 0 ; i < words.length ; ++i ) {
                         if( words[i].indexOf('_') > 0 ) {
                             symbols += words[i]+" ";
                         }
                     }
                 }
             }
         }
     } else if( !title ) {
        words = txt.toLowerCase().split(" ");
        for( i = 0 ; i < words.length ; ++i ) {
            if( words[i].indexOf('_') > 0 ) {
                symbols += words[i]+" ";
            }
        }         
     }
     for( i = 0 ; i < leading.length ; ++i ) {
         if( padText.indexOf(" "+leading[i].symbol) >= 0 ) {
             words = padText.split(" "+leading[i].symbol);
             for( j = 0 ; j < words.length ; ++j ) {
                 if( leading[i].endsymbol ) {
                    word = words[j].split(leading[i].endsymbol);
                    if( word.length > 1 ) {
                        symbol = leading[i].replace + word[0] + leading[i].endreplace + " ";
                        if( symbols.indexOf(" "+symbol) < 0 ) {
                            symbols += symbol;
                        }
                    } 
                 } else {
                    word = words[j].split(" ")[0].split("(")[0];
                    if( word.length > 0 ) {
                        symbol = leading[i].replace + word + " ";
                        if( symbols.indexOf(" "+symbol) < 0 ) {
                            symbols += symbol;
                        }
                    }
                 }
             }
             changed = true;
         }
     }
     if( symbols.length > 1 ) {
         words = symbols.trim().split(" ");
         for( i = 0 ; i < words.length ; ++i ) {
             if( words[i].indexOf(".") > 0 ) {
                 parts = words[i].split('.');
                 for( j = 0 ; j < parts.length ; ++j ) {
                     symbol = parts.slice(0,j+1).join('.') + " ";
                     if( symbols.indexOf(" "+symbol) < 0 ) {
                         symbols += symbol;
                     }                     
                 }
             } else if( words[i].indexOf("_") > 0 ) {
                 parts = words[i].split('_');
                 for( j = 0 ; j < parts.length ; ++j ) {
                     symbol = parts.slice(0,j+1).join('_') + " ";
                     if( symbols.indexOf(" "+symbol) < 0 ) {
                         symbols += symbol;
                     }                     
                 }
             }
         }
         symbols = symbols.split("|").join("_");
     }
     // Add symbols to denote the separator that is being used
     if( symbols.indexOf("_") > 0 ) {
         symbols += "underbarseparated";
     }
     if( symbols.indexOf(".") > 0 ) {
         symbols += "dotseparated";
     }
     return symbols.trim();  
};

options.events = events;
//--------------------------------------------------------------------------------------------

var help = Help(options);

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/",function (req, res) {
    if( req.path == "/test" ) {
       res.end(JSON.stringify(req.body, null, 2))
    } else if( req.path.substring(0,10) == "/describe/" || req.path.substring(0,14) == "/web/describe/" || req.path.substring(0,14) == "/web/main/describe/"  ) {
       var relPath = req.path.substring(9);
       if( req.path.substring(0,14) == "/web/describe/" )
           relPath = req.path.substring(13);
       help.getmetadata(relPath, function (data) {
          var htmlResult = "<table>";
          htmlResult += "<tr> <th>File Location</th><td><input value=\"c:\\dev\\AlphaHelp\\helpfiles"+ replaceAll( decodeURI(relPath) , "/" , "\\" ) + "\" style=\"width:7in;\" /><td></tr>";
          if( data.status ) {
              htmlResult += "<tr> <th>Status</th><td><input value=\""+ data.status + "\" style=\"width:7in;\" /><td></tr>";              
          }
          if( data.tags ) {
              htmlResult += "<tr> <th>Tags</th><td><input value=\""+ data.tags + "\" style=\"width:7in;\" /><td></tr>";
          }
          if( data.keywords ) {
              htmlResult += "<tr> <th>Keywords</th><td><input value=\""+ data.keywords + "\" style=\"width:7in;\" /><td></tr>";
          }
          if( data.notes ) {
              htmlResult += "<tr> <th>Notes</th><td><input value=\""+ data.notes + "\" style=\"width:7in;\" /><td></tr>";
          }
          console.log(JSON.stringify(data));
          htmlResult += "</table>";
          help.onSendExpress(res);
          res.send(htmlResult);
        });
    } else if( req.path.substring(0,11) == "/structure/" ) {
        var relPath = req.path.substring(10);
        var manifestFile = help.config.generated + "manifest/" + replaceAll(unescape(relPath), '/', '_').replace(".html", ".json");
        var fs = require("fs");
        fs.readFile(manifestFile, function (err, data) {
            var subtoc = {};
            if( !err && data && data !== "" ) {
                mdata = JSON.parse(data);
                if( mdata.toc )
                   subtoc = mdata.toc;
            }
            help.onSendExpress(res);
            res.send(JSON.stringify(subtoc));
        });        
    } else if( req.path == "/apihelp" || req.path == "/web/apihelp" ) {
        help.search( req.query.topic , function(err, data) {
            if( err ) {
                help.onSendExpress(res);
                res.send("Error doing search "+ err );
            } else {
                // search through the data
                var lookFor = "/design/api/";
                var foundItem = null;
                var i;
                for( i = 0 ; i < data.length ; ++i ) {
                    if( data[i].path.toLowerCase().indexOf(lookFor) >= 0 ) {
                        foundItem =  data[i];
                        break;
                    } else {
                        console.log("Miss "+data[i].path);
                    }
                }
                if(  foundItem ) {                    
                    if( foundItem.hash ) {
                        res.redirect("/main#"+foundItem.path+"#"+foundItem.hash);
                    } else {
                        console.log('lookup '+foundItem.path)
                        res.redirect("/main#"+foundItem.path);
                    }
                } else {
                    // TBD - show the 'not-found' page with results...
                    help.onSendExpress(res);
                    res.send("No matches found for "+req.query.topic);
                }
            }
        },0,20);
    } else if( req.path.substring(0,8) == '/images/' ) {
        res.redirect("/help"+req.path);
    } else {
       help.expressuse(req, res);
    }
});

app.listen(options.port);
console.log('Listening on port '+options.port);