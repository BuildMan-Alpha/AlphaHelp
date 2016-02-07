/*
 * Generate help pages from javascript files
 */
var build = require("./build.json");
var fs = require("fs");
var async = require('async');
var esprima = require('esprima');
var sourceFiles = [];

var protectXml = function(content) {
    if( content.indexOf("&") >= 0 
     || content.indexOf("<") >= 0 
     || content.indexOf(">") >= 0 
      ) {
        content = "<![CDATA["+content+"]]>";
    }
    return content;
};

var generateXMLHelp = function(content) {
    var lines = content.split('\n');
    var i;
    var context = null;
    var method = null;
    var lastType = null;
    var description = null;
    var discussion = null;
    var examples = null;
    var endTag = null;
    var arguments = [];
    for(i = 0 ; i < lines.length ; ++i ) {
        var line = lines[i].trim();
        if( endTag && line.indexOf(endTag) >= 0 ) {
            lastType = null;
            endTag = null;
        } else {
            var splitPos = line.indexOf(":");
            var dashPos = line.indexOf("-");
            var type = null; 
            if( splitPos > 0 ) {
                if( dashPos < 0 || splitPos < dashPos ) {
                    type = line.substring(0,splitPos).toLowerCase();
                }
            }
            if( type ) {
                if( type == "context") {
                    context = line.substring(splitPos+1);
                } else if( type == "method") {
                    method = line.substring(splitPos+1);
                } else if( type == "description") {
                    description = line.substring(splitPos+1);
                } else if( type == "discussion") {
                    discussion = line.substring(splitPos+1);
                } else if( type == "arguments") {
                    ;                    
                } else if( type == "example") {
                    endTag = line.substring(splitPos+1).trim();
                    if( endTag.length == 0 ) {
                        endTag = null;
                    }
                    examples = "";
                }
                lastType = type;
            } else if( lastType == "description" ) {
                description += description + "\r\n" + line;
            } else if( lastType == "discussion" ) {
                discussion += discussion + "\r\n" + line;
            } else if( lastType == "example" ) {
                examples += examples + "\r\n" + line;
            } else if( lastType == "arguments" ) {
                if( dashPos > 0 ) {
                    // argument...
                    var argName = line.substring(0,dashPos).trim();
                    var description = line.substring(dashPos+1).trim();
                    var typeIndex = argName.indexOf('(');
                    var argType = "string";
                    if( typeIndex > 0 ) {
                        argType = argName.substring(typeIndex+1).trim();
                        var endArgType = argType.lastIndexOf(')');
                        if( endArgType > 0 ) {
                            argType = argType.substring(0,endArgType);
                        }                        
                        argName = argName.substring(0,typeIndex).trim();
                    }
                    arguments.push( { name : argName , type : argType , description : description } );                    
                }
            }
        }        
    }
    var xml = "<page>\r\n";
    
    if( method ) {
        xml += "\t<prototype>"+protectXml(method)+"</prototype>\r\n";
    }
    if( arguments.length > 0 ) {
        xml += "\t<arguments>\r\n";
        for(i = 0 ; i < arguments.length ; ++i ) {
            xml += "\t\t<argument>\r\n";
            xml += "\t\t\t<name>"+arguments[i].name+"</name>\r\n";
            xml += "\t\t\t<type>"+arguments[i].type+"</type>\r\n";
            xml += "\t\t\t<description>"+arguments[i].description+"</description>\r\n";
            xml += "\t\t</argument>\r\n";
        }
        xml += "\t</arguments>\r\n";
    }
    if( description ) {
        xml += "\t<description>"+protectXml(description)+"</description>\r\n";
    }
    if( discussion ) {
        xml += "\t<discussion>"+protectXml(discussion)+"</discussion>\r\n";
    }
    if( examples ) {
        xml += "\t<example>"+protectXml(examples)+"</example>\r\n";
    }
        
    xml += "</page>\r\n";
    return { context : context , xml : xml };
};

var extractJsHelp = function() {
    async.eachSeries(sourceFiles, function (path, callbackLoop) {
        fs.readFile(path,"utf8",function(err,code) {
            if( err ) {
                ;
            } else {
                var options = { loc : true , range : false , comment : true }
                var syntax = esprima.tokenize(code,options);
                var i;
                for( i = 0 ; i < syntax.length ; ++i ) {
                    if( syntax[i].type == "BlockComment" ) {
                        var  content = syntax[i].value.trim();
                        if( content.substring(0,5) == "[DOC:" && content.substring(content.length-1) == ']' ) {
                            content = content.substring(5,content.length-1).trim();
                            var helpPage = generateXMLHelp(content);
                            console.log("Context:"+helpPage.context);
                            console.log(helpPage.xml);                            
                        }              
                    }
                }
                //console.log(syntax);                
            }
            callbackLoop();
        });
    });
};


var resolveFiles = function(folders) {
    var recurseFiles = [];
    async.eachSeries(folders, function (path, callbackLoop) {
        if( path.indexOf("*") >= 0 ) {
            var folder = path.substring(0,path.lastIndexOf('/'));
            fs.readdir(folder, function (err, list) {
                if( err ) {
                    console.log(err);
                } else {
                    var i;
                    for( i = 0 ; i < list.length ; ++i ) {
                        if( list[i].indexOf(".js") > 0 ) {
                            sourceFiles.push(folder+"/"+list[i]);
                        } else {
                            var stat = fs.statSync(folder+"/"+list[i]);
                            if(stat && stat.isDirectory()) {
                               recurseFiles.push(folder+"/"+list[i]+"/*.js");
                            }
                        }
                    }
                }
                callbackLoop();
            });
        } else {
            sourceFiles.push(path);
            callbackLoop();
        }
    },function() {
        if( recurseFiles.length > 0 ) {
            resolveFiles(recurseFiles);
        } else {
            extractJsHelp();
            //console.log(JSON.stringify(sourceFiles));
        }
    });
};

resolveFiles(build.javascript);

