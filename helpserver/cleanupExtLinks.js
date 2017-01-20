var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
client.search({
  index: 'helpserver',
  body: {
    query: { match: { "path": "https" } },
    _source: ["id"]
  }
}, function (error, response) {
  if (!error) {
    var i;
    for (i = 0; i < response.hits.hits.length; ++i) {
      (function () {
        var id = response.hits.hits[i]._id;
        if (id.indexOf(":https://github.com") > 0) {
          client.delete({
            index: 'helpserver',
            type: 'helppage',
            id: id,
          }, function (error, response) { if (error) { console.log(error); } else { console.log("removed "+id);}  });
        }
      } ());
    }
  }
});