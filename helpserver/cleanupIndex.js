//var options = require("./settings");
var elasticCleanup = require('./node_modules/helpserver/elasticIndexCleanup.js');
elasticCleanup({ host: 'localhost:9200' , helpserver :'helpserver' },"../helpfiles");
