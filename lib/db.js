/**
 * Import modules.
 */
const MongoClient = require('mongodb').MongoClient;

/**
 * Globals.
 */
let instance = {};

/**
 *
 * @returns {*}
 * @constructor
 */
let DB = function () {
  if (!(this instanceof DB)) return new DB();
  if (instance instanceof DB) return instance;

  init(this);

  instance = this;

  return this;
};

DB.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }
};

DB.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

DB.prototype.insert = function (object, collection, callback) {
  this.query(arguments, insertCallback);
};

DB.prototype.save = function (oldObject, structure, newObject, collection, callback) {
  this.query(arguments, saveCallback, false);
};

DB.prototype.update = function (oldObject, newObject, collection, callback) {
  this.query(arguments, updateCallback);
};

DB.prototype.delete = function (object, collection, callback) {
  this.query(arguments, deleteCallback);
};

DB.prototype.findAll = function (collection, callback) {
  this.query(arguments, findAllCallback);
};

DB.prototype.find = function (search, structure, collection, callback) {
  this.query(arguments, findCallback);
};

DB.prototype.query = function (args, callback, close) {
  if (typeof close === 'undefined') close = true;

  MongoClient.connect(this.connString, function (error, db) {
    if (error) throw error;
    callback(db, args);

    if (close) db.close();
  });
};

exports.DB = DB;

/**
 * Set necessary arguments.
 * @param db: {DB}
 */
function init(db) {
  db.connString = null;
}

function insertCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  db.collection(collection).insertOne(object, function (error, result) {
    callback(error, result);
  });
}

function saveCallback(db, args) {
  let oldObject = args[0],
    structure = args[1],
    newObject = args[2],
    collection = args[3],
    callback = args[4];

  db.collection(collection).find(oldObject, structure).toArray(function (error, result) {
    if (error) throw error;

    if (result.length > 0) {
      db.collection(collection).updateOne(oldObject, newObject, function (error, result) {
        callback(error, result);
        db.close();
      });
      return;
    }

    db.collection(collection).insertOne(newObject, function (error, result) {
      callback(error, result);
      db.close();
    });
  });
}

function updateCallback(db, args) {
  let oldObject = args[0],
    newObject = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).updateOne(oldObject, newObject, function (error, result) {
    callback(error, result);
  });
}

function deleteCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  db.collection(collection).deleteOne(object, function (error, result) {
    callback(error, result);
  });
}

function findAllCallback(db, args) {
  let collection = args[0],
    callback = args[1];

  db.collection(collection).find({}).toArray(function (error, result) {
    callback(error, result);
  });
}

function findCallback(db, args) {
  let search = args[0],
    structure = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).find(search, structure).toArray(function (error, result) {
    callback(error, result);
  });
}