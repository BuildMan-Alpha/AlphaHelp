/**
 * Update references on a page to reflect new base path
 */
module.exports = function( filename , basePath , callback ) {
    var fs = require('fs');
	var async = require('async');
    fs.readFile(filename,"utf8",function(err,data) {
        if( err ) {
            callback( { error : err });
        } else {
            var hashObj = {};
            var hashArr = [];
            try {
                hashObj = JSON.parse(data);
            } catch(err) {
                ;
            }
            for( var name in hashObj )  {
                if( hashObj[name][0] == '/' ) {
                    hashArr.push( { name : name , path : hashObj[name] });
                }
            }
            if( hashArr.length > 0 ) {
                var problems = [];
                async.eachSeries( hashArr , function (fo, callbackLoop) {
                    var fname = fo.path;
                    if( fname.substring(0,6) == "/pages" ) {
                        fname = fname.substring(6);
                    }
                    fs.stat( basePath + fname , function(err2,stats) {
                        if( err2 ) {
                            problems.push(fo);
                        }
                        callbackLoop();
                    });
                },function() {
                    if( problems.length > 0 ) {
                        callback( { problems : problems });
                    } else {
                        callback( { success : true } );
                    }
                });
            } else {
                // All external links OR no links.
                callback( { success : true } );
            }
        }
    });
}
