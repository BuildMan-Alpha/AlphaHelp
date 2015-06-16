// Reorganize the help system to match the table of contents...
var options = {
  "port": 3002,
  "metadata": true,
  "dependencies": true,
  "assetpath": "/dev/AlphaHelp/helpserver/",
  "source": "/dev/AlphaHelp/helpfiles/",
  "generated": "/dev/AlphaHelp/generated/",
  "templatesLocation": "/dev/AlphaHelp/templates/",
  "ignoreItems": ["images"],
  "search": { "provider": "elasticsearch" },
  "filter_name": "reorg",
  "filter": { "exists": { "field": "metadata" } },
  "editTOC": {
    "move": [
      { "from": "/References/Web", "to": "/Guides/Server/" },
      { "from": "/References/Namespace", "to": "/References/Server/API" },
      { "from": "/References/Functions", "to": "/References/Server/API/Functions" },
      { "from": "/References/Objects", "to": "/References/Server/API/Objects" },
      { "from": "/References/SQL", "to": "/References/Server/SQL" },
      { "from": "/References/Web Application/Functions", "to": "/References/Server/API/Functions/Web Application" },
      { "from": "/References/Web Application", "to": "/References/Server/API/Functions/Web Application" },
      { "from": "/References/Xbasic", "to": "/References/Server/XBasic" },
      { "from": "/References/Operators", "to": "/References/Server/XBasic/Operators" },
      { "from": "/References/Grid", "to": "/Guides/Server/Grid" },
      { "from": "/References/Errors", "to": "/References/Server/Errors" },
      { "from": "/References/Methods/a5", "to": "/References/Client/API/Grid" },
      { "from": "/References/Methods/Helper", "to": "/References/Server/API/Helper" },
      { "from": "/References/Methods/INET", "to": "/References/Server/API/INET" },
      { "from": "/References/Methods/Internet Methods", "to": "/References/Server/API/Internet Methods" },
      { "from": "/References/Methods/QRCODE", "to": "/References/Server/API/QRCODE" },
      { "from": "/References/Methods/Reporting", "to": "/References/Server/API/Reporting" },
      { "from": "/References/Methods/Sockets", "to": "/References/Server/API/Sockets" },
      { "from": "/References/Methods/StringDictionary", "to": "/References/Server/API//StringDictionary" },
      { "from": "/References/Methods/Thread", "to": "/References/Server/API/Objects/Thread" },
      { "from": "/References/Methods/Addin", "to": "/References/Server/API/Objects/Addin" },
      { "from": "/References/Methods/Array", "to": "/References/Server/API/Array" },
      { "from": "/References/Methods/Collection Methods", "to": "/References/Server/API/Collection Methods" },
      { "from": "/References/Methods/Dialog Component Methods", "to": "/References/Client/API/UX Component" },
      { "from": "/References/Methods", "to": "/References/Server/API/Functions" },
      { "from": "References", "to": "Reference" }]
  }
};
var Help = require('helpserver');
var help = Help(options);
var fs = require('fs');

var createWorkList = function () {
  fs.readFile(options.generated + "reorgtree.json", "utf8", function (err, data) {
    if (err) {
      console.log("error:" + err);
    } else {
      var tree = JSON.parse(data);
      var indexBuild = [];
      var imageIndexBuild = [];
      var mapping = {};
      var extimage = {};
      var replaceAll = function (str, find, replace) {
        while (str.indexOf(find) >= 0)
          str = str.replace(find, replace);
        return str;
      };
      var escapes = [
        { to: "__STAR__", from: "*" }
        , { to: "__QUESTION__", from: "?" }
        , { to: "__SLASH__", from: "/" }
        , { to: "__BACKSLASH__", from: "\\" }
        , { to: "__NAMESPACE__", from: "::" }
        , { to: "__COLON__", from: ":" }
        , { to: "__ELLIPSES__", from: "..." }
        , { to: "__HASH__", from: "#" }
        , { to: "__GT__", from: ">" }
        , { to: "__LT__", from: "<" }
        , { to: "__PIPE__", from: "|" }
      ];
      var replaceEscapes = function (text) {
        var i;
        for (i = 0; i < escapes.length; ++i) {
          text = replaceAll(text, escapes[i].from, escapes[i].to);
        }
        return text;
      };
      // Get flat list of renames...
      var buildIndex = function (items, path) {
        var i;
        for (i = 0; i < items.length; ++i) {
          var title = items[i].title || "";
          title = replaceEscapes(title);
          var pathName = path + title;
          if (items[i].children && items[i].children.length > 0) {
            buildIndex(items[i].children, pathName + "/");
          }
          if (items[i].path) {
            var extnPos = items[i].path.lastIndexOf('.');
            if (extnPos > 0) {
              var extn = items[i].path.substring(extnPos);
              if (extn.indexOf('/') < 0) {
                mapping[items[i].path.toLowerCase()] = pathName + extn;
                indexBuild.push({ from: items[i].path, to: pathName + extn });
              }
            }
          }
        }
      };
      buildIndex(tree, '/');
      var async = require('async');
      async.eachSeries(indexBuild, function (ib, callbackLoop) {
        var filename = replaceAll(ib.from, "/", "_");
        var extnPos = filename.lastIndexOf('.');
        if (extnPos > 0) {
          filename = filename.substring(0, extnPos) + ".json";
          fs.readFile("/dev/AlphaHelp/generated/manifest/" + filename, "utf8", function (err, data) {
            if (err) {
              callbackLoop();
            } else {
              var settings = JSON.parse(data);
              var handled = false;
              var i;
              if (settings.dependencies) {
                if (settings.dependencies.images) {
                  var pathTo = ib.to;
                  pathTo = pathTo.substring(0, pathTo.lastIndexOf('/')) + '/';                  
                  var relativeImage = ib.from.substring(0, ib.from.lastIndexOf('/')) + "/images/";
                  relativeImage = relativeImage.toLowerCase();
                  for (i = 0; i < settings.dependencies.images.length; ++i) {
                    var imgfilename = settings.dependencies.images[i];
                    if( imgfilename ) {
                      if ( imgfilename.substring(0, relativeImage.length).toLowerCase() == relativeImage) {
                        var imageKey = imgfilename.toLowerCase() + '>' + pathTo.toLowerCase();
                        if (!extimage[imageKey]) {
                          var imageObj = { from: imgfilename, to: pathTo + "images/" + imgfilename.substring(relativeImage.length) };
                          imageIndexBuild.push(imageObj);
                          extimage[imageKey] = true;
                        }
                      } else {
                        console.log('no match '+imgfilename+" for "+relativeImage);
                      }
                    }
                  }
                }
                if (settings.dependencies.href) {
                  var reorg = { name: ib.to, href: [] };
                  for (i = 0; i < settings.dependencies.href.length; ++i) {
                    var toName = mapping[settings.dependencies.href[i].toLowerCase()];
                    if (toName) {
                      reorg.href.push({ from: settings.dependencies.href[i], to: toName });
                    }
                  }
                  if (reorg.href.length > 0) {
                    handled = true;
                    fs.writeFile("/dev/AlphaHelp/generated/fixup/" + filename, JSON.stringify(reorg, null, "  "), function (err) {
                      callbackLoop();
                    });
                  }
                }
              }
              if (!handled) {
                callbackLoop();
              }
            }
          });
        } else {
          callbackLoop();
        }
      }, function () {
          if (imageIndexBuild.length > 0 )
            indexBuild = indexBuild.concat(imageIndexBuild);
          fs.writeFile("/dev/AlphaHelp/generated/reorg.json",JSON.stringify(indexBuild, null, "  "),function() {
              console.log("Reorginization files generated...");
          });
        });
    }
  });
};

// Build the toc
help.status(function (stats) {
	if (options.search && !stats.indexServiceRunning) {
		console.log('Cannot initialize indexes without '+options.search.provider+' instance running.');
	} else if ( !stats.jsonTreeExists ) {
		console.log('Cannot update without json tree and list files (created by initializeserver.js.');
	} else {
		help.refresh(function (err, result) {
			if (err)
				console.log("Error: " + err);
			else {
        // Now lets create the work list (move to/from + change the links) ...
				console.log('Help updated, creating the reorg.json file');
        createWorkList();
			}
		});		
	}
});
