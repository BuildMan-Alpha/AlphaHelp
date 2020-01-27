var fs = require("fs");
var async = require('async');
var listFile = "../generated/list.json";

var files = fs.readFileSync(listFile, "utf8");
var list = JSON.parse(files);

var getFunctionName = function (ptr, nocasepath) {
    functionName = "";
    if (nocasepath.indexOf(" function.xml") > 0 || nocasepath.indexOf(" method.xml") > 0) {
        //var functionName = ptr.path.substring(ptr.path.lastIndexOf("/")+1);
        //functionName = functionName.substring( 0 , functionName.lastIndexOf(' ') );
        functionName = ptr.title;
    } else if (nocasepath.indexOf("().xml") > 0) {
        //functionName = ptr.path.substring(ptr.path.lastIndexOf("/")+1);
        //functionName = functionName.substring( 0 , functionName.lastIndexOf('().xml') ).trim();
        functionName = ptr.title;
    }
    return functionName;
}

var filearr = [];

var extractTagRegex = function (page, tag) {
    var startTag = new RegExp('<' + tag + '[^>]*>');
    var endTag = new RegExp('</' + tag + '>');
    var temp = page;
    var tagStart = temp.search(startTag);
    if (tagStart > 0) {
        temp = temp.split(startTag)[1];
        var tagEnd = temp.search(endTag);
        if (tagEnd > 0) {
            temp = temp.split(endTag)[0];
            return temp;
        }
    }
    return "";
}

var removeCDATA = function (str) {
    if (str.substring(0, 9) === "<![CDATA[") {
        str = str.substring(9).split("]]>")[0].trim();
    }
    return str;
}

async.eachSeries(list, function (fo, callbackLoop) {
    if ((fo.file.indexOf('\\Ref\\') >= 0)) {
        if (fo.file.toLowerCase().indexOf('.xml') > 0 || fo.file.toLowerCase().indexOf('.html') > 0) {
            fs.readFile(fo.file, "utf8", function (err, page) {
                if (!err) {
                    var pageTopic = null;
                    if (fo.file.toLowerCase().indexOf('.xml') > 0) {
                        pageTopic = removeCDATA(extractTagRegex(page, "topic").trim());
                    } else {
                        pageTopic = extractTagRegex(page, "title").trim();
                    }
                    var pathName = fo.file.split("\\").join("/").split("/helpfiles/")[1];
                    if (pageTopic.length > 0) {
                        filearr.push({ "title": pageTopic, "path": pathName });
                    }
                }
                callbackLoop();
            });
        } else {
            callbackLoop();
        }
    } else {
        callbackLoop();
    }
}, function () {
    console.log(filearr);
    var funcArray = [];
    var i;
    for (i = 0; i < filearr.length; ++i) {
        var ptr = filearr[i];
        //console.log(ptr.path.indexOf("/Ref"));
        console.log(ptr);
        var nocasepath = ptr.path.toLowerCase();
        if (ptr.path.indexOf("/Api/") > 0) {
            functionName = getFunctionName(ptr, nocasepath);
            if (functionName !== "") {
                funcArray.push(functionName);
            }
        } else if (ptr.path.indexOf("/Desktop_Api/") > 0) {
            functionName = getFunctionName(ptr, nocasepath);
            if (functionName !== "") {
                funcArray.push(functionName);
            }
        }
    }
    funcArray.sort();
    //console.log(funcArray);
    fs.writeFile("../helpfiles/functionList.json", JSON.stringify(funcArray), function () { return; });
});
