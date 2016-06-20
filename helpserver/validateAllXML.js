// Move images into proper location
var fs = require("fs");
var path = require('path');
var baseFolder = "../helpfiles";
var files = { xml: [] };
var pending = 1;
var xmldoc = require('xmldoc');

var replaceAll = function (str, find, replace) {
    while (str.indexOf(find) >= 0) {
        str = str.replace(find, replace);
    }
    return str;
};

var getAllFiles = function (folder, done) {
    fs.readdir(folder, function (err, list) {
        --pending;
        if (err) {
            done("Error reading folder " + folder + " : " + err);
        } else {
            pending += list.length;
            if (!pending) return done(null);
            list.forEach(function (file) {
                file = path.resolve(folder, file);
                fs.stat(file, function (err, stat) {
                    file = replaceAll(file,"\\","/");
                    if (stat && stat.isDirectory()) {
                        getAllFiles(file, done);
                    } else {
                        --pending;
                        if (file.indexOf('.xml') > 0) 
                            files.xml.push({ filename: file, data: null });
                    }
                    if (!pending) return done(null);
                });
            });
        }
    });
};

var extractTitle = function(page) {
    var topicStart = page.indexOf("<topic>");
    if (topicStart > 0) {
        var topicEnd = page.indexOf("</topic>");
        topicStart += 7;
        if (topicEnd > topicStart) {
            var topic = page.substring(topicStart, topicEnd).trim();
            if (topic.length > 0)
                return topic;
        }
    }
    return null;
}
var extractDescription = function(page) {
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


getAllFiles(baseFolder, function (err) {    
    if (err) {
        console.log(err);
    } else {
        // Read all the data
        var async = require('async');
        async.eachSeries(files.xml, function (file, callbackLoop) {
            fs.readFile(file.filename, "utf8", function (err, data) {
                if (err) {
                    console.log("err reading file " + file.filename);
                } else {
                    var document = null;
                    try {
                        document = new xmldoc.XmlDocument(data);
                        if( !document.description ) {
                            if( extractDescription(data) == null ) {
                                console.log("(FILE=" + file.filename+ ")\n Warning: missing description");
                            }
                        } 
                        if( !document.topic ) {
                            if( extractTitle(data) == null ) {
                                 console.log("(FILE=" + file.filename+ ")\n Warning: missing topic");
                            }                            
                        }
                    } catch (err) {
                        console.log("(FILE=" + file.filename+ ")\n Error: "+ err);
                    }
                }
                callbackLoop();
            });
        }, function () {
        });
    }
});