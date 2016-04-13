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