require(`${__dirname}/debugging`);

// Import modules.
const {ObjectId} = require('mongodb'),

  // Import custom modules.
  BaseModule = require(`${__dirname}/BaseModule`),
  Output = require(`${__dirname}/Output`),
  Helper = require(`${__dirname}/Helper`);

let instance = null;

/**
 * This class executes all database operations with a MongoDB database.
 *
 * @extends BaseModule
 * @returns {MongoDB} Returns the MongoDB instance.
 */
class MongoDB extends BaseModule {

  /**
   * @see MongoDB.
   */
  constructor() {
    // Constructor of the super class.
    super();

    // The class MongoDB is a singleton class.
    if (instance instanceof MongoDB) return instance;
    if (!(this instanceof MongoDB)) return new MongoDB();

    this.database = null;
    this.ObjectId = ObjectId;
    this.output = new Output();

    instance = this;
    return instance;
  }

  /**
   * Set connection.
   *
   * @param {db} db The connection of the database, set by the MongoClient.
   */
  setConnection(db) {
    // Debugging line.
    Helper.printDebugLine(this.setConnection, __filename, __line);

    this.database = db;
  }

  /**
   * Insert new data.
   *
   * @async
   * @param {object} insert The object that should be inserted.
   * @param {string} collection The name of the collection.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  insert(insert, collection) {
    // Debugging line.
    Helper.printDebugLine(this.insert, __filename, __line);

    // Add the time when this object was updated.
    insert.updated_at = new Date();

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      stream.insertOne(insert, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Update data.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {object} update The object that should be updated.
   * @param {string} collection The name of the collection.
   * @param {string} [operator==] The operator to get an equal method like in the class MySQL.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  update(filter, update, collection, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.update, __filename, __line);

    // Add the time when this object was updated.
    update.updated_at = new Date();

    // Get the stream to the collection.
    let stream = this.database.collection(collection),
      options = {
        upsert: true,
      };

    return new Promise((resolve, reject) => {
      stream.updateOne(filter, {$set: update}, options, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Insert data or update if already exists.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {object} object The object that should be inserted or updated.
   * @param {string} collection The name of the collection.
   * @param {string} [operator==] The operator to get an equal method like in the class MySQL.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  save(filter, object, collection, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.save, __filename, __line);

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      // Try to find the object in the collection.
      stream.find(filter).toArray((error, result) => {
        if (error) {
          reject(error);
          return;
        }

        // Add the time when this object was updated.
        object.updated_at = new Date();

        // If there is no given object insert, else update.
        if (result.length < 1 && typeof object._id === 'undefined') {
          stream.insertOne(object, (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          });
        } else {
          stream.updateOne(filter, object, (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          });
        }
      });
    });
  }

  /**
   * Delete data.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} collection The name of the collection.
   * @param {string} [operator==] The operator to get an equal method like in the class MySQL.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  delete(filter, collection, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.delete, __filename, __line);

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      stream.deleteOne(filter, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Get all data from collection.
   *
   * @async
   * @param {string} collection The name of the collection.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findAll(collection) {
    // Debugging line.
    Helper.printDebugLine(this.findAll, __filename, __line);

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      stream.find({}).toArray((error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Get data from collection.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} collection The name of the collection.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @param {string} [operator==] The operator to get an equal method like in the class MySQL.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  find(filter, collection, structure = {}, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.find, __filename, __line);

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      stream.find(filter, structure).toArray((error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }

  /**
   * Get one element from collection.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} collection The name of the collection.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @param {string} [operator==] The operator to get an equal method like in the class MySQL.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findOne(filter, collection, structure = {}, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.findOne, __filename, __line);

    // Get the stream to the collection.
    let stream = this.database.collection(collection);

    return new Promise((resolve, reject) => {
      stream.findOne(filter, structure, (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      });
    });
  }
}

module.exports = MongoDB;