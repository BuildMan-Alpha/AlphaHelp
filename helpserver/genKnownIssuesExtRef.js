var http = require('https');
var htmlparser = require("htmlparser2");
var stringJs = require('string');
var htmlToPlainText = function(html) {
    var plainText = "";
    var parser = new htmlparser.Parser({
        onopentag: function (name, attribs) {
        },
        ontext: function (text) {
            plainText += stringJs(text).decodeHTMLEntities().s;
        },
        onclosetag: function (name) {
        }
    });        
    parser.write(html);
    parser.end();
    return plainText;
}


var options = {
    host: "api.github.com",
    path: "/repos/AlphaSoftware/AlphaAnywhere/issues?state=open&sort=created&direction=asc",
    method: 'GET',
    headers: {'User-Agent': 'request','Accept':'application/vnd.github.html+json'}
};

callback = function(response) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        var jsonObj = JSON.parse(str);
        var refs = [];

        for (var i = 0; i < jsonObj.length; i++) {
            var jsEntry = jsonObj[i];
            var description = "";
            description = htmlToPlainText(jsEntry.body_html);
            refs.push({ title : jsEntry.title , description : description , href : jsEntry.html_url });
        }
        console.log(JSON.stringify(refs,null,"  "));
    });
};
http.request(options,callback).end();
