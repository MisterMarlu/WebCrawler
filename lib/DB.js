require(`${__dirname}/debugging`);

// Import custom modules.
const {MongoDB} = require(`${__dirname}/MongoDB`),
  {MySQL} = require(`${__dirname}/MySQL`),
  {Global} = require(`${__dirname}/Global`);

let instance = null,
  variant = null;

// Switch the database class between MongoDB and MySQL.
if (Global.get('dbVariant') === 'mongodb') {
  variant = MongoDB;
} else {
  variant = MySQL;
}

/**
 * This class executes all database operations.
 *
 * @extends variant
 * @returns {DB} Returns the DB instance.
 */
class DB extends variant {

  /**
   * @see DB.
   */
  constructor() {
    // Constructor of the super class.
    super();

    // The class DB is a singleton class.
    if (instance instanceof DB) return instance;
    if (!(this instanceof DB)) return new DB();

    instance = this;
    return instance;
  }
}

exports.DB = DB;