/**
 * Import modules.
 */
const {ObjectId} = require('mongodb');

/**
 * Globals.
 */
let instance = {},
  moduleName = 'DB';

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
 * Parameters.
 */
DB.prototype.ObjectId = ObjectId;

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
 * Set connection.
 *
 * @param db
 */
DB.prototype.setConnection = function (db) {
  this.database = db;
};

/**
 * Insert new data into mongodb.
 *
 * @param object: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.insert = function (object, collection, callback) {
  object.created_at = new Date();
  object.updated_at = object.created_at;

  this.database.collection(collection).insertOne(object, function (error, result) {
    callback(error, result);
  });
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
  newObject.updated_at = new Date();

  this.database.collection(collection).updateOne(oldObject, newObject, function (error, result) {
    callback(error, result);
  });
};

/**
 * Insert new data into mongodb, if already exist, update.
 *
 * @param oldObject: {{}}
 * @param newObject: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.save = function (oldObject, newObject, collection, callback) {
  let self = this;

  self.database.collection(collection).find(oldObject, {_id: false}).toArray(function (error, result) {
    if (error) throw error;

    newObject.updated_at = new Date();

    if (result.length < 1) {
      newObject.created_at = newObject.updated_at;
      self.database.collection(collection).insertOne(newObject, function (error, result) {
        callback(error, result);
      });

      return;
    }

    for (let index in result) {
      let updateObject = {};

      for (let key in result[index]) {
        updateObject[key] = result[index][key];
      }

      for (let key in newObject) {
        if (newObject.hasOwnProperty(key)) {
          updateObject[key] = newObject[key];
        }
      }

      self.database.collection(collection).updateOne(oldObject, updateObject, function (error, result) {
        callback(error, result);
      });
    }
  });
};

/**
 * Remove data from mongodb.
 *
 * @param object: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.delete = function (object, collection, callback) {
  this.database.collection(collection).deleteOne(object, function (error, result) {
    callback(error, result);
  });
};

/**
 * Get all data from mongodb.
 *
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.findAll = function (collection, callback) {
  this.database.collection(collection).find({}).toArray(function (error, result) {
    callback(error, result);
  });
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
  this.database.collection(collection).find(search, structure).toArray(function (error, result) {
    callback(error, result);
  });
};

/**
 * Get data from mongodb.
 *
 * @param search: {{}}
 * @param structure: {{}}
 * @param collection: {string}
 * @param callback: {function}
 */
DB.prototype.findOne = function (search, structure, collection, callback) {
  this.database.collection(collection).findOne(search, structure, function (error, result) {
    callback(error, result);
  });
};

exports.DB = DB;

/**
 * Initialize DB.
 *
 * @param db: {DB}
 */
function init(db) {
  db.database = null;
}