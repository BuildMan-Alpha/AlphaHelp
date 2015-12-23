var express = require('express');
var app = express();
var options = require("./settings");
var Help = require('helpserver');
var help = Help(options);
var replaceAll = function (str, find, replace) {
    while (str.indexOf(find) >= 0)
    str = str.replace(find, replace);
    return str;
};

// xml page index function - gets called whenever we change xml files in a folder... passes all the files 
options.pageIndexer = function(filename,savePage) {
      // just error out for now...
      var extensionIndex = filename.lastIndexOf(".");
      if( filename.substring(extensionIndex).toLowerCase() == ".xml" && filename.indexOf( "/index.xml") < 0 ) {
        var fs = require("fs");      
        fs.readFile(filename, "utf8", function (err, data) {          
            if(err) {  
                console.log(filename+" was not found");
                savePage(null);       
            } else {
                var parseString = require('xml2js').parseString;
                parseString(data, function (err, result) {
                    if( err ) {
                        console.log(err+" processing file "+filename);
                        savePage(null);  
                    } else {
                        result = eval(result);
                        if( result ) {
                            if( result.page ) {
                                if( result.page.description ) {
                                    if( Object.prototype.toString.call( result.page.description ) === '[object Array]' ) {
                                        savePage({ definition : result.page.description[0] });
                                    } else {
                                        savePage({ definition : result.page.description });
                                    }
                                } else {
                                    console.log(result);
                                    savePage(null);                                
                                }    
                            } else {
                                console.log(result);
                                savePage(null);
                            }
                        } else {
                            savePage(null);                            
                        }                    
                    }
                });
            }
        });
      } else {
        savePage(null);          
      }      
};

app.use("/",function (req, res) {
    if( req.path.substring(0,10) == "/describe/" || req.path.substring(0,14) == "/web/describe/" ) {
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
    } else if( req.path == "/apihelp" || req.path == "/web/apihelp" || req.path == "/web/main/apihelp") {
        help.search( req.query.topic , function(err, data) {
            if( err ) {
                help.onSendExpress(res);
                res.send(JSON.stringify({ error : err }));
            } else {
                // search through the data
                var lookFor = "/design/api/";
                var foundItem = null;
                var i;
                for( i = 0 ; i < data.length ; ++i ) {
                    if( data[i].path.toLowerCase().indexOf(lookFor) >= 0 ) {
                        foundItem =  data[i];
                        break;                       
                    }
                }
                if(  foundItem ) {                    
                    help.onSendExpress(res);
                    res.send(JSON.stringify(foundItem));
                } else {
                    // TBD - show the 'not-found' page with results...
                    help.onSendExpress(res);
                    if( data.length > 0 )
                        res.send(JSON.stringify({ error : "No API matches found for "+req.query.topic , closest : data }));
                    else
                        res.send(JSON.stringify({ error : "No matches found for "+req.query.topic }));
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