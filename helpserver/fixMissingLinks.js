var fs = require('fs');
var pathModule = require('path');
var files = fs.readFileSync("c:/data/files.json", "utf8");
var list = JSON.parse(files);
var async = require('async');
async.eachSeries(list, function (path, callbackLoop) {
    var filename = "/dev/AlphaHelp/helpfiles" + path;
    fs.readFile(filename, function (err, data) {
        var extension = path.substring(path.lastIndexOf('.'));
        if (err) {
            console.log("Error " + err + " processing file " + path);
        } else if( extension == ".html" ) {
            console.log("Process " + path);
            var location = path.substring(0,path.lastIndexOf('/'));
            if( location == "") {
                location = "/";
            }
            var htmlparser = require("htmlparser2");
            var parser = new htmlparser.Parser({
                onopentag: function (name, attribs) {
                    if (attribs.href) {
                        if( attribs.href.indexOf("://") < 0 
                         && attribs.href.substring(0,1) != '#' 
                         && attribs.href != ';'
                         && attribs.href.indexOf("theme.css") < 0
                         ) {
                            var resolveLink = pathModule.resolve(location,attribs.href);
                            resolveLink = resolveLink.split('#')[0];
                            var pathAndArg = resolveLink.split('?');
                            if( pathAndArg.length > 1 ) {
                                var lowLink = resolveLink.toLowerCase(); 
                                if( lowLink.indexOf("tiki-index.php") >= 0 
                                 || lowLink.indexOf("tiki-editpage.php") >= 0
                                  ) {
                                    var  pageArg = pathAndArg[1].split("page=");
                                    if( pageArg.length > 1 ) {
                                       resolveLink = pathModule.resolve(location, decodeURI(pageArg[1]) ) + ".html";
                                    }                                     
                                } else {
                                    resolveLink = resolveLink[0];
                                }
                            }
                            resolveLink = resolveLink.split('\\').join('/');
                            resolveLink = resolveLink.substring(resolveLink.indexOf('/'));
                            if( resolveLink.indexOf('%') >= 0 || resolveLink.indexOf('&') >= 0 || resolveLink.indexOf('+') >= 0 ) {
                                try {
                                   resolveLink = decodeURI(resolveLink);
                                } catch(err) {
                                    ;
                                }
                            } 
                            var i;
                            var lowLink = resolveLink.toLowerCase();
                            var lowName = lowLink.substring(lowLink.lastIndexOf('/')).split('.');
                            if( lowName.length > 1 ) {
                                lowName[lowName.length-1] = "";
                            }
                            lowName = lowName.join('.');
                            var rename  = null;
                            var found = false;
                            var samename = [];
                            for( i = 0 ; i < list.length ; ++i ) {
                                var test = list[i];
                                if( test == resolveLink ) {
                                    found = true;
                                    break;
                                } else {
                                    test = test.toLowerCase();
                                    if( test == lowLink ) {
                                       rename = list[i];
                                       found = true;
                                       break;
                                    } else if( test.indexOf(lowName) >= 0 ) {
                                       samename.push(list[i]);
                                    }
                                }
                            }
                            if( !found ) {
                                if( samename.length > 1 ) {
                                    var newsamename = [];
                                    var lowParts = lowLink.split('/');
                                    var match = 2;
                                    while( lowParts.length >= match ) {
                                        var endTest = lowParts;
                                        if(  lowParts.length > match  )
                                            lowParts.splice(0, lowParts.length - match ).join('/');
                                        console.log('test against '+endTest);
                                        for( i = 0 ; i < samename.length ; ++i ) {
                                            var testThisPath = samename[i].toLowerCase();
                                            var test = testThisPath.split('/');
                                            if( test.length >= match ) {
                                                if( test.length > match ) {
                                                    testThisPath = test.splice(0, test.length - match ).join('/');
                                                }              
                                                if( testThisPath == endTest ) {
                                                    console.log('Matched against '+testThisPath);
                                                    newsamename.push(samename[i]);
                                                }
                                            }
                                        }
                                        if( newsamename.length > 0 ) {
                                            console.log("Reduced from "+samename.length+" to "+newsamename.length);
                                            samename = newsamename;
                                            newsamename = [];
                                            if( newsamename.length == 1 )
                                                break;
                                        } else {
                                            break;
                                        }
                                        ++match;
                                    }
                                }
                                if( samename.length == 1 ) {
                                    rename = samename[0];
                                } else if( samename.length > 1 ) {
                                    console.log("+Ambiguous name ["+attribs.href+"] - ["+lowName+"]  - count "+samename.length+" first ["+samename[0]+"] second ["+samename[1]+"]" );                                    
                                } else {
                                    console.log("+Could not resolve link ["+attribs.href+"] as ["+resolveLink+"]");
                                }
                            }
                            if( rename ) {
                                console.log('+Rename '+attribs.href+" to "+rename);
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
        }
        callbackLoop();
    });
}, function () {
    console.log('Done!');
});