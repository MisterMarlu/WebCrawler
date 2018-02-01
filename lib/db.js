require(`${__dirname}/debugging`);

// Import modules.
const {ObjectId} = require('mongodb'),

  // Import custom modules.
  {Module} = require(`${__dirname}/module`),
  {Output} = require(`${__dirname}/output`),
  {Helper} = require(`${__dirname}/helper`);

let instance = null,
  moduleName = 'DB';

/**
 * Class DB.
 */
class DB extends Module {

  /**
   * DB constructor.
   *
   * @returns {*}
   */
  constructor() {
    super();
    if (instance instanceof DB) return instance;
    if (!(this instanceof DB)) return new DB();

    this.database = null;
    this.ObjectId = ObjectId;
    this.output = new Output();
    instance = this;

    return instance;
  }

  /**
   * Set connection.
   *
   * @param db
   */
  setConnection(db) {
    this.database = db;
  }

  /**
   * Insert new data.
   *
   * @param object: {{}}
   * @param collection: String
   * @param callback?: Function
   */
  insert(object, collection, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.insert - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    object.updated_at = new Date();

    let stream = this.database.collection(collection);

    stream.insertOne(object, (err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  /**
   * Update data.
   *
   * @param filter: {{}}
   * @param update: {{}}
   * @param collection: String
   * @param callback?: Function
   */
  update(filter, update, collection, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.update - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
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

  /**
   * Insert data or update if already exists.
   *
   * @param filter: {{}}
   * @param object: {{}}
   * @param collection: String
   * @param callback?: Function
   */
  save(filter, object, collection, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.save - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
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

  /**
   * Delete data.
   *
   * @param filter: {{}}
   * @param collection: String
   * @param callback?: Function
   */
  delete(filter, collection, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.delete - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let stream = this.database.collection(collection);

    stream.deleteOne(filter, (err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  /**
   * Get all data from collection.
   *
   * @param collection: String
   * @param callback?: Function
   */
  findAll(collection, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.findAll - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let stream = this.database.collection(collection);

    stream.find({}).toArray((err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  /**
   * Get data from collection.
   *
   * @param filter: {{}}
   * @param collection: String
   * @param structure?: {{}}
   * @param callback?: Function
   */
  find(filter, collection, structure = {}, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.find - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let stream = this.database.collection(collection);

    stream.find(filter, structure).toArray((err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }

  /**
   * Get one element from collection.
   *
   * @param filter: {{}}
   * @param collection: String
   * @param structure?: {{}}
   * @param callback?: Function
   */
  findOne(filter, collection, structure = {}, callback = (err, res) => {}) {
    this.output.writeConsole(`${moduleName}.findOne - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let stream = this.database.collection(collection);

    stream.findOne(filter, structure, (err, res) => {
      if (err) throw err;

      callback(err, res);
    });
  }
}

exports.DB = DB;