/*
 * Generate help pages from javascript files
 */
var build = require("./build.json");
var fs = require("fs");
var async = require('async');
var esprima = require('esprima');
var sourceFiles = [];
var lastContext = null;
var dirCreateRecurse = function (folderName) {
    var stats = null;
    try {
        stats = fs.statSync(folderName);
    }
    catch (e) {
    };

    if (!stats || !stats.isDirectory()) {
        var parentFolderName = folderName.substring(0, folderName.lastIndexOf('/'));
        if (parentFolderName.length > 1) {
            dirCreateRecurse(parentFolderName);
        }
        fs.mkdirSync(folderName);
    }
};
var indentLevelCalc = function(txt) {
    var i;
    for( i = 0 ; i < txt.length ; ++i ) {
        if( txt[i] !== '\t' ) {
            if( txt[i] <= ' ' )
                return 0;
            return i;
        }
    }
    return 0;
};

var protectXml = function (content) {
    if (content.indexOf("&") >= 0
        || content.indexOf("<") >= 0
        || content.indexOf(">") >= 0
        ) {
        content = "<![CDATA[" + content + "]]>";
    }
    return content;
};

var processArgOrProc = function (line, dashPos, properties) {
    var argName = line.substring(0, dashPos).trim();
    var description = line.substring(dashPos + 1).trim();
    var typeIndex = argName.indexOf('(');
    var argType = "string";
    if (typeIndex > 0) {
        argType = argName.substring(typeIndex + 1).trim();
        var endArgType = argType.lastIndexOf(')');
        if (endArgType > 0) {
            argType = argType.substring(0, endArgType);
        }
        argName = argName.substring(0, typeIndex).trim();
    }
    var lastObj = { name: argName, type: argType, description: description };
    properties.push(lastObj);
    return lastObj;
}

var generateXMLHelp = function (content) {
    var lines = content.split('\n');
    var i;
    var context = lastContext;
    var method = null;
    var lastType = null;
    var description = null;
    var discussion = null;
    var examples = null;
    var note = null;
    var returns = null;
    var endTag = null;
    var properties = [];
    var arguments = [];
    var isFunction = false;
    var isConstructor = false;
    var endTagType = [];
    var lastPropOrArg = null;
    var topContext = null;
    var contextType = "";
    var lastIndentLevel = 0;
    var nestingProps = [];
    var titleContext = null;

    for (i = 0; i < lines.length; ++i) {
        var indentLevel = indentLevelCalc(lines[i]);
        var line = lines[i].trim();
        if (endTag && line.indexOf(endTag) >= 0) {
            lastType = null;
            endTag = null;
            if (endTagType.length > 0) {
                lastType = endTagType[endTagType.length - 1];
                endTagType.splice(endTagType.length - 1, 1);
            }
        } else if (!endTag) {
            var saveString = "";
            if( line[0] === "'" ) {
                line = line.split("'");
                if( line.length > 2 ) {
                    saveString = "'"+line[1]+"'";
                    line.splice(0,2);
                    line = line.join("'"); 
                } else {
                    saveString = "";
                    line = line.join("'");
                }
                console.log(saveString);
            }
            var splitPos = line.indexOf(":");
            var dashPos = line.indexOf("-");
            var typePos = line.indexOf("(");
            
            if( saveString.length > 0 ) {
                splitPos += saveString.length;
                dashPos += saveString.length;
                typePos += saveString.length;
                line = saveString+line;
            }
            
            var type = null;
            if (splitPos > 0) {
                if (dashPos < 0 || splitPos < dashPos) {
                    if (typePos < 0 || splitPos < typePos) {
                        type = line.substring(0, splitPos).toLowerCase();
                    }
                }
            }
            if (type) {
                if (type === "context") {
                    context = line.substring(splitPos + 1).trim();
                    topContext = context;
                } else if (type === "namespace" || type === "class" || type === "object" ) {
                    if( type === "class" ) {
                        contextType = " Class";
                        console.log("found a class "+context);

                    } else if( type === "object" ) {
                        contextType = " Object";
                    }
                    else    
                        contextType = " Namespace";
                    context = line.substring(splitPos + 1).trim();
                    if( context.indexOf('.') < 0 && type === "object" && topContext ) {
                        // Object does not have a fully qualified name
                        titleContext = context;
                        context = topContext + '.' + context;
                    }
                    if (!build.context[context]) {
                        var allParts = context.split('.');
                        if (allParts.length > 1) {
                            var parentContext = build.context[allParts[0]];
                            if (parentContext) {
                                allParts.splice(0, 1);
                                build.context[context] = { path: parentContext.path + '/' + allParts.join('/'), classname: context };
                                console.log("Added context " + context);
                            } else {
                                console.log("Could not find parent "+allParts[0]);
                            }
                        }
                    }
                } else if (type === "method") {
                    method = line.substring(splitPos + 1).trim();
                } else if (type === "function" || type === "funct" || type === "func" || type === "fun") {
                    isFunction = true;
                    method = line.substring(splitPos + 1).trim();
                } else if (type === "constructor" || type === "cons") {
                    isConstructor = true;
                    method = line.substring(splitPos + 1).trim();
                } else if (type === "description" || type === "desc") {
                    description = line.substring(splitPos + 1);
                } else if (type === "discussion" || type === "disc") {
                    discussion = line.substring(splitPos + 1);
                } else if (type === "note") {
                    note = line.substring(splitPos + 1);
                } else if (type === "returns") {
                    returns = line.substring(splitPos + 1);
                } else if (type === "arguments" || type === "args") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                        if( nestingProps.length === 0 )
                            lastPropOrArg = null;
                    } else {
                        endTagType.push(lastType);
                    }
                } else if (type === "properties" || type === "props") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                        if( nestingProps.length === 0 )
                            lastPropOrArg = null;
                    } else {
                        endTagType.push(lastType);
                    }
                } else if (type === "example") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                    }
                    examples = "";
                }
                lastType = type;
            } else if (lastType === "description" || lastType === "desc") {
                description += "\r\n" + line;
            } else if (lastType === "discussion" || lastType === "disc") {
                discussion += "\r\n" + line;
            } else if (lastType === "note") {
                note += "\r\n" + line;
            } else if (lastType === "returns") {
                returns += "\r\n" + line;
            } else if (lastType === "example") {
                examples += "\r\n" + line;
            } else if (lastType === "arguments"
                || lastType === "args"
                ) {
                if (dashPos > 0) {
                    lastPropOrArg = processArgOrProc(line, dashPos, arguments);
                }
            } else if (lastType === "properties"
                || lastType === "props"
                ) {
                if (dashPos > 0) {
                    if( !endTag && lastPropOrArg ) {
                        if( lastIndentLevel === (indentLevel - 1) ) {
                            if( !lastPropOrArg.properties )
                                lastPropOrArg.properties = [];
                            nestingProps.push(lastPropOrArg);
                        } else if( lastIndentLevel > indentLevel ) {
                            while( lastIndentLevel > indentLevel && nestingProps.length > 0 ) {
                                lastPropOrArg = nestingProps.pop();
                                --lastIndentLevel;
                            }
                        }
                    }
                    if( nestingProps.length > 0 ) {
                        lastPropOrArg = processArgOrProc(line, dashPos, nestingProps[nestingProps.length-1].properties);
                    } else {
                        lastPropOrArg = processArgOrProc(line, dashPos, properties);                        
                    }
                }
            }
        } else if (lastType === "example") {
            examples += "\r\n" + line;
        } else if (lastType === "arguments" || lastType === "args" || lastType === "properties" || lastType === "props") {
            if (lastPropOrArg) {
                var splitPos = line.indexOf(":");
                var dashPos = line.indexOf("-");
                var typePos = line.indexOf("(");
                var type = null;
                if (splitPos > 0) {
                    if (dashPos < 0 || splitPos < dashPos) {
                        if (typePos < 0 || splitPos < typePos) {
                            type = line.substring(0, splitPos).toLowerCase();
                        }
                    }
                }
                if (dashPos > 0) {
                    if( lastType === "properties" || lastType === "props" ) {
                        if (!lastPropOrArg.properties) {
                            lastPropOrArg.properties = [];
                        }
                        processArgOrProc(line, dashPos, lastPropOrArg.properties);
                    } else {
                        if (!lastPropOrArg.arguments) {
                            lastPropOrArg.arguments = [];
                        }
                        processArgOrProc(line, dashPos, lastPropOrArg.arguments);
                    }
                }
            }
        }
        lastIndentLevel = indentLevel;
    }
    var pagename = method;
    if (pagename) {
        var methodArgsPos = pagename.indexOf('(');
        if (methodArgsPos > 0) {
            pagename = pagename.substring(0, methodArgsPos);
        }
        pagename = pagename.trim();
        if (isConstructor) {
            pagename += " Constructor";
        } else if (isFunction) {
            pagename += " Function";
        } else {
            pagename += " Method";
        }
    } 
    var xml = "<page>\r\n";

    if (pagename) {
        var map = build.context[context];
        if (isConstructor) {
            xml += "\t<topic>" + protectXml(pagename) + "</topic>\r\n";
        } else if (map && map.classname) {
            var normalizedClass =  map.classname.toLowerCase().trim() + ".";
            var normalizedPagename = pagename.toLowerCase().trim();
            
            if( normalizedPagename.substring(0,normalizedClass.length) === normalizedClass ) {
                xml += "\t<topic>" + protectXml(pagename) + "</topic>\r\n";
            } else {            
                xml += "\t<topic>" + protectXml(map.classname + "." + pagename) + "</topic>\r\n";
            }
        } else {
            xml += "\t<topic>" + protectXml(pagename) + "</topic>\r\n";
        }
    } else if( contextType.length > 0 ) {
        if( titleContext ) {
            xml += "\t<topic>" + protectXml(titleContext+contextType)+ "</topic>\r\n";
            titleContext = null;                        
        } else {
            xml += "\t<topic>" + protectXml(context+contextType)+ "</topic>\r\n";
        }        
    }

    if (method) {
        xml += "\t<prototype>" + protectXml(method) + "</prototype>\r\n";
    }
    if (arguments.length > 0) {
        xml += "\t<arguments>\r\n";
        for (i = 0; i < arguments.length; ++i) {
            xml += "\t\t<argument>\r\n";
            xml += "\t\t\t<name>" + arguments[i].name + "</name>\r\n";
            xml += "\t\t\t<type>" + arguments[i].type + "</type>\r\n";
            xml += "\t\t\t<description>" + arguments[i].description + "</description>\r\n";
            xml += "\t\t</argument>\r\n";
        }
        xml += "\t</arguments>\r\n";
    }
    if( returns ) {
        xml += "\t<returns>" + protectXml(returns) + "</returns>\r\n";
    }
    if (description) {
        xml += "\t<description>" + protectXml(description) + "</description>\r\n";
    }
    if (discussion) {
        xml += "\t<discussion>" + protectXml(discussion) + "</discussion>\r\n";
    }
    var recurseProperties = function(properties,indented) {
        var xml = "";
        if (properties.length > 0) {
            var i = 0;
            xml += indented + "<properties>\r\n";
            for (i = 0; i < properties.length; ++i) {
                xml += indented + "\t<property>\r\n";
                xml += indented + "\t\t<name>" + properties[i].name + "</name>\r\n";
                xml += indented + "\t\t<type>" + properties[i].type + "</type>\r\n";
                xml += indented + "\t\t<description>" + properties[i].description + "</description>\r\n";
                if (properties[i].arguments) {
                    var j;
                    xml += indented + "\t\t<arguments>\r\n";
                    for (j = 0; j < properties[i].arguments.length; ++j) {
                        xml += indented + "\t\t\t<argument>\r\n";
                        xml += indented + "\t\t\t\t<name>" + properties[i].arguments[j].name + "</name>\r\n";
                        xml += indented + "\t\t\t\t<type>" + properties[i].arguments[j].type + "</type>\r\n";
                        xml += indented + "\t\t\t\t<description>" + properties[i].arguments[j].description + "</description>\r\n";
                        xml += indented + "\t\t\t</argument>\r\n";
                    }
                    xml += indented + "\t\t</arguments>\r\n";
                }
                if (properties[i].properties && properties[i].properties.length ) {
                    xml += recurseProperties(properties[i].properties,indented + "\t\t");
                }
                xml += indented+"\t</property>\r\n";
            }
            xml += indented+"</properties>\r\n";
        }
        return xml;
    };
    xml += recurseProperties(properties,"\t");
    if (examples) {
        xml += "\t<example>" + protectXml(examples) + "</example>\r\n";
    }
    if( note ) {
        xml += "\t<note>" + protectXml(note) + "</note>\r\n";        
    }
    if (isConstructor) {
        pagename = "index";
        xml += "\t<!--list:.-->\r\n";
    }
    if (!pagename) {
        var hasNonMethodChildren = false;
        if( context ) {
            var contextI;        
            for( contextI in build.context ) {
                if( contextI.length > context.length+1 ) {
                    if( contextI.substring(0,context.length+1).toLowerCase() === (context.toLowerCase()+".") ) {
                        hasNonMethodChildren = true;
                        break;
                    }
                }
            }
        }
        pagename = "index";
        if( hasNonMethodChildren ) {
            xml += "\t<!--list:* Method-->\r\n";
            xml += "\t<!--list:*index.xml-->\r\n";
        } else {
            xml += "\t<!--list:.-->\r\n";
        }
    }
    xml += "</page>\r\n";
    lastContext = context;
    return { context: context.trim(), pagename: pagename, xml: xml, topContext: topContext };
};

var extractJsHelp = function () {
    async.eachSeries(sourceFiles, function (path, callbackLoop) {
        fs.readFile(path, "utf8", function (err, code) {
            if (err) {
                ;
            } else {
                var options = { loc: true, range: false, comment: true }
                var syntax = esprima.tokenize(code, options);
                var i;
                var fileOps = [];
                var contexts = {};
                lastContext = null;
                for (i = 0; i < syntax.comments.length; ++i) {
                    if (syntax.comments[i].type === "Block") {
                        var content = syntax.comments[i].value.trim();
                        if (content.substring(0, 5) === "[DOC:" && content.substring(content.length - 1) === ']') {
                            content = content.substring(5, content.length - 1).trim();
                            var helpPage = generateXMLHelp(content);
                            if (!contexts[helpPage.context])
                                contexts[helpPage.context] = { files: [] };
                            contexts[helpPage.context].files.push({ pagename: helpPage.pagename, xml: helpPage.xml, topContext: helpPage.topContext });
                        }
                    }
                }
                var ctxName;
                for (ctxName in contexts) {
                    var ctx = contexts[ctxName];
                    var j;
                    for (j = 0; j < ctx.files.length; ++j) {
                        if (ctx.files[j].topContext) {
                            if (!contexts[ctx.files[j].topContext]) {
                                var map = build.context[ctx.files[j].topContext];
                                if (map) {
                                    if (map.description) {
                                        var topxml = "<page>\r\n";
                                        topxml += "\t<topic>" + map.classname + " Namespace</topic>\r\n";
                                        topxml += "\t<description>" + map.description + "</description>\r\n";
                                        topxml += "\t<!--list:.-->\r\n";
                                        topxml += "</page>\r\n";
                                        contexts[ctx.files[j].topContext] = { files: [] };
                                        fileOps.push({ filename: map.path + "/index.xml", xml: topxml });
                                    }
                                }
                            }
                        }
                    }
                }
                for (ctxName in contexts) {
                    var map = build.context[ctxName];
                    if (map) {
                        var ctx = contexts[ctxName];
                        var j;
                        for (j = 0; j < ctx.files.length; ++j) {
                            var fn = map.path + '/' + ctx.files[j].pagename + ".xml";
                            fileOps.push({ filename: fn, xml: ctx.files[j].xml });
                        }
                    }
                }
            }
            if (fileOps.length > 0) {
                async.eachSeries(fileOps, function (fileOp, callbackLoopNested) {
                    var folderName = fileOp.filename.substring(0, fileOp.filename.lastIndexOf('/'));
                    dirCreateRecurse(folderName);
                    fs.writeFile(fileOp.filename, fileOp.xml, function (err) {
                        if (err) {
                            console.log('Error writing ' + fileOp.filename + " error " + err);
                        }
                        callbackLoopNested();
                    });
                }, function () {
                    callbackLoop();
                });
            } else {
                callbackLoop();
            }
        });
    });
};


var resolveFiles = function (folders) {
    var recurseFiles = [];
    async.eachSeries(folders, function (path, callbackLoop) {
        if (path.indexOf("*") >= 0) {
            var folder = path.substring(0, path.lastIndexOf('/'));
            fs.readdir(folder, function (err, list) {
                if (err) {
                    console.log(err);
                } else {
                    var i;
                    for (i = 0; i < list.length; ++i) {
                        if (list[i].indexOf(".js") > 0) {
                            sourceFiles.push(folder + "/" + list[i]);
                        } else {
                            var stat = fs.statSync(folder + "/" + list[i]);
                            if (stat && stat.isDirectory()) {
                                recurseFiles.push(folder + "/" + list[i] + "/*.js");
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
    }, function () {
        if (recurseFiles.length > 0) {
            resolveFiles(recurseFiles);
        } else {
            extractJsHelp();
            //console.log(JSON.stringify(sourceFiles));
        }
    });
};

resolveFiles(build.javascript);

