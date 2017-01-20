var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
client.search({
    index: 'helpserver',
    body: {
      query: {  match :  { "path" : "github"} } ,
      _source: [ "id"]
    }
  }, function (error, response) {
      if( !error ) {
          console.log(JSON.stringify(response.hits.hits));
      }
});