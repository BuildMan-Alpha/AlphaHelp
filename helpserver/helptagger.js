var express = require('express');
var app = express();
var options = require("./settings-tagger");
var fs = require('fs');
var mainPageTemplate = 'No main.html template found';
var searchPageTemplate = 'No search panel found.';
var Help = require('helpserver');
var help = Help(options);

// Pull in resources
fs.readFile(options.templatesLocation+'main_tagger.html','utf8' , function(err,data) {
    if( !err ) {
        mainPageTemplate = data;
    }
});

fs.readFile(options.templatesLocation+'search_panel.html','utf8' , function(err,data) {
    if( !err ) {
        searchPageTemplate = data;
    }
});

app.use("/blank",function(req,res) {
     res.send('&nbsp;');
});

app.use("/main",function(req,res) {
     res.send(mainPageTemplate);
});

app.use("/search_panel",function(req,res) {
     res.send(searchPageTemplate);
});

app.use("/toc",function(req,res) {
    help.gettree(req.path,function(err,data) {
        res.type('html');
        if( err ) {
            res.send('error '+err);   
        } else {
            res.send(data);
        }
    });
});

app.use("/assets/",function(req, res) {
    console.log('request '+req.path+'\n');
    help.get(req.path,function(err,data,type) {
       if( err ) {
           res.send(err);
       } else {
            if( type ) {
                res.type(type);
            }
            res.send(data);           
       }
    });
});

app.use("/help/",function(req, res) {
    console.log('request '+req.path+'\n');
    if( req.path.indexOf("/theme.css") > 0 ) {
        fs.readFile("./themes/default/theme.css",function(err,data) {
           res.type("css");
           res.send(data); 
        });
    } else {
        help.get(req.path,function(err,data,type) {
           if( err ) {
               res.send(err);
           } else {
                if( type ) {
                    res.type(type);
                }
                res.send(data);           
           }
        });
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

app.post("/refresh" ,function(req, res) {
    if( !global.refresh_locked ) {
        global.refresh_locked = true;
        help.refresh( function(err,result ) {
            global.refresh_locked = false;
            res.end("complete");
        });
    } else {
        res.end("busy");
    }
});

app.use("/tag/",function(req, res) {
    if( req.method == 'POST' ) {
        console.log('Set Tag '+req.query.tag)
        help.setmetadata(req.path,JSON.stringify({ tags : req.query.tag }),function(data) {
            console.log('result '+data)
            res.send(JSON.stringify({ result : data }));
        });
    } else  {
        console.log('get tag '+req.path+'\n');
        help.getmetadata(req.path,function(data) {
            res.type('json');
            res.send(data);
            console.log('get tag '+req.path+'returns '+data+'\n');
        })
    }
});

app.listen(options.port);
console.log('Listening on port '+options.port);