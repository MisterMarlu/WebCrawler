const QueryBuilder = require('../querybuilder').QueryBuilder;
let credentials = {
  host: 'localhost',
  user: 'crawler',
  password: 'secret',
  database: 'crawler'
};
const queryBuilder = new QueryBuilder(credentials);

let DB = function () {
  if (!this instanceof DB) return new DB();
};

DB.prototype.save = function (table, values, whereValues, callback) {
  if (typeof whereValues === 'undefined') whereValues = {};
  if (typeof callback === 'undefined') callback = function () {};
  if (typeof whereValues === 'function') {
    callback = whereValues;
    whereValues = {};
  }

  if (whereValues.length < 1) {
    queryBuilder.insert(table);
    save(values, callback);
    return;
  }

  queryBuilder.from(table);

  for (let column in whereValues) {
    if (whereValues.hasOwnProperty(column)) {
      queryBuilder.andWhere(column, whereValues[column]);
    }
  }

  queryBuilder.execute(function (error, result, fields) {
    if (error) throw error;

    let operation = (result.length > 0) ? 'update' : 'insert';
    queryBuilder[operation](table);

    save(values, operation, whereValues, callback);
  });
};

DB.prototype.update = function (table, values) {
  queryBuilder.update(table);
  save(values);
};

DB.prototype.insert = function (table, values) {
  queryBuilder.insert(table);
  save(values);
};

function save(values, operation, whereValues, callback) {
  if (typeof operation === 'function') callback = operation;
  if (typeof whereValues === 'function') callback = whereValues;
  if (operation === 'update' && typeof whereValues === 'undefined') {
    throw 'When you try to update a row you have to specify which row should be updated.';
  }

  for (let column in values) {
    if (values.hasOwnProperty(column)) {
      queryBuilder.set(column, values[column]);
    }
  }

  if (operation === 'update') {
    for (let column in whereValues) {
      if (whereValues.hasOwnProperty(column)) {
        queryBuilder.andWhere(column, whereValues[column]);
      }
    }
  }

  let test = {};
  queryBuilder.execute(function (error, result, fields) {
    if (error) throw error;

    queryBuilder.closeConnection();

    callback(error, result, fields);
  });
}

exports.DB = DB;