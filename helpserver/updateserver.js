var options = require("./settings");
var Help = require('helpserver');
var help = Help(options);

// First build the table of contents
help.status(function (stats) {
	if (options.search && !stats.indexServiceRunning) {
		console.log('Cannot initialize indexes without '+options.search.provider+' instance running.');
	} else if ( !stats.jsonTreeExists ) {
		console.log('Cannot update without json tree and list files (created by initializeserver.js.');
	} else {
		help.refresh(function (err, result) {
			if (err)
				console.log("Error: " + err);
			else {
				console.log('Help updated');
			}
		});		
	}
});
