/*
 * Generate help pages from javascript files
 */
var keywordHash = {
    "readonly": "readonly=\"true\"",
    "writeonly": "writeonly=\"true\"",
    "pseudo": "pseudo=\"true\"",
    "optional": "optional=\"true\"",
    "deprecated": "deprecated=\"true\"",
    "obsolete": "obsolete=\"true\""
};
var build = require("./build.json");
var fs = require("fs");
var async = require('async');
var esprima = require('esprima');
var macros = require('./macros.js');
var sourceFiles = [];
var inheritance = [];
var methodIndex = {};
var lastContext = null;
var dirCreateRecurs = function(folderName) {
    var stats = null;
    try {
        stats = fs.statSync(folderName);
    } catch (e) {};

    if (!stats || !stats.isDirectory()) {
        var parentFolderName = folderName.substring(0, folderName.lastIndexOf('/'));
        if (parentFolderName.length > 1) {
            dirCreateRecurs(parentFolderName);
        }
        fs.mkdirSync(folderName);
    }
};



var indentLevelCalc = function(txt) {
    var i;
    for (i = 0; i < txt.length; ++i) {
        if (txt[i] !== '\t') {
            if (txt[i] <= ' ')
                return 0;
            return i;
        }
    }
    return 0;
};
var processLink = function(linkDef) {
    var parts = linkDef.replace(/\}[\s]*\{/g,' Object - ').split("{");
    if (parts.length === 2) {
        linkDef = parts[0] + " " + parts[1].replace("}", "") + " Object";
    }
    return linkDef;
};
var protectXml = function(content) {
    if (content.indexOf("[link:") >= 0) {
        content = content.split("[link:")
        var i;
        for (i = 1; i < content.length; ++i) {
            var endPos = content[i].indexOf("]");
            if (endPos > 0) {
                content[i] = processLink(content[i].substring(0, endPos)) + "]*" + content[i].substring(endPos + 1);
            } else {
                content[i] = processLink(content[i]) + "]*";
            }
        }
        content = content.join("*[link:");
    }
    if (content.indexOf("&") >= 0 ||
        content.indexOf("<") >= 0 ||
        content.indexOf(">") >= 0
    ) {
        content = content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }
    return content;
};
var addPara = function(content) {
    content = content.trim().split("\r\n\r\n").join("\r\n</p>\r\n<p>\r\n");
    return "\r\n<p>\r\n" + content + "\r\n</p>\r\n";
}
var processTypes = function(type) {
    if (type.indexOf("|") != -1) {
        type = type.split("|");
        for (var i = 0; i < type.length; i++) type[i] = "<type>" + type[i].trim() + "</type>";
        return "<types>" + type.join("") + "</types>";
    } else return "<type>" + type + "</type>";
}

var processArgOrProc = function(line, dashPos, properties) {
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

    var argAlts = argType.split("|");
    var i;
    var argFlags = "";
    var flags = "";
    argType = "";
    for (i = 0; i < argAlts.length; ++i) {
        var argAlt = argAlts[i];
        var argTypeParts = argAlt.split(":");
        if (argType !== "") {
            argType += " | ";
        }
        argType += argTypeParts[0];
        if (argTypeParts.length > 1) {
            if (argFlags !== "") {
                argFlags += ",";
            }
            argFlags += argTypeParts[1];
        }
    }
    if (argFlags !== "") {
        argFlags = argFlags.split(",");
        for (i = 0; i < argFlags.length; ++i) {
            var flag = keywordHash[argFlags[i].trim().toLowerCase()];
            if (flag) {
                flags += " " + flag;
            }
        }
    }

    var lastObj = { name: argName, type: argType, description: description, flags: flags.trim() };
    properties.push(lastObj);
    return lastObj;
}
var RecursProperties = function(properties, indented) {
    var xml = "";
    if (properties.length > 0) {
        var i = 0;
        xml += indented + "<properties>\r\n";
        for (i = 0; i < properties.length; ++i) {
            if (properties[i].flags !== "") {
                xml += indented + "\t<property " + properties[i].flags + " >\r\n";
            } else {
                xml += indented + "\t<property>\r\n";
            }
            xml += indented + "\t\t<name>" + properties[i].name + "</name>\r\n";
            if (properties[i].type !== "") {
                xml += indented + "\t\t" + processTypes(properties[i].type) + "\r\n";
            }
            xml += indented + "\t\t<description>" + protectXml(properties[i].description) + "</description>\r\n";
            if (properties[i].arguments) {
                var j;
                xml += indented + "\t\t<arguments>\r\n";
                for (j = 0; j < properties[i].arguments.length; ++j) {
                    if (properties[i].arguments[j].flags !== "") {
                        xml += indented + "\t\t\t<argument " + properties[i].arguments[j].flags + " >\r\n";
                    } else {
                        xml += indented + "\t\t\t<argument>\r\n";
                    }
                    xml += indented + "\t\t\t\t<name>" + properties[i].arguments[j].name + "</name>\r\n";
                    if (properties[i].arguments[j].type !== "") {
                        xml += indented + "\t\t\t\t" + processTypes(properties[i].arguments[j].type) + "\r\n";
                    }
                    xml += indented + "\t\t\t\t<description>" + protectXml(properties[i].arguments[j].description) + "</description>\r\n";
                    xml += indented + "\t\t\t</argument>\r\n";
                }
                xml += indented + "\t\t</arguments>\r\n";
            }
            if (properties[i].properties && properties[i].properties.length) {
                xml += RecursProperties(properties[i].properties, indented + "\t\t");
            }
            xml += indented + "\t</property>\r\n";
        }
        xml += indented + "</properties>\r\n";
    }
    return xml;
};

var buildContext = function(content,buildNum) {
    var lines = content.split('\n');
    var line = null;
    var type = null;
    var context = lastContext;
    for (i = 0; i < lines.length; ++i) {
        line = lines[i].trim().toLowerCase();
        if (line.indexOf('class:') === 0 || line.indexOf('namespace:') === 0 || line.indexOf('object:') === 0) {
			
            context = lines[i].substr(lines[i].indexOf(':') + 1).trim();
            type = line.split(':')[0].trim();
			console.log('A type:'+type+' ctx: '+context);
			
            if (line.indexOf('object:') !== 0) {
                lastContext = context;
            } else if (context.indexOf('.') < 0) {
                // Object does not have a fully qualified name
                context = lastContext + '.' + context;
            }

            if (!build.context[context]) {
                var allParts = context.split(/[\.\{]/g);
                if (allParts.length > 1) {
                    var parentContext = build.context[allParts[0]];
                    if (parentContext) {
                        if(context.indexOf("{") != -1) console.log('!!!!! sub object !!!!\n'+allParts)
                        var tContext = allParts.shift();
                        var tParentContext = null;
                        for (var j = 0; j < allParts.length - 1; j++) {
                            tParentContext = build.context[tContext + '.' + allParts[j]];
                            if (tParentContext) {
                                allParts[j] += '_' + tParentContext.type;
                            } else {
                                console.log(allParts[j][allParts[j].length-1])
                                if(allParts[j][allParts[j].length-1] == '}')  allParts[j] = allParts[j].substr(0,allParts[j].length-1)+'_object';
								else if(allParts[j][0].toUpperCase() ===  allParts[j][0]) allParts[j] += '_class';
								else allParts[j] += '_namespace';
                            }
                            
                        }
                        build.context[context.replace(/\{/g,'.').replace(/\}/g,'')] = { path: parentContext.path + '/' + allParts.join('/') + '_' + type, classname: context, type: type, build: buildNum};
                        console.log("Added context: " + context.replace(/\{/g,'.').replace(/\}/g,'') + " - path: " + allParts);
                    } else {
                        console.log("Could not find parent: " + allParts[0]);
                    }
                }
            }
        } else if (line.indexOf('context:') === 0) {
            lastContext = lines[i].substr(lines[i].indexOf(':') + 1).trim();
        }
    }
}

var expandShorthand = function(macro, env, args) {
    var macro = macros[macro];
    if (macro) {
        return macro(env, args);
    }
    return null;
};

var generateXMLHelp = function(content,buildNum) {
    var lines = content.split('\n');
    var i, j;
    var context = lastContext;
    var methods = [];
    var temp = null;
    var lastType = null;
    var description = null;
    var discussion = null;
    var examples = null;
    var note = null;
    var warning = null;
    var deprecated = null;
    var obsolete = null;
    var seeAlso = null;
    var endTag = null;
    var properties = [];
    var arguments = [];
    var returns = [];
    var isFunction = false;
    var isConstructor = false;
    var endTagType = [];
    var exampleIndent = null;
    var lastPropOrArg = null;
    var topContext = null;
    var contextType = "";
    var lastIndentLevel = 0;
    var nestingProps = [];
    var titleContext = null;
    var inheritsFrom = null;
    var splitIndex, macro, args;
    var indentText = "";

    //+++++++++++++++++++
    // Shorthand pre-processor...
    for (i = 0; i < lines.length; ++i) {
        var indentLevel = indentLevelCalc(lines[i]);
        var line = lines[i].trim();

        // Shorthand macro preprocessor....
        while (line.substr(0, 1) === '[') {
            splitIndex = line.indexOf(':');
            if (splitIndex > 0) {
                if (line.substr(line.length - 1, 1) === ']') {
                    macro = line.substring(1, splitIndex);
                    args = line.substring(splitIndex + 1, line.length - 1);
                    indentText = "";
                    if (indentLevel > 0) {
                        for (j = 0; j < indentLevel; ++j) {
                            indentText += "\t";
                        }
                    }
                    var insertLines = expandShorthand(macro, {
                        indentLevel: indentLevel,
                        indexText: indentText,
                        context: context
                    }, args);
                    if (insertLines) {
                        if (insertLines.length === 0) {
                            line = null;
                            break;
                        }
                        line = insertLines[0];
                        indentLevel = indentLevelCalc(line);
                        line = line.trim();
                        if (insertLines.length > 1) {
                            // Insert remaining lines....
                            insertLines = insertLines.slice(1);
                            lines = [].concat(lines.slice(0, i + 1), insertLines, lines.slice(i + 1));
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        //-----------------------------
        if (!line) {
            if (lastType && !endTag) {
                if (lastType === "discussion" || lastType === "disc") {
                    discussion += "\r\n";
                } else if (lastType === "description" || lastType === "desc") {
                    description += "\r\n";
                }
            }
            continue;
        }

        if (endTag && line.indexOf(endTag) >= 0) {
            lastType = null;
            endTag = null;
            if (endTagType.length > 0) {
                lastType = endTagType[endTagType.length - 1];
                endTagType.splice(endTagType.length - 1, 1);
            }
        } else if (!endTag) {
            var saveString = "";
            if (line[0] === "'") {
                line = line.split("'");
                if (line.length > 2) {
                    saveString = "'" + line[1] + "'";
                    line.splice(0, 2);
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

            if (saveString.length > 0) {
                splitPos += saveString.length;
                dashPos += saveString.length;
                typePos += saveString.length;
                line = saveString + line;
            }
            var type = null;
            if (splitPos > 0) {
                if (dashPos < 0 || splitPos < dashPos) {
                    if (typePos < 0 || splitPos < typePos) {
                        type = line.substring(0, splitPos).toLowerCase().trim();
                        if (type.indexOf(" ") !== -1) type = null;
                    }
                }
            }


            if (type) {
                if (type === "context") {
                    context = line.substring(splitPos + 1).trim().replace(/\{/g,'.').replace(/\}/g,'');
                    topContext = context;
                } else if (type === "namespace" || type === "class" || type === "object") {
                    context = line.substring(splitPos + 1).trim().replace(/\{/g,'.').replace(/\}/g,'');
					console.log('B type:'+type+' ctx: '+context);
                    if (context.indexOf('.') < 0 && type === "object" && topContext) {
                        // Object does not have a fully qualified name
                        //titleContext = context; // This line strips out the class prefix for context - which is deemed undesirable now
                        context = topContext + '.' + context;
                    }
                    if (type === "class") {
                        contextType = " Class";
                        console.log("Found a class: " + context);
                    } else if (type === "object") {
                        contextType = " Object";
                        console.log("Found an object: " + context);
                    } else {
                        contextType = " Namespace";
                        console.log("Found a namespace: " + context);
                    }
                    inheritsFrom = null;
                } else if (type === "inherits") {
                    if (contextType === " Class") {
                        inheritsFrom = line.substring(splitPos + 1).trim();
                        inheritance.push({ className: context, inherits: inheritsFrom });
                    } else {
                        console.log("Inherits requires class context");
                    }
                } else if (type === "method" || type === "function" || type === "funct" || type === "func" || type === "fun" || type === "constructor" || type === "cons") {
                    temp = line.substring(splitPos + 1).trim();
                    temp = temp.split('|');
                    if (temp.length > 1) {
                        methods.push(temp[0]);
                        for (var j = 1; j < temp.length; j++) {
                            methods.push(temp[0].split('(')[0] + temp[j]);
                        }
                    } else methods.push(temp[0]);
                    if (type === "function" || type === "funct" || type === "func" || type === "fun") isFunction = true;
                    else if (type === "constructor" || type === "cons") isConstructor = true;
                } else if (type === "description" || type === "desc") {
                    description = line.substring(splitPos + 1);
                } else if (type === "discussion" || type === "disc") {
                    discussion = line.substring(splitPos + 1);
                } else if (type === "note") {
                    note = line.substring(splitPos + 1);
                } else if (type === "warning") {
                    warning = line.substring(splitPos + 1);
                } else if (type === "deprecated") {
                    deprecated = line.substring(splitPos + 1);
                } else if (type === "obsolete") {
                    obsolete = line.substring(splitPos + 1);
                } else if (type === "seealso" || type === "see") {
                    seeAlso = line.substring(splitPos + 1);
                } else if (type === "arguments" || type === "args") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                        if (nestingProps.length === 0)
                            lastPropOrArg = null;
                    } else {
                        endTagType.push(lastType);
                    }
                } else if (type === "properties" || type === "props") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                        if (nestingProps.length === 0)
                            lastPropOrArg = null;
                    } else {
                        endTagType.push(lastType);
                    }
                } else if (type === "returns") {
                    endTag = line.substring(splitPos + 1).trim();
                    if (endTag.length === 0) {
                        endTag = null;
                        if (nestingProps.length === 0)
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
                    exampleIndent = null;
                }
                lastType = type;
            } else if (lastType === "description" || lastType === "desc") {
                description += "\r\n" + line;
            } else if (lastType === "discussion" || lastType === "disc") {
                discussion += "\r\n" + line;
            } else if (lastType === "note") {
                note += "\r\n" + line;
            } else if (lastType === "warning") {
                warning += "\r\n" + line;
            } else if (lastType === "deprecated") {
                deprecated += "\r\n" + line;
            } else if (lastType === "obsolete") {
                obsolete += "\r\n" + line;
            } else if (lastType === "seealso" || lastType === "see") {
                seeAlso += "\r\n" + line;
            } else if (lastType === "example") {
                if (exampleIndent == null) {
                    examples += "\r\n" + line;
                    exampleIndent = lines[i].search(/\S/);
                } else {
                    examples += "\r\n" + lines[i].substr(exampleIndent).replace("\r", "");
                }
            } else if (lastType === "arguments" ||
                lastType === "args"
            ) {
                if (dashPos > 0) {
                    if (!endTag && lastPropOrArg) {
                        if (lastIndentLevel === (indentLevel - 1)) {
                            if (!lastPropOrArg.properties)
                                lastPropOrArg.properties = [];
                            nestingProps.push(lastPropOrArg);
                        } else if (lastIndentLevel > indentLevel) {
                            while (lastIndentLevel > indentLevel && nestingProps.length > 0) {
                                lastPropOrArg = nestingProps.pop();
                                --lastIndentLevel;
                            }
                        }
                    }
                    if (nestingProps.length > 0) {
                        lastPropOrArg = processArgOrProc(line, dashPos, nestingProps[nestingProps.length - 1].properties);
                    } else {
                        lastPropOrArg = processArgOrProc(line, dashPos, arguments);
                    }
                }
            } else if (lastType === "returns") {
                if (dashPos > 0) {
                    if (!endTag && lastPropOrArg) {
                        if (lastIndentLevel === (indentLevel - 1)) {
                            if (!lastPropOrArg.properties)
                                lastPropOrArg.properties = [];
                            nestingProps.push(lastPropOrArg);
                        } else if (lastIndentLevel > indentLevel) {
                            while (lastIndentLevel > indentLevel && nestingProps.length > 0) {
                                lastPropOrArg = nestingProps.pop();
                                --lastIndentLevel;
                            }
                        }
                    }
                    if (nestingProps.length > 0) {
                        lastPropOrArg = processArgOrProc(line, dashPos, nestingProps[nestingProps.length - 1].properties);
                    } else {
                        lastPropOrArg = processArgOrProc(line, dashPos, returns);
                    }
                }
            } else if (lastType === "properties" ||
                lastType === "props"
            ) {
                if (dashPos > 0) {
                    if (!endTag && lastPropOrArg) {
                        if (lastIndentLevel === (indentLevel - 1)) {
                            if (!lastPropOrArg.properties)
                                lastPropOrArg.properties = [];
                            nestingProps.push(lastPropOrArg);
                        } else if (lastIndentLevel > indentLevel) {
                            while (lastIndentLevel > indentLevel && nestingProps.length > 0) {
                                lastPropOrArg = nestingProps.pop();
                                --lastIndentLevel;
                            }
                        }
                    }
                    if (nestingProps.length > 0) {
                        lastPropOrArg = processArgOrProc(line, dashPos, nestingProps[nestingProps.length - 1].properties);
                    } else {
                        lastPropOrArg = processArgOrProc(line, dashPos, properties);
                    }
                }
            }
        } else if (lastType === "example") {
            if (exampleIndent == null) {
                examples += "\r\n" + line;
                exampleIndent = lines[i].search(/\S/);
            } else {
                examples += "\r\n" + lines[i].substr(exampleIndent).replace("\r", "");
            }
        } else if (lastType === "arguments" || lastType === "args" || lastType === "properties" || lastType === "props" || lastType === "returns") {
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
                    if (lastType === "properties" || lastType === "props") {
                        if (!lastPropOrArg.properties) {
                            lastPropOrArg.properties = [];
                        }
                        processArgOrProc(line, dashPos, lastPropOrArg.properties);
                    } else if (lastType === "returns") {
                        if (!lastPropOrArg.returns) {
                            lastPropOrArg.returns = [];
                        }
                        processArgOrProc(line, dashPos, lastPropOrArg.returns);
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
    var pageName = methods[0] || false;
    if (pageName) {
        var methodArgsPos = pageName.indexOf('(');
        if (methodArgsPos > 0) {
            pageName = pageName.substring(0, methodArgsPos);
        }
        pageName = pageName.trim();
        if (isConstructor) {
            pageName += " Constructor";
        } else if (isFunction) {
            pageName += " Function";
        } else {
            pageName += " Method";
        }
        var lContext = context.toLowerCase().trim();
        if (!methodIndex[lContext]) {
            methodIndex[lContext] = [];
        }
        methodIndex[lContext].push({ name: pageName.split(".").pop(), description: description });
    }
	var buildTxt = '';
	if(buildNum != '') buildTxt = 'build="'+buildNum+'" ';
    var xml = "<page "+buildTxt+"api=\"js\" generated=\"true\">\r\n";

    if (pageName) {
        xml += "\t<shortlink>" + protectXml("api client api " + pageName.replace(/\./g, " ").toLowerCase()) + "</shortlink>\r\n";

        var map = build.context[context];
        var topStartTag = "\t<topic>";
        if (pageName.indexOf(" Method") > 0) {
            var lastDotPos = pageName.lastIndexOf(".");
            if (lastDotPos > 0) {
                if (map && (map.type === "namespace" || map.type === 'object')) {
                    console.log("classOrNamespace is a "+map.type);
                    topStartTag = "\t<topic parent=\"" + context + "\" parentType=\""+map.type+"\" elementName=\"" + pageName.substring(lastDotPos + 1) + "\" >";
                } else {
                    topStartTag = "\t<topic parent=\"" + context + "\" parentType=\"class\" elementName=\"" + pageName.substring(lastDotPos + 1) + "\" >";
                }
            }
        }
        if (isConstructor) {
            xml += topStartTag + protectXml(pageName) + "</topic>\r\n";
        } else if (map && map.classname) {
            var normalizedClass = map.classname.toLowerCase().trim() + ".";
            var normalizedPageName = pageName.toLowerCase().trim();

            if (normalizedPageName.substring(0, normalizedClass.length) === normalizedClass) {
                xml += topStartTag + protectXml(pageName) + "</topic>\r\n";
            } else {
                xml += topStartTag + protectXml(map.classname + "." + pageName) + "</topic>\r\n";
            }
        } else {
            xml += topStartTag + protectXml(pageName) + "</topic>\r\n";
        }
    } else if (contextType.length > 0) {
        xml += "\t<shortlink>" + protectXml("api client api " + (context + contextType).replace(/\./g, " ").toLowerCase()) + "</shortlink>\r\n";
        if (titleContext) {
            xml += "\t<topic>" + protectXml(titleContext + contextType) + "</topic>\r\n";
            titleContext = null;
        } else {
            var lastDotPos = context.lastIndexOf(".");
            var parentContextName = null;
            var parentContextType = null;
            var elementName = null;
            if (lastDotPos > 0) {
                parentContextName = context.substring(0, lastDotPos);
				console.log('looking: '+parentContextName)
                console.log('JSON: '+JSON.stringify(build.context[parentContextName]))
                if (build.context[parentContextName].type === "class") {
                    parentContextType = "class";
                } else if (build.context[parentContextName].type === "object") {
                    parentContextType = "object";
                } else {
                    parentContextType = "namespace";
                }
                elementName = context.substring(lastDotPos + 1) + contextType;
            }
            if (parentContextName) {
                xml += "\t<topic parent=\"" + parentContextName + "\" parentType=\"" + parentContextType + "\" elementName=\"" + elementName + "\" >" + protectXml(context + contextType) + "</topic>\r\n";
            } else {
                xml += "\t<topic>" + protectXml(context + contextType) + "</topic>\r\n";
            }
        }
    }
    if (inheritsFrom) {
        xml += "\t<inherits>" + protectXml(inheritsFrom) + "</inherits>\r\n";
    }

    if (methods.length === 1) {
        xml += "\t<prototype>" + protectXml(methods[0]) + "</prototype>\r\n";
    } else if (methods.length > 1) {
        xml += "\t<prototypes>\r\n";
        for (var i = 0; i < methods.length; i++) xml += "\t\t<prototype>" + protectXml(methods[i]) + "</prototype>\r\n";
        xml += "</prototypes>\r\n";
    }
    if (arguments.length > 0) {
        xml += "\t<arguments>\r\n";
        for (i = 0; i < arguments.length; ++i) {
            if (arguments[i].flags !== "") {
                xml += "\t\t<argument " + arguments[i].flags + " >\r\n";
            } else {
                xml += "\t\t<argument>\r\n";
            }
            xml += "\t\t\t<name>" + arguments[i].name + "</name>\r\n";
            if (arguments[i].type !== "") {
                xml += "\t\t\t" + processTypes(arguments[i].type) + "\r\n";
            }
            xml += "\t\t\t<description>" + protectXml(arguments[i].description) + "</description>\r\n";
            if (arguments[i].properties && arguments[i].properties.length) {
                xml += RecursProperties(arguments[i].properties, "\t\t");
            }
            xml += "\t\t</argument>\r\n";
        }
        xml += "\t</arguments>\r\n";
    }
    console.log(returns.length);
    if (returns.length > 0) {
        xml += "\t<returns>\r\n";
        for (i = 0; i < returns.length; ++i) {
            if (returns[i].flags !== "") {
                xml += "\t\t<return " + returns[i].flags + " >\r\n";
            } else {
                xml += "\t\t<return>\r\n";
            }
            xml += "\t\t\t<name>" + returns[i].name + "</name>\r\n";
            if (returns[i].type !== "") {
                xml += "\t\t\t" + processTypes(returns[i].type) + "\r\n";
            }
            xml += "\t\t\t<description>" + protectXml(returns[i].description) + "</description>\r\n";
            if (returns[i].properties && returns[i].properties.length) {
                xml += RecursProperties(returns[i].properties, "\t\t");
            }
            xml += "\t\t</return>\r\n";
        }
        xml += "\t</returns>\r\n";
    }
    if (description) {
        xml += "\t<description>" + protectXml(description) + "</description>\r\n";
    }
    if (discussion) {
        xml += "\t<discussion>" + addPara(protectXml(discussion)) + "</discussion>\r\n";
    }
    xml += RecursProperties(properties, "\t");
    if (examples) {
        xml += "\t<example code=\"js\">" + protectXml(examples) + "</example>\r\n";
    }
    if (note) {
        xml += "\t<note>" + protectXml(note) + "</note>\r\n";
    }
    if (warning) {
        xml += "\t<warning>" + protectXml(warning) + "</warning>\r\n";
    }
    if (deprecated) {
        xml += "\t<deprecated>" + protectXml(deprecated) + "</deprecated>\r\n";
    }
    if (obsolete) {
        xml += "\t<obsolete>" + protectXml(obsolete) + "</obsolete>\r\n";
    }
    if (seeAlso) {
        seeAlso = seeAlso.trim().replace(/\n/g, ',').split(',');
        xml += "\t<see>\r\n";
        for (var i = 0; i < seeAlso.length; i++) xml += "\t\t<ref>" + protectXml(seeAlso[i].trim()) + "</ref>\r\n";
        xml += "</see>\r\n";
    }


    if (isConstructor) {
        pageName = "index";
        xml += "\t<!--list:.-->\r\n";
    }
    if (!pageName) {
        var hasNonMethodChildren = false;
        if (context) {
            var contextI;
            for (contextI in build.context) {
                if (contextI.length > context.length + 1) {
                    if (contextI.indexOf(context + ".") === 0) {
                        hasNonMethodChildren = true;
                        break;
                    }
                }
            }
        }
        pageName = "index";
        if (hasNonMethodChildren) {
            xml += "\t<!--list:* Method-->\r\n";
            xml += "\t<!--list:*index.xml-->\r\n";
        } else {
            console.log("No children: " + context);
            xml += "\t<!--list:.-->\r\n";
        }
    }
    //----------- Add annotations file reference -------------------------
    if (xml.indexOf("<sections>") < 0) {
        xml += "\t<annotations>__buildHelpPagePath__" + pageName + ".xml</annotations>\r\n";
    }
    xml += "</page>\r\n";
    lastContext = context;
    pageName = pageName.split(".").pop();
    return { context: context.trim(), pagename: pageName, xml: xml, topContext: topContext };
};

var extractJsHelp = function() {
    async.eachSeries(sourceFiles, function(path, callbackLoop) {
        fs.readFile(path, "utf8", function(err, code) {
            var fileOps = [];
            if (err) {
                console.log(err);
            } else {
                var options = { loc: true, range: false, comment: true }
                var syntax = esprima.tokenize(code, options);
                var i;
				var docStartIndx = 0;
				var buildNum = '';
                var contexts = {};
                lastContext = null;
				
                console.log("---------- " + path.split("/").pop() + " ----------");
				
                for (i = 0; i < syntax.comments.length; ++i) {
                    if (syntax.comments[i].type === "Block") {
                        var content = syntax.comments[i].value.trim();
                        if (content.substring(0, 5) === "[DOC:" && content.substring(content.length - 1) === ']') {
							docStartIndx = content.indexOf('\n')-1;
							buildNum = content.substring(5,docStartIndx).trim();
                            content = content.substring(docStartIndx, content.length - 1).trim();
                            buildContext(content,buildNum);
                        }
                    }
                }
                console.log("");
                for (i = 0; i < syntax.comments.length; ++i) {
                    if (syntax.comments[i].type === "Block") {
                        var content = syntax.comments[i].value.trim();
                        if (content.substring(0, 5) === "[DOC:" && content.substring(content.length - 1) === ']') {
							docStartIndx = content.indexOf('\n')-1;
							buildNum = content.substring(5,docStartIndx).trim();
                            content = content.substring(docStartIndx, content.length - 1).trim();
                            var helpPage = generateXMLHelp(content,buildNum);
                            if (!contexts[helpPage.context])
                                contexts[helpPage.context] = { files: [] };
                            contexts[helpPage.context].files.push({ pagename: helpPage.pagename, xml: helpPage.xml, topContext: helpPage.topContext });
                        }
                    }
                }
                console.log("\n");

                var ctxName;
				var buildTxt = '';
                for (ctxName in contexts) {
                    var ctx = contexts[ctxName];
                    var j;
                    for (j = 0; j < ctx.files.length; ++j) {
                        if (ctx.files[j].topContext) {
                            if (!contexts[ctx.files[j].topContext]) {
                                var map = build.context[ctx.files[j].topContext];
                                if (map) {
                                    if (map.description) {
										buildTxt = '';
										if(map.build != '' && typeof map.build == 'string') buildTxt = 'build="'+map.build+'" ';
                                        var topXml = "<page "+buildTxt+"api=\"js\" generated=\"true\">\r\n";
                                        topXml += "\t<topic>" + map.classname + " Namespace</topic>\r\n";
                                        topXml += "\t<description>" + protectXml(map.description) + "</description>\r\n";
                                        topXml += "\t<!--list:.-->\r\n";
                                        topXml += "</page>\r\n";
                                        contexts[ctx.files[j].topContext] = { files: [] };
                                        fileOps.push({ filename: map.path + "/index.xml", xml: topXml });
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
                            var xml = ctx.files[j].xml;
                            var replacePath = map.path + '/';
                            var replacePathLoc = replacePath.indexOf("/helpfiles/");
                            if (replacePathLoc >= 0) {
                                replacePath = replacePath.substring(replacePathLoc + 10);
                            }
                            xml = xml.replace("__buildHelpPagePath__", replacePath);
                            fileOps.push({ filename: fn, xml: xml });
                        }
                    }
                }
            }
            if (fileOps.length > 0) {
                async.eachSeries(fileOps, function(fileOp, callbackLoopNested) {
                    var folderName = fileOp.filename.substring(0, fileOp.filename.lastIndexOf('/'));
                    dirCreateRecurs(folderName);
                    fs.writeFile(fileOp.filename, fileOp.xml, function(err) {
                        if (err) {
                            console.log('Error writing ' + fileOp.filename + " error " + err);
                        }
                        callbackLoopNested();
                    });
                }, function() {
                    callbackLoop();
                });
            } else {
                callbackLoop();
            }
        });
    }, function() {
        if (inheritance.length > 0) {
            async.eachSeries(inheritance, function(inherit, callbackNextInherit) {
                var from = inherit.inherits.toLowerCase().trim();
                var replace = "\t<replace>/" + protectXml(inherit.inherits.trim()) + "/" + protectXml(inherit.className.trim()) + "/</replace>\r\n";
                if (methodIndex[from]) {
                    var pathLast = inherit.inherits.split(".");
                    var prefix = "../" + pathLast[pathLast.length - 1] + "_class/";
                    async.eachSeries(methodIndex[from], function(methodDef, callBackNextMethod) {
                        var map = build.context[inherit.className];
                        var fn = map.path + "/" + methodDef.name + ".xml";
                        fs.readFile(fn, "utf8", function(err, data) {
                            var overwriteFile = false;
                            if (err) {
                                overwriteFile = true;
                                data = "";
                            } else {
                                var startSymLink = data.indexOf("<symlink>");
                                if (startSymLink > 0) {
                                    var endSymLink = data.indexOf("</symlink>");
                                    if (startSymLink < endSymLink) {
                                        overwriteFile = true;
                                    }
                                }
                            }
                            if (!overwriteFile) {
                                console.log(fn + " already exists");
                                callBackNextMethod();
                            } else {
                                var xml = "<page>\r\n";
                                var pageName = inherit.className + "." + methodDef.name;
                                var pageTopic = inherit.className + "." + methodDef.name;
                                xml += "\t<symlink>" + protectXml(prefix + methodDef.name + ".xml") + "</symlink>\r\n";
                                xml += "\t<shortlink>" + protectXml("api client api " + pageName.replace(/\./g, " ").toLowerCase()) + "</shortlink>\r\n";
                                xml += "\t<topic";
                                if (pageName.indexOf(" Method") > 0) {
                                    var lastDotPos = pageName.lastIndexOf(".");
                                    if (lastDotPos > 0) {
                                        xml += " parent=\"" + inherit.className + "\" parentType=\"class\" elementName=\"" + pageName.substring(lastDotPos + 1) + "\" ";
                                    }
                                }
                                xml += ">" + protectXml(pageTopic) + "</topic>\r\n";
                                xml += "\t<description>" + protectXml(methodDef.description) + "</description>\r\n";
                                xml += replace;
                                xml += "</page>";
                                if (data === xml) {
                                    console.log(fn + " not changed");
                                    callBackNextMethod();
                                } else {
                                    fs.writeFile(fn, xml, function(err) {
                                        if (err) {
                                            console.log("Error writing " + fn + " " + err);
                                        }
                                        callBackNextMethod();
                                    });
                                }
                            }
                        });
                    }, function() {
                        callbackNextInherit();
                    });
                } else {
                    callbackNextInherit();
                }
            });
        }
    });
};


var resolveFiles = function(folders) {
    var RecursFiles = [];
    async.eachSeries(folders, function(path, callbackLoop) {
        if (path.indexOf("*") >= 0) {
            var folder = path.substring(0, path.lastIndexOf('/'));
            fs.readdir(folder, function(err, list) {
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
                                RecursFiles.push(folder + "/" + list[i] + "/*.js");
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
    }, function() {
        if (RecursFiles.length > 0) {
            resolveFiles(RecursFiles);
        } else {
            extractJsHelp();
            //console.log(JSON.stringify(sourceFiles));
        }
    });
};

resolveFiles(build.javascript);