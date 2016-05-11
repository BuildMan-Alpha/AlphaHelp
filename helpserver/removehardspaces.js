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
        var  findHardSpace = data.split(3);
        if( findHardSpace.length == 1 ) {
            findHardSpace = data.split(160);
        }
        if( findHardSpace.length > 1 ) {
            console.log("Found "+(findHardSpace.length-1)+" hard spaces");
            data = findHardSpace.join(" ");
            fs.writeFile(fileName,data);
        } else {
            console.log("No hard spaces were found.")
        }
    }
});




