/**
 * Import modules.
 */
const mysql = require('mysql');

/**
 * Private parameters.
 */
let operation,
  connection,
  query,
  subVals = [],
  whereVals = [],
  setVals = [],
  doingOR = false,
  rowCount = 0,
  openedGroupedWhere = false,
  openedGroupedSet = false;

/**
 * QueryBuilder constructor.
 *
 * @returns {QueryBuilder}
 * @constructor
 */
let QueryBuilder = function () {
  if (!this instanceof QueryBuilder) return new QueryBuilder(arguments[0]);

  this.resetQuery();
  this.setConnection(arguments[0]);
};

/**
 * Set the connection (host, db, user, pw).
 */
QueryBuilder.prototype.setConnection = function () {
  connection = mysql.createConnection(arguments[0]);
};

QueryBuilder.prototype.resetQuery = function () {
  query = {
    operation: '',
    fields: '',
    table: '',
    columns: '',
    values: '',
    joins: '',
    where: '',
    group: '',
    order: '',
    limit: '',
    offset: ''
  };

  this.resetOperation();
  this.resetFields();
  this.resetTable();
  this.resetColumns();
  this.resetValues();
  this.resetJoins();
  this.resetWhere();
  this.resetGroup();
  this.resetOrder();
  this.resetLimit();
  this.resetSet();
};

QueryBuilder.prototype.resetOperation = function () {
  query.operation = '';
  operation = '';
};

QueryBuilder.prototype.resetFields = function () {
  query.fields = '';
  subVals = [];
};

QueryBuilder.prototype.resetTable = function () {
  query.table = '';
};

QueryBuilder.prototype.resetColumns = function () {
  query.columns = '';
};

QueryBuilder.prototype.resetValues = function () {
  query.values = '';
};

QueryBuilder.prototype.resetJoins = function () {
  query.joins = '';
};

QueryBuilder.prototype.resetWhere = function () {
  query.where = '';
  whereVals = [];
};

QueryBuilder.prototype.resetGroup = function () {
  query.group = '';
};

QueryBuilder.prototype.resetOrder = function () {
  query.order = '';
};

QueryBuilder.prototype.resetLimit = function () {
  query.limit = '';
};

QueryBuilder.prototype.resetSet = function () {
  setVals = [];
};

QueryBuilder.prototype.query = function (prepared, values, keepQuery) {
  let self = this;
  if (!keepQuery) {
    this.resetQuery();
  }

  let sql = prepare(prepared, values);
  connection.connect(function (error) {
    if (error) throw error;

    connection.query(sql, function (error, result, fields) {
      if (error) throw error;

      return {result, fields, error};
    });
  });
};

/**
 * Select a field, group function or subquery. Following syntax should be used:
 * - (field, alias = '') to select a field or group function.
 * - ((new QueryBuilder(connectino)).from('example', alias = '')) to select a subquery.
 * Alternatively one could pass an anonymous function that returns a QueryBuilder instance
 * as the first argument.
 *
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.field = function () {
  if (arguments.length === 0) {
    throw 'Too few arguments.';
  }

  let args = [];

  for (let key in arguments) {
    if (arguments.hasOwnProperty(key)) {
      args.push(arguments[key]);
    }
  }

  if (query.fields.length > 0) { // Additional fields.
    query.fields += ', ';
  }

  if (typeof args[0] === 'function') {
    let a = args[0]();

    if (a instanceof this) {
      handleSubQuery(a);
    }
  } else if (args[0] instanceof this) {
    handleSubQuery(args[0]);
  } else {
    query.fields += ' AS ' + args[1];
  }

  return this;
};

/**
 * Define the main table you are selecting from.
 *
 * @param table: {string}
 * @param alias: {string} (optinal)
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.from = function (table, alias) {
  alias = optional(alias, '');

  operation = (operation.length === 0) ? 'select' : operation;
  if (operation === 'select') {
    query.operation = 'SELECT';
  }

  query.table = 'FROM ' + table;

  if (alias.length > 0) {
    query.table += ' AS ' + alias;
  }

  return this;
};

/**
 * Join a table to your query.
 *
 * @param table: {string} The table you are joining on.
 * @param condition: {string} The full condition for joining the table.
 * @param alias: {string} (optional) The alias to be used for the joined table.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.join = function (table, condition, alias) {
  alias = optional(alias, '');
  if (query.joins.length > 0) {
    query.joins += ' ';
  }

  query.joins += 'JOIN ' + table;
  if (alias.length > 0) {
    query.joins += ' AS ' + alias;
  }

  query.joins += ' ON ' + condition;

  return this;
};

/**
 * A wrapper for the join method. Adds 'LEFT' beforehand.
 *
 * @param table: {string} The table you are joining on.
 * @param condition: {string} The full condition for joining the table.
 * @param alias: {string} (optional) The alias to be used for the joined table.
 * @see QueryBuilder.join On how joins are handled.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.leftJoin = function (table, condition, alias) {
  query.joins += ' LEFT';
  this.join(table, condition, alias);
  return this;
};

/**
 * A wrapper for the join method. Adds 'RIGHT' beforehand.
 *
 * @param table: {string} The table you are joining on.
 * @param condition: {string} The full condition for joining the table.
 * @param alias: {string} (optional) The alias to be used for the joined table.
 * @see QueryBuilder.join On how joins are handled.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.rightJoin = function (table, condition, alias) {
  query.joins += ' RIGHT';
  this.join(table, condition, alias);
  return this;
};

/**
 * Add a where clause to your query. Can be called ambiguously:
 * - (field, value, operator = '=') to compare a single value
 * - (field, [value...], operator = 'IN') to compare multiple values
 * - (function(this) {this.where(...).orWhere(...);}) to group a where clause
 *
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.where = function () {
  if (arguments.length === 0) {
    throw 'Too few arguments';
  }

  if (query.where.length === 0) {
    query.where = 'WHERE';
  } else if (!doingOR && !openedGroupedWhere) {
    query.where += ' AND';
  } else if (doingOR) {
    query.where += ' OR';
    doingOR = false;
  }

  // Control bool to prevent this: "AND (AND" on grouped where clauses.
  openedGroupedWhere = false;

  let args = [];

  for (let key in arguments) {
    if (arguments.hasOwnProperty(key)) {
      args.push(arguments[key]);
    }
  }

  if (typeof args[0] === 'function') {
    query.where += ' (';
    openedGroupedWhere = true;
    this[args[0]]();
    query.where += ' )';
  } else {
    if (args.length === 0) {
      throw 'Condition required on where clause';
    }

    if (args.length < 2) {
      query.where += ' (' + args[0] + ') ';
      return this;
    }

    if (typeof args[0] !== 'string') {
      throw 'Your field value must be of type string.';
    }

    if (!isArray(args[1])) {
      query.where += ' ' + args[0] + ' ' + ((typeof args[2] !== 'undefined') ? args[2] : '=') + ' ?';
    } else {
      let tmp = args[1].concat();
      // Get a string with as many placeholders as there are values in the args[1] array.
      tmp.fill('?').join(',');
      query.where += ' ' + args[0] + ' ' + ((typeof args[2] !== 'undefined') ? args[2] : 'IN');
      query.where += ' (' + tmp + ')';
    }

    whereVals = whereVals.concat(args[1]);
  }

  return this;
};

/**
 * A wrapper for the where method.
 * @see QueryBuilder.where For a description of usable arguments.
 *
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.andWhere = function () {
  return this.where(arguments[0]);
};

/**
 * A wrapper for the where method.
 * @see QueryBuilder.where For a description of usable arguments.
 *
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.orWhere = function () {
  doingOR = true;
  return this.where(arguments[0]);
};

QueryBuilder.prototype.getVals = function () {
  return setVals.concat(subVals, whereVals);
};

QueryBuilder.prototype.execute = function (keepQuery) {
  keepQuery = optional(keepQuery, false);
  return this.query(this.getQuery(), this.getVals(), keepQuery);
};

QueryBuilder.prototype.getQuery = function () {
  if (query.table.length === 0) {
    throw 'No table defined';
  }

  if (operation === 'select' && query.fields.length === 0) {
    query.operation = 'SELECT *';
  }

  if (query.columns.length > 0) {
    query.columns = '( ' + query.columns + ' )';
  }

  if (query.values.length > 0 && operation === 'insert') {
    query.values = 'VALUES ( ' + query.values + ' )';
  }

  query = Object.keys(query).map(queryTrim);
  query = query.filter(function (element, index, array) {
    return (element.length > 0);
  });

  return query.join(' ');
};

/**
 * Set operation to insert and adds table to query.
 *
 * @param table: {string} The table you are inserting.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.insert = function (table) {
  if (query.operation > 0) {
    this.resetQuery();
  }

  operation = 'insert';
  query.operation = 'INSERT INTO';
  query.table = '`' + table + '`';
  return this;
};

/**
 * Set operatin to update and adds table to query.
 *
 * @param table: {string} The table you are updating.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.update = function (table) {
  if (query.operation > 0) {
    this.resetQuery();
  }

  operation = 'update';
  query.operation = 'UPDATE';
  query.table = '`' + table + '`';
  return this;
};

/**
 * Add a set clause. Can be called ambiguously:
 * - (value) to add a single clause (only on insert).
 * - ([values]) to add multiple clauses at once (only on insert).
 * - (column, value) to add a single clause (only on update).
 * - ({column = value}) to add multiple clauses at once.
 * - ([columns], [values]) to add multiple clauses at once.
 *
 * @return {QueryBuilder}
 */
QueryBuilder.prototype.set = function () {
  if (arguments.length === 0) {
    throw 'Too few arguments';
  }

  let argsNum = arguments.length,
    args = [];

  for (let key in arguments) {
    if (arguments.hasOwnProperty(key)) {
      args.push(arguments[key]);
    }
  }

  switch (operation) {
    case 'insert':
      return this.setInsert(args, argsNum);
      break;
    case 'update':
      return this.setUpdate(args, argsNum);
      break;
    default:
      throw 'You cannot use \'set\' when you do not use insert or update';
  }
};

/**
 * Prepare and add all values into the query.
 *
 * @param args: {array} Arguments from method set.
 * @param argsNum: {int} Number of arguments from method set.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.setInsert = function (args, argsNum) {
  // If single argument...
  let vals;
  let cols;
  if (argsNum === 1) {
    let insertObj = args[0];
    cols = [];
    vals = [];

    if (isArray(insertObj) || typeof insertObj !== 'object') {
      throw 'Values and columns must be an object like {column: "value"}.';
    } else {
      for (let key in insertObj) {
        if (insertObj.hasOwnProperty(key)) {
          cols.push(key);
          vals.push(insertObj[key]);
        }
      }
    }

    let tmp = vals.concat();
    tmp = tmp.fill('?').join(', ');
    cols = cols.join('`, `');

    if (query.values.length > 0) {
      query.values += ', ';
    }

    // Add value(s) to array and add '?' to query.
    setVals = setVals.concat(vals);
    query.values += tmp;
    query.columns += '`' + cols + '`';

    return this;
  }

  let tempVals = ' ?',
    countCols = 0,
    countVals = 0;
  cols = args[0];
  vals = args[1];

  // If columns are an array and values are not or reserved, throw error.
  if ((!isArray(cols) && isArray(vals)) || (isArray(cols) && !isArray(vals))) {
    throw 'The fields and values must be the same type.';
  }

  if (isArray(cols) && isArray(vals)) {
    countCols = cols.length;
    countVals = vals.length;

    cols = cols.join('`, `');
    tempVals = vals.concat();
    tempVals.fill(' ?').join(', ');
  } else {
    vals = [vals];
  }

  // If the number of columns and values is not equal.
  if (countCols !== countVals) {
    throw 'The number of fields and values must be equal.';
  }

  if (query.columns.length > 0 && query.values.length > 0) {
    query.columns += ', ';
    query.values += ', ';
  }

  setVals = setVals.concat(vals);
  query.columns += '`' + cols + '`';
  query.values += tempVals;

  return this;
};

/**
 * Prepare values and adds columns into the query.
 *
 * @param args: {array} Arguments from method set.
 * @param argsNum: {int} Number of arguments from method set.
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.setUpdate = function (args, argsNum) {
  if (query.values.length === 0) {
    query.values = 'SET ';
  }

  let i = 0;

  // If single argument (must be an object).
  if (argsNum === 1) {
    let sets = args[0];

    if (typeof sets !== 'object') {
      throw 'The parameter must be an object with column.value structure.';
    }

    i = 0;
    for (let key in sets) {
      if (sets.hasOwnProperty(key)) {
        setVals.push(sets[key]);
        query.values += '`' + key + '`=?';
        query.values += (i !== (sets.length - 1) ? ', ' : '');
        i += 1;
      }
    }

    return this;
  }

  if (isArray(args[0]) && isArray(args[1])) {
    let cols = args[0],
      vals = args[1];

    if (cols.length !== vals.length) {
      throw 'The number of fields and values must be equal.';
    }

    for (i = 0; i < cols.length; i += 1) {
      setVals.push(vals[i]);
      query.values += '`' + cols[i] + '`=?';
      query.values += (i !== (cols.length - 1) ? ', ' : '');
    }

    return this;
  }

  if (typeof args[0] !== 'object' && typeof args[1] !== 'object') {
    let column = args[0],
      value = args[1];

    if (openedGroupedSet) {
      query.values += ', ';
    }

    setVals.push(value);
    query.values += '`' + column + '`=?';
    openedGroupedSet = true;

    return this;
  }

  throw 'Your fields and values must be the same type.';
};

/**
 * Delete data. User method from to select a table.
 *
 * @returns {QueryBuilder}
 */
QueryBuilder.prototype.remove = function () {
  if (query.operation.length > 0) {
    this.resetQuery();
  }

  operation = 'delete';
  query.operation = 'DELETE';
  return this;
};

/**
 * @param sub: {QueryBuilder}
 */
function handleSubQuery(sub) {
  query.fields += '( ';
  query.fields += sub.getQuery();

  query.fields += ' )';
}

function queryTrim(key, index) {
  return query[key].trim();
}

/**
 * Custom prepare function to replace all question marks (?) with the correct value.
 *
 * @param sql: {string}
 * @param values: {array}
 * @returns {string}
 */
function prepare(sql, values) {
  for (let i = 0; i < values.length; i += 1) {
    sql = sql.replace(/\?/, '\'' + values[i] + '\'');
  }

  return sql;
}

/**
 * Easier optional parameter check with default value.
 *
 * @param variable
 * @param defaults
 * @returns {*}
 */
function optional(variable, defaults) {
  if (typeof variable === 'undefined') {
    variable = defaults;
  }

  return variable;
}

/**
 * Check if value is an array.
 *
 * @param variable
 * @returns {boolean}
 */
function isArray(variable) {
  return (Object.prototype.toString.call(variable) === '[object Array]');
}

exports.QueryBuilder = QueryBuilder;