// Walk the entire docsdev site
/**
 * Build the generated files for the help system.
 */
var urls = [];
var testPath = function(po) {
    urls.push("/documentation/pages"+po.path);
};

var walkAll = function (folder, callback) {
    var flatList = [];
    var nameReplacements =  [
                { from: ".html", to: "" }
                , { from: ".md", to: "" }
                , { from: ".xml", to: "" }
                , { from: "__STAR__", to: "*" }
                , { from: "__QUESTION__", to: "?" }
                , { from: "__SLASH__", to: "/" }
                , { from: "__BACKSLASH__", to: "\\" }
                , { from: "__NAMESPACE__", to: "::" }
                , { from: "__COLON__", to: ":" }
                , { from: "__ELLIPSES__", to: "..." }
                , { from: "__HASH__", to: "#" }
                , { from: "__GT__", to: ">" }
                , { from: "__LT__", to: "<" }
                , { from: "__PIPE__", to: "|" }
            ];
    var replaceAll = function (str, find, replace) {
        while (str.indexOf(find) >= 0)
            str = str.replace(find, replace);
        return str;
    };

    var fs = require('fs');
    var path = require('path');
    var cleanupFileName = function (name) {
        name = replaceAll(name, "\\", "/");
        var start = name.indexOf(folder);
        if (start >= 0) {
            name = "/" + name.substr(start + folder.length);
        }
        return name;
    };
    var cleanupName = function (name) {
        var i;
        for (i = 0; i < nameReplacements.length; ++i) {
            if (name.indexOf(nameReplacements[i].from) >= 0) {
                name = replaceAll(name, nameReplacements[i].from, nameReplacements[i].to);
            }
        }
        return name;
    };
    var walk = function (folder, done) {
        var results = [];
        var names = [];
        fs.readdir(folder, function (err, list) {
            if (err) {
                done(err);
                return;
            }
            var pending = list.length;
            if (!pending) return done(null, results);
            list.forEach(function (file) {
                var html = file;
                var cleanName;
                var duplicateEntry;
                var pagePath;
                file = path.resolve(folder, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        (function () {
                            var folderEntry;
                            cleanName = cleanupName(html);
                            duplicateEntry = names.indexOf(cleanName);
                            if (duplicateEntry < 0) {
                                folderEntry = { html: cleanName, children: [] }
                                results.push(folderEntry);
                                names.push(cleanName);
                            } else {
                                folderEntry = results[duplicateEntry];
                                folderEntry.children = [];
                            }
                            walk(file, function (err, res) {
                                folderEntry.children = res;
                                if (!--pending) done(null, results);
                            });
                        }());
                    } else {
                        var extensionPos = file.lastIndexOf('.');
                        if (extensionPos > 0) {
                            var extensionName = file.substring(extensionPos).toLowerCase();
                            if (extensionName == ".html" || extensionName == ".md" || extensionName == ".xml") {
                                cleanName = cleanupName(html);
                                duplicateEntry = names.indexOf(cleanName);
                                pagePath = cleanupFileName(file);
                                if (duplicateEntry < 0) {
                                    results.push({ html: cleanName, path: pagePath });
                                    names.push(cleanName);
                                } else {
                                    results[duplicateEntry].path = pagePath;
                                }                                
                                testPath({ title: cleanName, file: file, path: pagePath });
                            }
                        }
                        if (!--pending) done(null, results);
                    }
                });
            });
        });
    };

    walk(folder, function (err, results) {
        if (err) {
            callback(err, null);
            return;
        } else {
            callback(null, true);
        }
    });
}

walkAll("c:/dev/AlphaHelp/helpfiles/",function(err) {
    if( err ) {
        console.log("Ran into error :"+err);
    } else {
        console.log("Starting the test access "+urls.length+" Pages");
        var index = 0;
        var cleanup = function(path) {
            return path.split(" ").join("%20");                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
        };
        var http = require('http');
        var callback = function(response) {
            var len = 0;
            response.on('data', function (chunk) {
                len += chunk.length;
            });
            response.on('end', function () {
                console.log( "returned "+ len+" bytes");
                nextRequest();
            });
        };
        var nextRequest = function() {
            var options = { host: 'docsdev.alphasoftware.com', path: cleanup(urls[index]) };
            console.log( "http:/docsdev.alphasoftware.com"+ urls[index]);
            ++index;
            var req = http.request(options, callback);
            req.end();
        }
        // First one...
        nextRequest();
    }
})