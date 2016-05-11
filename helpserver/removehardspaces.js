var fs = require('fs');
if( process.argv.length < 3  ) {
    console.log("node removehardspaces <file> - look for hard spaces in file, replace if found ")
    process.exit(0)
}
var fileName = process.argv[2];

fs.readFile(fileName, "utf8", function (err, data) {
    if( err ) {
        console.log("Could not load file '"+fileName+"' - error :"+err);
    } else {
        var problems = "";
        var i , j;
        for( i = 0 ; i < data.length ; ++i ) {
            if( data.charCodeAt(i) < 32 ) {
                var chr = data.substr(i,1);
                if( chr != "\n" && chr != "\r" && chr != "\t" ) {
                    if( problems.indexOf(chr) < 0 ) {
                        problems += chr;
                        console.log("found character ["+data.charCodeAt(i)+"]");
                    }   
                }
            }
        }
        if( problems.length > 0 ) {
            for( i = 0 ; i < problems.length ; ++i ) {
                data = data.split(problems.substr(i,1)).join(" ");
            }
            fs.writeFile(fileName,data);
            console.log("hard spaces fixed");
        } else {            
            console.log("nod hard spaces found");
        }
    }
});




