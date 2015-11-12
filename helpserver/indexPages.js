var pattern = process.argv[2];
var fs = require("fs");
if( pattern ) {
	pattern = pattern.toLowerCase();
	fs.readFile("../generated/plaintext/filelist.json",function(err,data) {
		if( err ) {
			console.log("Error :- "+err);
		} else {
			var list = JSON.parse(data);
			var changed = false;
			for(var fileSig in list ) {
				if( fileSig.toLowerCase().indexOf(pattern) >= 0 ) {
					console.log("Marked "+fileSig);
					list[fileSig] = "";
					changed = true;
				}
			}
			if( changed ) {
				fs.writeFile("../generated/plaintext/filelist.json", JSON.stringify(list) , function(err) {
					if( err ) {
						console.log("Error :- "+err);
					} else {
						console.log("Changes to filelist committed - affected pages with be reindexed on the next refresh...");
					}					
				});
			} else {
				console.log('Nothing was changed...');
			}
		}
	});
} else {
   console.log("usage :- node indexPages \"contains\" ");	
}