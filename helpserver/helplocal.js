var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var options = require("./settingslocal");
var Help = require('helpserver');
var help = Help(options);

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/",function (req, res) {
    if( req.path == "/test" ) {
       res.end(JSON.stringify(req.body, null, 2))
    } else {
       help.expressuse(req, res);
    }
});

app.listen(options.port);
console.log('Listening on port '+options.port);