var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var options = require("./settingslocal");
var Help = require('helpserver');
var replaceAll = function (str, find, replace) {
    while (str.indexOf(find) >= 0) {
        str = str.replace(find, replace);
    }
    return str;
};


//--------------------------------------------------------------------------------------
// page index function - gets called whenever we change xml files in a folder... passes all the files 
var outputSnippet = function(args,description) {
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
                result =  "<item><name href=\"" + args.path + "\">" + args.name + "</name><description>" + description + "</description></item>";
        } else {
                result = "<dt><a href='" + args.path + "' >" + args.name + "</a></dt>\n<dd>" + description + "</dd>";
        }
    } else {
        if( args.format == ".xml" ) {
            result = "<item><name href=\"" + args.path + "\">" + args.name + "</name></item>";
        } else {
            result = "<dt><a href='" + args.path + "' >" + args.name + "</a></dt>";
        }
    }
    return result;
}

options.pageIndexer = function (args, savePage) {
    // just error out for now...
    var filename = args.filename;
    var extensionIndex = filename.lastIndexOf(".");    
    if( filename.indexOf("/index.xml") >= 0 || filename.indexOf("/index.html") >= 0 ) {
        debugger;
    }
    if (filename.substring(extensionIndex).toLowerCase() == ".xml" ) { //&& filename.indexOf("/index.xml") < 0) {
        var fs = require("fs");
        fs.readFile(filename, "utf8", function (err, data) {
            if (err) {
                console.log(filename + " was not found");
                savePage(outputSnippet(args,null));
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
                    savePage(outputSnippet(args,description));
                });
            }
        });
    } else {
        savePage(outputSnippet(args,null));
    }
};

options.wrapIndex = function( args ) {
    var result = "";
    if( args.format == ".xml" ) {
        result = "<list><item><name-title>Name</name-title></item>"+args.content+"</list>";
    } else {
        result = "<dl id='generatedTopics'>"+args.content+"</dl>";
    }
    return result;
};

options.getDefaultIndexTemplate = function( args ) {
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
options.translateXML = function(xmlFile,htmlFile,callback) {
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