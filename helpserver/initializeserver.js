var options = require("./settings");
var Help = require('helpserver');
var help = Help(options);

// First build the table of contents
help.status(function (stats) {
	if (options.search && !stats.indexServiceRunning) {
		console.log('Cannot initialize indexes without '+options.search.provider+' instance running.');
	} else {
		help.generate(function (err, result) {
			if (err)
				console.log("Error: " + err);
			else {
				console.log('Help generated');
				// Then build the index
				help.buildindex(function (err, result) {
					if (err)
						console.log(err);
					else
						console.log('Indexes built ' + JSON.stringify(result, null, " "));
				});
			}
		});
	}
});
