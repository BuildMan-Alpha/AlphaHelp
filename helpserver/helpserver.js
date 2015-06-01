var express = require('express');
var app = express();
var options = require("./settings");
var Help = require('helpserver');
var help = Help(options);

app.use("/",function (req, res) {
    if( !req.path ||  req.path == '/')
        req.path = "/web/main";
    help.expressuse(req, res);
});

app.listen(options.port);
console.log('Listening on port '+options.port);