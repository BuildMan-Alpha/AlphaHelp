// Move images into proper location
var fs = require("fs");
var path = require('path');
if( process.argv.length < 3  ) {
    console.log("node fixupimageref <folder> - move or copy ")
    process.exit(0)
}
var baseFolder = process.argv[2]; //../helpfiles/Ref/Api/Functions/Data Type/Array Functions";
baseFolder = baseFolder.split("\\").join("/")

var files = { xml: [], images: [] };
var pending = 1;
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
                        if (file.indexOf('/images/') >= 0) {
                            files.images.push({ filename: file, localreference: false, copied: [] });
                        } else if (file.indexOf('.xml') > 0) {
                            files.xml.push({ filename: file, data: null });
                        }
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
                    file.data = data.toLowerCase();
                }
                callbackLoop();
            });
        }, function () {
            var i, j, k;
            for (i = 0; i < files.images.length; ++i) {
                var imageRef = files.images[i];
                var imageNamePattern = imageRef.filename.toLowerCase();
                var imageName = imageRef.filename.substring(imageRef.filename.lastIndexOf('/') + 1);
                imageNamePattern = imageNamePattern.substring(imageNamePattern.indexOf('/images/') + 1);
                for (j = 0; j < files.xml.length; ++j) {
                    var src = files.xml[j].data;
                    if (src) {
                        if (src.indexOf(imageNamePattern) > 0) {
                            var subFolder = files.xml[j].filename;
                            subFolder = subFolder.substring(0, subFolder.lastIndexOf('/')) + "/images/" + imageName;
                            if (subFolder == imageRef.filename) {
                                imageRef.localreference = true;
                            } else {
                                for (k = 0; k < imageRef.copied.length; ++k) {
                                    if (imageRef.copied[k] == subFolder) {
                                        subFolder = null;
                                        break;
                                    }
                                }
                                if (subFolder) {
                                    imageRef.copied.push(subFolder);
                                }
                            }
                        }
                    }
                }
            }
            async.eachSeries(files.images, function (imageRef, callbackLoop) {
                if (imageRef.copied.length > 0) {
                    if (imageRef.copied.length == 1 && !imageRef.localreference) {
                        console.log(replaceAll("MD \""+ imageRef.copied[0].substring(0,imageRef.copied[0].lastIndexOf('/'))+"\"","/","\\"));                            
                        console.log(replaceAll("MOVE \""+ imageRef.filename + "\" \"" + imageRef.copied[0]+"\"","/","\\"));
                        callbackLoop();
                    } else {
                        async.eachSeries(imageRef.copied, function (destFile, callbackLoop2) {
                            console.log(replaceAll("MD \""+ destFile.substring(0,destFile.lastIndexOf('/'))+"\"","/","\\"));                            
                            console.log(replaceAll("COPY \"" + imageRef.filename + "\" \"" + destFile+"\"","/","\\"));
                            callbackLoop2();
                        }, function () {
                            if (!imageRef.localreference) {
                                console.log(replaceAll("DEL \"" + imageRef.filename+"\"","/","\\"));
                            }
                            callbackLoop();
                        });
                    }
                } else {
                    callbackLoop();
                }
            });
        });
    }
});