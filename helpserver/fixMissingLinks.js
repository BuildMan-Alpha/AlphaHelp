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
        } else if( extension == ".xml" ) {
            // Look for XML links
            var xmldoc = require('xmldoc');
            console.log("Process " + path);
            try {
                var document = new xmldoc.XmlDocument(data);           
                var changedRef = false;
                //<ref>Helper::ExifInfo Class</ref>
                var expandReferences = function(node) {
                    var i;
                    if( node.name == "ref" ) {
                        var samename = [];
                        var lowRef = node.val.toLowerCase();
                        var searchRef = function() {
                            var i;
                            var folderMatchs = [];
                            for( i = 0 ; i < list.length ; ++i ) {
                                var pos = list[i].toLowerCase().lastIndexOf(lowRef); 
                                if( pos >= 0 ) {
                                    var pathEndPos = list[i].lastIndexOf('/');
                                    if( pos >= pathEndPos ) {
                                        samename.push(list[i]);
                                    } else {
                                         var indexFn = list[i].substring(pathEndPos+1).toLowerCase();
                                         var parentFolderName = list[i].split('/');
                                         if( parentFolderName.length > 1 ) {
                                                parentFolderName = parentFolderName[parentFolderName.length-2];
                                                if( parentFolderName.toLowerCase().lastIndexOf(lowRef) >= 0 ) {
                                                    if( indexFn == "index.xml" || indexFn == "index.html" || indexFn == "index.md" ) {
                                                        samename.push(list[i]);
                                                     } else {
                                                        var j;
                                                        var haveMatch = false;
                                                        var pathAdd = list[i].split('/');
                                                        pathAdd = pathAdd[pathAdd.length-1] = "index.xml";
                                                        pathAdd = pathAdd.join('/');
                                                        for( j = 0 ; j < folderMatchs.length ;++j ) {
                                                            if( folderMatchs[j].toLowerCase() == pathAdd.toLowerCase() ) {
                                                                haveMatch = true;
                                                                break;                                             
                                                            }                                                            
                                                        }
                                                        if( !haveMatch ) {
                                                            folderMatchs.push(pathAdd);
                                                        }
                                                     }
                                                }                                         
                                         }
                                    }
                                }
                            }
                            if( samename.length == 0 && folderMatchs.length > 0 ) {
                                samename = folderMatchs;
                            }                            
                        };
                        searchRef();
                        if( samename.length == 0 ) {
                            if( lowRef.indexOf('  ') >= 0 ) {
                                lowRef = lowRef.split(' ');
                                for( i = lowRef.length-1 ; i >= 0 ; --i ) {
                                    if( lowRef[i] == "" ) {
                                        lowRef = lowRef.splice(i,1);
                                    }
                                }
                                lowRef = lowRef.join(' ');
                                searchRef();
                                if( samename.length == 0 ) {
                                    if( lowRef.indexOf(' method') >= 0 || lowRef.indexOf(' function') >= 0 
                                     || lowRef.indexOf(' class') >= 0 || lowRef.indexOf(' namespace') >= 0 ) {
                                         lowRef = lowRef.split(' ');
                                         lowRef = lowRef.splice(lowRef.length-1,1);
                                         lowRef = lowRef.join(' ');
                                         searchRef();
                                    }
                                    if( lowRef.indexOf("()") > 0 ) {
                                         lowRef = lowRef.split('()')[0];
                                         searchRef();                                        
                                    }
                                    if( samename.length == 0 ) {
                                        if( lowRef.indexOf('.') > 0 ) {
                                            lowRef = lowRef.split('.');
                                            lowRef[0] = "";
                                            lowRef = lowRef.join('.');
                                            searchRef();                                            
                                        }
                                    }
                                }
                            }
                        }
                        if( samename.length > 0 ) {
                            if( samename.length == 1 ) {
                                console.log('~resolved '+node.val+" to "+samename[0]);
                            } else {
                                console.log('~Ambiguous '+node.val+" for page "+path);
                            }                        
                        } else {
                            console.log('~Could not find XML reference to '+node.val)
                        }                  
                    }
                    if( node.children && node.children.length ) {
                        for( i = 0 ; i < node.children.length ; ++i )
                            expandReferences(node.children[i]);
                    }
                }
                expandReferences(document);
            } catch(err) {
                ;
            }                            
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
                         && attribs.href.indexOf("javascript:void(0)") < 0
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