/**
 * Import modules.
 */
const {MongoClient} = require('mongodb');

/**
 * Globals.
 */
let instance = {};

/**
 * DB constructor.
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

/**
 * Set configurations.
 *
 * @param config: {{}}
 */
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

/**
 * Get any parameter.
 *
 * @param parameter
 * @returns {*}
 */
DB.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

/**
 * Insert new data into mongodb.
 *
 * @param object: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.insert = function (object, collection, callback) {
  this.query(arguments, insertCallback);
};

/**
 * Insert new data into mongodb, if already exist, update.
 *
 * @param oldObject: {{}}
 * @param structure: {{}}
 * @param newObject: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.save = function (oldObject, structure, newObject, collection, callback) {
  this.query(arguments, saveCallback, false);
};

/**
 * Update data in mongodb.
 *
 * @param oldObject: {{}}
 * @param newObject: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.update = function (oldObject, newObject, collection, callback) {
  this.query(arguments, updateCallback);
};

/**
 * Remove data from mongodb.
 *
 * @param object: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.delete = function (object, collection, callback) {
  this.query(arguments, deleteCallback);
};

/**
 * Get all data from mongodb.
 *
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.findAll = function (collection, callback) {
  this.query(arguments, findAllCallback);
};

/**
 * Get data from mongodb.
 *
 * @param search: {{}}
 * @param structure: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.find = function (search, structure, collection, callback) {
  this.query(arguments, findCallback);
};

/**
 * Open connection for query.
 *
 * @param args: {{}}
 * @param callback: {function}
 * @param close?: {boolean}
 */
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
 * Initialize DB.
 *
 * @param db: {DB}
 */
function init(db) {
  db.connString = null;
}

/**
 * @see DB.insert
 * @param db
 * @param args
 */
function insertCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  db.collection(collection).insertOne(object, function (error, result) {
    callback(error, result);
  });
}

/**
 * @see DB.save
 * @param db
 * @param args
 */
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

/**
 * @see DB.update
 * @param db
 * @param args
 */
function updateCallback(db, args) {
  let oldObject = args[0],
    newObject = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).updateOne(oldObject, newObject, function (error, result) {
    callback(error, result);
  });
}

/**
 * @see DB.delete
 * @param db
 * @param args
 */
function deleteCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  db.collection(collection).deleteOne(object, function (error, result) {
    callback(error, result);
  });
}

/**
 * @see DB.findAll
 * @param db
 * @param args
 */
function findAllCallback(db, args) {
  let collection = args[0],
    callback = args[1];

  db.collection(collection).find({}).toArray(function (error, result) {
    callback(error, result);
  });
}

/**
 * @see DB.find
 * @param db
 * @param args
 */
function findCallback(db, args) {
  let search = args[0],
    structure = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).find(search, structure).toArray(function (error, result) {
    callback(error, result);
  });
}