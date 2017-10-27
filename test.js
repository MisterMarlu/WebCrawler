const config = require('./lib/config.json').database,
  MongoClient = require('mongodb').MongoClient;

MongoClient.connect(config.url, function (error, db) {
  if (error) throw error;

  let obj = {
    filePath: 'www.sexystuttgart.de.png',
    found_urls_id: 1,
    updated: new Date()
  };

  db.collection('screenshots').insertOne(obj, function (error, result) {
    if (error) {
      console.log(error);
      throw error;
    }

    console.log('inserted');
    console.log(result);
    db.close();
  });
});