/**
 * This script is for testing simple things like functions, so the crawler doesn't have to
 * crawl through any website. Mush faster, yeah!
 */

const QueryBuilder = require('./modules/querybuilder').QueryBuilder;

/**
 * Testing function with changing content. No more documentation necessary.
 *
 * @param value1: {*}
 * @param value2: {*}
 */
function test(value1, value2) {
  // Do something with the values.
  let credentials = {
    host: 'localhost',
    user: 'crawler',
    password: 'secret',
    database: 'crawler'
    },
    queryBuilder = new QueryBuilder(credentials);

  let result = queryBuilder.insert('starting_urls').set({url: 'http://www.ladies.de'}).execute();

  console.log(result);
  console.log('Value 1: ' + value1);
  console.log('Value 2: ' + value2);
}

let value1 = 'Value for value1';
let value2 = 'Value for value2';

test(value1, value2);