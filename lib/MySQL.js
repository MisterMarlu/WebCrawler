require(`${__dirname}/debugging`);

// Import custom modules.
const {BaseModule} = require(`${__dirname}/BaseModule`),
  {Output} = require(`${__dirname}/Output`),
  {Parser} = require(`${__dirname}/Parser`),
  {Helper} = require(`${__dirname}/Helper`);

let instance = null,
  moduleName = Parser.getModuleName(__filename);

/**
 * This class executes all database operations.
 *
 * @extends BaseModule
 * @returns {MySQL} Returns the MySQL instance.
 */
class MySQL extends BaseModule {

  /**
   * @see MySQL.
   */
  constructor() {
    // Constructor of the super class.
    super();

    // The class MySQL is a singleton class.
    if (instance instanceof MySQL) return instance;
    if (!(this instanceof MySQL)) return new MySQL();

    this.database = null;
    this.output = new Output();

    instance = this;
    return instance;
  }

  /**
   * Set connection.
   *
   * @param {connection} connection The connection of the database, set by the MySQL.
   */
  setConnection(connection) {
    this.database = connection;
  }

  /**
   * Insert new data.
   *
   * @param {object} insert The object that should be inserted.
   * @param {string} table The name of the table.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  insert(insert, table) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.insert - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Add the time when this object was updated.
    insert.updated_at = new Date();

    // Parse values and create query string.
    let values = MySQL.parseValues(Object.values(insert)),
      sql = `INSERT INTO ${table} (${Object.keys(insert).join(', ')}) VALUES (${values.join(', ')})`;

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
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
   * @param {object} filter The filter to get the correct object.
   * @param {object} update The object that should be updated.
   * @param {string} table The name of the table.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  update(filter, update, table) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.update - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Add the time when this object was updated.
    update.updated_at = new Date();

    // Parse values and create query string.
    let values = MySQL.parseColumnValue(update),
      whereCondition = MySQL.parseColumnValue(filter),
      sql = `UPDATE ${table} SET ${values.join(', ')}${(filter.length < 1) ? '' : ` WHERE ${whereCondition.join(', ')}`}`;

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
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
   * @param {object} filter The filter to get the correct object.
   * @param {object} object The object that should be inserted or updated.
   * @param {string} collection The name of the collection.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  save(filter, object, collection) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.save - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

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
          // Debugging line.
          this.output.writeConsole(`${moduleName}.save - New one, inserted`, Helper.isDebug(moduleName), 'debug');

          stream.insertOne(object, (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          });
        } else {
          // Debugging line.
          this.output.writeConsole(`${moduleName}.save - Given, updated`, Helper.isDebug(moduleName), 'debug');

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
   * @param {object} filter The filter to get the correct object.
   * @param {string} collection The name of the collection.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  delete(filter, collection) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.delete - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

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
   * @param {string} collection The name of the collection.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findAll(collection) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.findAll - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

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
   * @param {object} filter The filter to get the correct object.
   * @param {string} table The name of the table.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  find(filter, table, structure = {}) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.find - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

    // Parse values and create query string.
    let whereCondition = MySQL.parseColumnValue(filter),
      rows = MySQL.parseStructure(structure),
      sql = `SELECT ${rows.join(', ')} FROM ${table}${(filter.length < 1) ? '' : ` WHERE ${whereCondition.join(', ')}`}`;

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
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
   * @param {object} filter The filter to get the correct object.
   * @param {string} collection The name of the collection.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findOne(filter, collection, structure = {}) {
    // Debugging line.
    this.output.writeConsole(`${moduleName}.findOne - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');

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

  /**
   * Parse all values to correct notation for the MySQL query.
   *
   * @param {array} values An array of values.
   * @returns {array} The parsed values as array for the MySQL query.
   */
  static parseValues(values) {
    let parsedValues = [];

    for (let i = 0; i < values.length; i += 1) {
      parsedValues[i] = MySQL.parseValue(values[i]);
    }

    return parsedValues;
  }

  static parseValue(value) {
    if (typeof value === 'string') return `'${value}'`;

    return value;
  }

  static parseColumnValue(object) {
    let columnValues = [];

    for (let column in object) {
      if (!object.hasOwnProperty(column)) continue;
      columnValues.push(`${column} = ${MySQL.parseValue(object[column])}`);
    }

    return columnValues;
  }

  static parseStructure(structure) {
    let parsedStructure = [];

    for (let row in structure) {
      if (!structure.hasOwnProperty(row)) continue;
      if (!structure[row]) continue;
      parsedStructure.push(row);
    }

    if (parsedStructure.length === 0) {
      parsedStructure.push('*');
    }

    return parsedStructure;
  }
}

exports.MySQL = MySQL;