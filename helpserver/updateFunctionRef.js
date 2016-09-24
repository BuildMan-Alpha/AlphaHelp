var fs = require("fs");
var zlib = require('zlib');
fs.readFile("../generated/list.json","utf8",function(err,data) {    
    if( !err ) {
        var funcArray = [];
        var filearr = JSON.parse(data);
        var i;
        for( i = 0 ; i < filearr.length ; ++i ) {
            var ptr = filearr[i];
            if( ptr.path.indexOf('/AlphaHelp/helpfiles/Ref') > 0 ) {
                var nocasepath =  ptr.path.toLowerCase();
                if( ptr.path.indexOf("/Desktop_Api/") > 0 || ptr.path.indexOf("/Api/") > 0 ) {
                    if( nocasepath.indexOf(" function.xml") > 0 || nocasepath.indexOf(" method.xml") > 0 ) {
                        var functionName = ptr.path.substring(ptr.path.lastIndexOf("/")+1);
                        //var url = "/documentation/page/"+ptr.path.substr( ptr.path.indexOf('/AlphaHelp/helpfiles/')+21 );
                        functionName = functionName.substring( 0 , functionName.lastIndexOf(' ') );
                        funcArray.push(functionName);
                    }
                }
            }
        }
        funcArray.sort();
        fs.writeFile("../helpfiles/functionList.json" , JSON.stringify(funcArray) );
    }
});
