var express = require('express');
var app = express();
var options = require("./settings");
var fs = require('fs');
var mainPageTemplate = 'No main.html template found';
var searchPageTemplate = 'No search panel found.';
var Help = require('helpserver');
var help = Help(options);
// Pull in resources
fs.readFile(options.templatesLocation+'main.html','utf8' , function(err,data) {
    if( !err ) {
        mainPageTemplate = data;
    }
});

fs.readFile(options.templatesLocation+'search_panel.html','utf8' , function(err,data) {
    if( !err ) {
        searchPageTemplate = data;
    }
});

var mainPage = function(page) {
    if( mainPageTemplate ) {
        var content = mainPageTemplate;
        while( content.indexOf("__page__") > 0 )
            content = content.replace("__page__",page);
        return content;
    }
    return page;
}
app.use("/main",function(req,res) {
     res.send(mainPage(""));
});
app.use("/search_panel",function(req,res) {
     res.send(searchPageTemplate);
});

app.use("/toc",function(req,res) {
    fs.readFile(options.generated+'/tree.html','utf8' , function(err,data) {
        if( err ) {
            res.send('error '+err);   
        } else {
            res.send(data);
        }
    });
});
app.use("/help/",function(req, res) {
    console.log('request'+req.path+'\n');
    var extension = null;
    var extensionPos = req.path.lastIndexOf('.');
    if( extensionPos > 0)
        extension = req.path.substring(extensionPos+1).toLowerCase();
    if( !extension ) {
        // Table of contents...        
        res.send('TBD - toc with no topic page'+req.path);
        console.log('no extension provided\n');
    } else if( extension == "html" || extension == "htm" ) {
        if( req.query.view && req.query.view == 'main' ) {
            res.type('html');
            res.send(mainPage(req.path));
        } else {
            fs.readFile(options.source+unescape(req.path.substring(1)),"utf8" , function(err,data) {
                if( err ) {
                    console.log('error '+err);
                    res.send('error '+err);   
                } else {
                    res.type('html');
                    res.send(data);
                }
            });
        }
    } else if( extension == "css" ) {
        fs.readFile(options.source+unescape(req.path.substring(1)),"utf8" , function(err,data) {
            if( err ) {
                console.log('error '+err);
                res.send('error '+err);   
            } else {
                res.type('css');
                res.send(data);
            }
        });
    } else {        
        fs.readFile(options.source+unescape(req.path.substring(1)),function(err,data) {
            if( err ) {
                console.log('error '+err);
                res.type(extension);
                res.send('error '+err);
            } else {
                res.send(data);
            }
        }
        );
    } 
});

app.use("/search?" ,function(req, res) {
    help.search(req.query.pattern,function(err,data) {
        if( err ) {
            res.send(JSON.stringify([ { 'error' : err } ]));
        } else {
            res.send(JSON.stringify(data));
        }  
    })     
});

app.listen(options.port);
console.log('Listening on port '+options.port);