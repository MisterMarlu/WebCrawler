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

DB.prototype.insert = async function (object, collection, callback) {
  await this.query(arguments, insertCallback);
};

DB.prototype.update = async function (oldObject, newObject, collection, callback) {
  await this.query(arguments, updateCallback);
};

DB.prototype.delete = async function (object, collection, callback) {
  await this.query(arguments, deleteCallback);
};

DB.prototype.findAll = async function (collection, callback) {
  await this.query(arguments, findAllCallback);
};

DB.prototype.query = async function (args, callback) {
  await MongoClient.connect(this.connString, async function (error, db) {
    if (error) throw error;
    await callback(db, args);
    db.close();
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

async function insertCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  await db.collection(collection).insertOne(object, async function (error, result) {
    await callback(error, result);
  });
}

async function updateCallback(db, args) {
  let oldObject = args[0],
    newObject = args[1],
    collection = args[2],
    callback = args[3];

  await db.collection(collection).updateOne(oldObject, newObject, async function (error, result) {
    await callback(error, result);
  });
}

async function deleteCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  await db.collection(collection).deleteOne(object, async function (error, result) {
    await callback(error, result);
  });
}

async function findAllCallback(db, args) {
  let collection = args[0],
    callback = args[1];

  await db.collection(collection).find({}).toArray(async function (error, result) {
    await callback(error, result);
  });
}