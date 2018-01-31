const {ObjectId} = require('mongodb'),
  {Module} = require(`${__dirname}/module`);

let instance = null,
  moduleName = 'DB';

class DB extends Module {
  constructor() {
    super();
    if (instance instanceof DB) return instance;
    if (!(this instanceof DB)) return new DB();

    this.database = null;
    this.ObjectId = ObjectId;
    instance = this;

    return this;
  }

  setConnection(db) {
    this.database = db;
  }

  insert(object, collection, callback = (err, res) => {}) {
    object.updated_at = new Date();

    let stream = this.database.collection(collection);

    stream.insertOne(object, (err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  update(filter, update, collection, callback = (err, res) => {}) {
    update.updated_at = new Date();

    let stream = this.database.collection(collection),
      options = {
        upsert: true,
      };

    stream.updateOne(filter, {$set: update}, options, (err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  save(filter, object, collection, callback = (err, res) => {}) {
    let stream = this.database.collection(collection);

    stream.find(filter).toArray((err, res) => {
      if (err) throw err;

      object.updated_at = new Date();

      if (res.length < 1) {
        this.insert(object, collection, callback);
      } else {
        this.update(filter, object, collection, callback);
      }
    });
  }
}

exports.DB = DB;