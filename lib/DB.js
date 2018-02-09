require(`${__dirname}/debugging`);

// Import custom modules.
const {MongoDB} = require(`${__dirname}/MongoDB`),
  {MySQL} = require(`${__dirname}/MySQL`),
  {Global} = require(`${__dirname}/Global`);

let instance = null;

/**
 * This class executes all database operations. It returns the instance of MongoDB or MySQL.
 */
class DB {

  /**
   * You must select a database type to get the database instance.
   *
   * @param {string} type The database type, "mongodb" or "mysql".
   * @returns {MongoDB|MySQL|null} Returns an instance of MongoDB or of MySQL.
   */
  static selectType(type) {
    type = type.toLowerCase();

    if (type === 'mongodb') {
      instance = new MongoDB();
    } else if(type === 'mysql') {
      instance = new MySQL();
    }

    return instance;
  }
}

exports.DB = DB;