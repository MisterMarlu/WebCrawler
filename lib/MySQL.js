require(`${__dirname}/debugging`);

// Import custom modules.
const BaseModule = require(`${__dirname}/BaseModule`),
  Output = require(`${__dirname}/Output`),
  Helper = require(`${__dirname}/Helper`);

let instance = null;

/**
 * This class executes all database operations with a MySQL database.
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
    // Debugging line.
    Helper.printDebugLine(this.setConnection, __filename, __line);

    this.database = connection;
  }

  /**
   * Insert new data.
   *
   * @async
   * @param {object} insert The object that should be inserted.
   * @param {string} table The name of the table.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  insert(insert, table) {
    // Debugging line.
    Helper.printDebugLine(this.insert, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    // Add the time when this object was updated.
    insert.created_at = Helper.getSqlTimestamp();
    insert.updated_at = Helper.getSqlTimestamp();
    Helper.debug(__filename, 'insert object');
    Helper.debug(__filename, insert);

    // Parse values and create query string.
    let values = MySQL.parseValues(Object.values(insert)),
      sql = `INSERT INTO ${table} (${Object.keys(insert).join(', ')}) VALUES (${values.join(', ')})`;
    Helper.debug(__filename, 'values');
    Helper.debug(__filename, values);
    Helper.debug(__filename, `sql: ${sql}`);

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
        if (error) {
          Helper.debug(__filename, 'Error on inserting', 3);
          Helper.debug(__filename, error);
          reject(error);
          return;
        }

        Helper.debug(__filename, 'Successfully inserted', 3);
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
   * @param {string} table The name of the table.
   * @param {string} [operator==] The operator for the where clause.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  update(filter, update, table, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.update, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    // Add the time when this object was updated.
    update.updated_at = Helper.getSqlTimestamp();
    if (typeof update.created_at !== 'undefined') delete update.created_at;
    if (typeof update.id !== 'undefined') delete update.id;
    Helper.debug(__filename, 'update object');
    Helper.debug(__filename, update);

    // Parse values and create query string.
    let values = MySQL.parseColumnValue(update, operator),
      whereCondition = MySQL.parseColumnValue(filter, operator),
      sql = `UPDATE ${table} SET ${values.join(', ')}${(whereCondition.length < 1) ? '' : ` WHERE ${whereCondition.join(' AND ')}`}`;
    Helper.debug(__filename, 'values');
    Helper.debug(__filename, values);
    Helper.debug(__filename, 'whereCondition');
    Helper.debug(__filename, whereCondition);
    Helper.debug(__filename, `sql: ${sql}`);

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
        if (error) {
          Helper.debug(__filename, 'Error on updating', 3);
          Helper.debug(__filename, error);
          reject(error);
          return;
        }

        Helper.debug(__filename, 'Successfully updated', 3);
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
   * @param {string} table The name of the table.
   * @param {string} [operator==] The operator for the where clause.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  save(filter, object, table, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.save, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    if (typeof object.created_at !== 'undefined') delete object.created_at;
    Helper.debug(__filename, 'insert or update object');
    Helper.debug(__filename, object);

    return new Promise((resolve, reject) => {
      Helper.debug(__filename, 'Try to find the object in the table', 2);
      this.find(filter, table).then(findResult => {
        // If there is no given data insert, else update.
        if (findResult.length < 1 && typeof object.id === 'undefined') {
          Helper.debug(__filename, 'This is a new object, inserting', 2);
          this.insert(object, table).then(result => {
            resolve(result);
          }).catch(error => {
            reject(error);
          });
        } else {
          Helper.debug(__filename, 'This object already exists, updating', 2);
          this.update(filter, object, table, operator).then(result => {
            result.updatedId = findResult[0].id;
            resolve(result);
          }).catch(error => {
            reject(error);
          });
        }
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Delete data.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} table The name of the table.
   * @param {string} [operator==] The operator for the where clause.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  delete(filter, table, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.delete, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    // Parse where clauses and create query string.
    let whereCondition = MySQL.parseColumnValue(filter, operator),
      sql = `DELETE FROM ${table}${(whereCondition.length < 1) ? '' : ` WHERE ${whereCondition.join(' AND ')}`}`;
    Helper.debug(__filename, 'whereCondition');
    Helper.debug(__filename, whereCondition);
    Helper.debug(__filename, `sql: ${sql}`);

    return new Promise((resolve, reject) => {
        this.database.query(sql, (error, result) => {
          if (error) {
            Helper.debug(__filename, 'Error on deleting', 3);
            Helper.debug(__filename, error);
            reject(error);
            return;
          }

          Helper.debug(__filename, 'Successfully deleted', 3);
          resolve(result);
        });
    });
  }

  /**
   * Get all data from table.
   *
   * @async
   * @param {string} table The name of the table.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findAll(table) {
    // Debugging line.
    Helper.printDebugLine(this.findAll, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    return new Promise((resolve, reject) => {
      this.find({}, table).then(result => {
        resolve(result);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Get data from table.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} table The name of the table.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @param {string} [operator==] The operator for the where clause.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  find(filter, table, structure = {}, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.find, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    // Parse values and create query string.
    let whereCondition = MySQL.parseColumnValue(filter, operator),
      rows = MySQL.parseStructure(structure),
      sql = `SELECT ${rows.join(', ')} FROM ${table}`;
    Helper.debug(__filename, 'whereCondition');
    Helper.debug(__filename, whereCondition);
    Helper.debug(__filename, 'rows');
    Helper.debug(__filename, rows);

    if (typeof whereCondition[0] === 'object') {
      rows[0] = `${table}.${rows[0]}`;
      sql = `SELECT ${rows.join(`, ${table}.`)} FROM ${table}`;

      let cond = whereCondition[0],
        join = ` JOIN ${cond.column} ON ${table}.id = ${cond.column}.${table.substring(0, table.length - 1)}_id`;
      join += ` WHERE ${cond.column}.${cond.innerCol} = ${cond.innerVal}`;
      sql += join;
    } else {
      sql += `${(whereCondition.length < 1) ? '' : ` WHERE ${whereCondition.join(' AND ')}`}`;
    }

    Helper.debug(__filename, `sql: ${sql}`);

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
        if (error) {
          Helper.debug(__filename, 'Error on finding object', 3);
          Helper.debug(__filename, error);
          reject(error);
          return;
        }

        Helper.debug(__filename, 'Successfully found object', 3);
        resolve(result);
      });
    });
  }

  /**
   * Get one element from table.
   *
   * @async
   * @param {object} filter The filter to get the correct object.
   * @param {string} table The name of the table.
   * @param {object} [structure={}] The structure in that the objects should be returned.
   * @param {string} [operator==] The operator for the where clause.
   * @returns {Promise} Returns a Promise object with the result of the database.
   */
  findOne(filter, table, structure = {}, operator = '=') {
    // Debugging line.
    Helper.printDebugLine(this.findOne, __filename, __line);
    Helper.debug(__filename, `table: ${table}`);

    // Parse values and create query string.
    let whereCondition = MySQL.parseColumnValue(filter, operator),
      rows = MySQL.parseStructure(structure),
      sql = `SELECT ${rows.join(', ')} FROM ${table}`;
    Helper.debug(__filename, 'whereCondition');
    Helper.debug(__filename, whereCondition);
    Helper.debug(__filename, 'rows');
    Helper.debug(__filename, rows);

    if (typeof whereCondition[0] === 'object') {
      rows[0] = `${table}.${rows[0]}`;
      sql = `SELECT ${rows.join(`, ${table}.`)} FROM ${table}`;

      let cond = whereCondition[0],
        join = ` JOIN ${cond.column} ON ${table}.${cond.column}_id = ${cond.column}.id`;
      join += ` WHERE ${cond.column}.${cond.innerCol} = ${cond.innerVal}`;
      sql += join;
    } else {
      sql += `${(whereCondition.length < 1) ? '' : ` WHERE ${whereCondition.join(' AND ')}`}`;
    }

    sql += ' LIMIT 1';
    Helper.debug(__filename, `sql: ${sql}`);

    return new Promise((resolve, reject) => {
      this.database.query(sql, (error, result) => {
        if (error) {
          Helper.debug(__filename, 'Error on finding object', 3);
          Helper.debug(__filename, error);
          reject(error);
          return;
        }

        Helper.debug(__filename, 'Successfully found object', 3);

        if (result.length > 0) {
          resolve(result[0]);
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
    // Debugging line.
    Helper.printDebugLine(MySQL.parseValues, __filename, __line);

    let parsedValues = [];

    for (let i = 0; i < values.length; i += 1) {
      parsedValues[i] = MySQL.parseValue(values[i]);
    }

    return parsedValues;
  }

  /**
   * Parse the value to correct notation for the MySQL query.
   *
   * @param {*} value The value to parse.
   * @returns {number|boolean|string} Returns the correct notation for the MySQL query.
   */
  static parseValue(value) {
    // Debugging line.
    Helper.printDebugLine(MySQL.parseValue, __filename, __line);

    if (typeof value === 'string') return `'${value}'`;

    return value;
  }

  /**
   * Parse an object to an array in column value format.
   * @example obj = {name: "John"}; -> "name='John'";
   *
   * @param {object} object The object to parse.
   * @param {string} operator The operator for the where clause.
   * @returns {Array} Returns an array with string for each key in this object.
   */
  static parseColumnValue(object, operator) {
    // Debugging line.
    Helper.printDebugLine(MySQL.parseColumnValue, __filename, __line);

    let columnValues = [];

    for (let column in object) {
      if (!object.hasOwnProperty(column)) continue;
      if (typeof object[column] !== 'object') {
        columnValues.push(`${column} ${operator} ${MySQL.parseValue(object[column])}`);
        continue;
      }

      let innerCol = '',
        innerVal = null;

      for (let innerColumn in object[column]) {
        if (!object[column].hasOwnProperty(innerColumn)) continue;
        innerCol = innerColumn;
        innerVal = MySQL.parseValue(object[column][innerColumn]);
      }

      let obj = {
        object,
        column,
        innerCol,
        innerVal
      };

      columnValues.push(obj);
    }

    return columnValues;
  }

  /**
   * Parse the structure object to return specific columns.
   *
   * @param {object} structure The structure object
   * @param {boolean} structure[] The value of the keys inside the structure must be booleans.
   * @returns {Array} Returns an array of columns to return.
   */
  static parseStructure(structure) {
    // Debugging line.
    Helper.printDebugLine(MySQL.parseStructure, __filename, __line);

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

module.exports = MySQL;