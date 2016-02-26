/*
 * Generate help pages from javascript files
 */
var build = require("./build.json");
var fs = require("fs");
var async = require('async');
var esprima = require('esprima');
var sourceFiles = [];
var lastContext = null;
var dirCreateRecurse = function( folderName ) {
    var stats = null;
    try {
        stats = fs.statSync(folderName);
    } 
    catch (e) {
    };
    
    if (!stats || !stats.isDirectory()) {
        var parentFolderName = folderName.substring(0,folderName.lastIndexOf('/'));
        if( parentFolderName.length > 1 ) {
            dirCreateRecurse(parentFolderName);
        }
        fs.mkdirSync(folderName);
    }
}; 

var protectXml = function(content) {
    if( content.indexOf("&") >= 0 
     || content.indexOf("<") >= 0 
     || content.indexOf(">") >= 0 
      ) {
        content = "<![CDATA["+content+"]]>";
    }
    return content;
};

var processArgOrProc = function(line,dashPos,properties) {
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
    var lastObj = { name : argName , type : argType , description : description };
    properties.push( lastObj );
    return lastObj; 
}

var generateXMLHelp = function(content) {
    var lines = content.split('\n');
    var i;
    var context = lastContext;
    var method = null;
    var lastType = null;
    var description = null;
    var discussion = null;
    var examples = null;
    var endTag = null;
    var properties = [];
    var arguments = [];
    var isFunction = false;
    var isConstructor = false;
    var endTagType = []; 
    var lastPropOrArg = null;
    for(i = 0 ; i < lines.length ; ++i ) {
        var line = lines[i].trim();
        if( endTag && line.indexOf(endTag) >= 0 ) {
            lastType = null;
            endTag = null;
            if( endTagType.length > 0 ) {
                lastType = endTagType[endTagType.length-1];
                endTagType.splice(endTagType.length-1,1);
            }
        } else if( !endTag ) {
            var splitPos = line.indexOf(":");
            var dashPos = line.indexOf("-");
            var typePos = line.indexOf("(");
            var type = null; 
            if( splitPos > 0 ) {
                if( dashPos < 0 || splitPos < dashPos ) {
                    if( typePos < 0 || splitPos < typePos ) {
                        type = line.substring(0,splitPos).toLowerCase();
                    }
                }
            }
            if( type ) {
                if( type == "context" ) {
                    context = line.substring(splitPos+1).trim();
                } else if( type == "namespace" || type == "class" ) {
                    context = line.substring(splitPos+1).trim();
                    if( !build.context[context] ) {
                        var allParts = context.split('.');
                        if( allParts.length > 1 ) {
                            var parentContext = build.context[allParts[0]];
                            if( parentContext ) {
                                allParts.splice(0,1);
                                build.context[context] = {  path : parentContext.path + '/' + allParts.join('/') , classname : context };
                                console.log("Added context "+context);
                            }                            
                        }
                    }
                } else if( type == "method") {
                    method = line.substring(splitPos+1).trim();
                } else if( type == "function" || type == "funct" || type == "func" || type == "fun" )  {
                    isFunction = true;
                    method = line.substring(splitPos+1).trim();
                } else if( type == "constructor" || type == "cons" ) {
                    isConstructor = true;
                    method = line.substring(splitPos+1).trim();
                } else if( type == "description" || type == "desc") {
                    description = line.substring(splitPos+1);
                } else if( type == "discussion" || type == "disc") {
                    discussion = line.substring(splitPos+1);
                } else if( type == "arguments" || type == "args") {
                    endTag = line.substring(splitPos+1).trim();
                    if( endTag.length == 0 ) {
                        endTag = null;
                    } else {
                        endTagType.push(lastType);
                    }                    
                } else if( type == "properties" || type == "props") {
                    ;                    
                } else if( type == "example") {
                    endTag = line.substring(splitPos+1).trim();
                    if( endTag.length == 0 ) {
                        endTag = null;
                    }
                    examples = "";
                }
                lastType = type;
            } else if( lastType == "description" || lastType == "desc" ) {
                description += "\r\n" + line;
            } else if( lastType == "discussion" || lastType == "disc" ) {
                discussion += "\r\n" + line;
            } else if( lastType == "example" ) {
                examples += "\r\n" + line;
            } else if( lastType == "arguments" 
                    || lastType == "args"
            ) {
                if( dashPos > 0 ) {
                   lastPropOrArg = processArgOrProc(line,dashPos,arguments);
                }
            } else if( lastType == "properties" 
                    || lastType == "props" 
                    ) {
                if( dashPos > 0 ) {
                   lastPropOrArg = processArgOrProc(line,dashPos,properties);
                }
            }
        } else if( lastType == "example" ) {
            examples += "\r\n" + line;
        } else if( lastType == "arguments" || lastType == "args" ) {
            if( lastPropOrArg ) {
                lastPropOrArg.arguments = [];
                processArgOrProc(line,dashPos,lastPropOrArg.arguments);
            }
        }        
    }
    var pagename = method;
    if( pagename ) {
        var methodArgsPos = pagename.indexOf('(');
        if( methodArgsPos > 0 ) {
            pagename  = pagename.substring(0,methodArgsPos);
        }
        pagename = pagename.trim();
        if( isConstructor ) {
            pagename += " Constructor";
        } else if( isFunction ) {
            pagename += " Function";
        } else {
            pagename += " Method";
        }
    }    
    var xml = "<page>\r\n";
    
    if( pagename ) {
        var map = build.context[context];
        if( isConstructor ) {
            xml += "\t<topic>"+protectXml(pagename)+"</topic>\r\n";
        } else if( map && map.classname ) {
            xml += "\t<topic>"+protectXml(map.classname+"."+pagename)+"</topic>\r\n";
        } else {        
            xml += "\t<topic>"+protectXml(pagename)+"</topic>\r\n";
        }
    }    
    
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
    if( properties.length > 0 ) {        
        xml += "\t<properties>\r\n";
        for(i = 0 ; i < properties.length ; ++i ) {
            xml += "\t\t<property>\r\n";
            xml += "\t\t\t<name>"+properties[i].name+"</name>\r\n";
            xml += "\t\t\t<type>"+properties[i].type+"</type>\r\n";
            xml += "\t\t\t<description>"+properties[i].description+"</description>\r\n";
            if( properties[i].arguments ) {
                var j;
                xml += "\t\t\t<section>";
                xml += "\t\t\t\t<arguments>";
                for(j = 0 ; j < properties[i].arguments.length ; ++j ) {
                    xml += "\t\t\t\t\t<argument>\r\n";
                    xml += "\t\t\t\t\t\t<name>"+properties[i].arguments[j].name+"</name>\r\n";
                    xml += "\t\t\t\t\t\t<type>"+properties[i].arguments[j].type+"</type>\r\n";
                    xml += "\t\t\t\t\t\t<description>"+properties[i].arguments[j].description+"</description>\r\n";
                    xml += "\t\t\t\t\t</argument>\r\n";
                }
                xml += "\t\t\t\t</arguments>";
                xml += "\t\t\t</section>";
            } 
            xml += "\t\t</property>\r\n";
        }
        xml += "\t</properties>\r\n";
    }
    if( examples ) {
        xml += "\t<example>"+protectXml(examples)+"</example>\r\n";
    }
    if( isConstructor ) {
        pagename = "index";
        xml += "\t<!--list:.-->\r\n";
    }
    if( !pagename ) {
        pagename = "index";
        xml += "\t<!--list:.-->\r\n";        
    }    
    xml += "</page>\r\n";
    lastContext = context;
    return { context : context.trim() , pagename : pagename , xml : xml };
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
                var fileOps = [];
                var contexts = {};
                lastContext = null;
                for( i = 0 ; i < syntax.comments.length ; ++i ) {
                    if( syntax.comments[i].type == "Block" ) {
                        var  content = syntax.comments[i].value.trim();
                        if( content.substring(0,5) == "[DOC:" && content.substring(content.length-1) == ']' ) {
                            content = content.substring(5,content.length-1).trim();
                            var helpPage = generateXMLHelp(content);
                            if( !contexts[helpPage.context] )
                                contexts[helpPage.context] = {  files : [] };
                            contexts[helpPage.context].files.push({ pagename : helpPage.pagename , xml : helpPage.xml });
                        }              
                    }
                }
                var ctxName;
                for (ctxName in contexts) {
                    var map = build.context[ctxName];
                    if( map ) {
                        var ctx = contexts[ctxName];
                        var j;
                        for( j = 0 ; j < ctx.files.length ; ++j ) {
                            var fn = map.path + '/' + ctx.files[j].pagename + ".xml";
                            fileOps.push({ filename : fn , xml : ctx.files[j].xml });
                        }                
                    }
                }                
            }
            if( fileOps.length > 0 ) {
                async.eachSeries(fileOps, function (fileOp, callbackLoopNested) {
                    fs.writeFile(fileOp.filename,fileOp.xml,function(err) {
                        var folderName = fileOp.filename.substring(0,fileOp.filename.lastIndexOf('/'));
                        dirCreateRecurse(folderName);                                
                         if( err ) {
                             console.log('Error writing '+fileOp.filename+" error "+err);
                         }
                         callbackLoopNested();
                    });
                },function() {
                    callbackLoop();    
                });                
            } else {
                callbackLoop();
            }
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

