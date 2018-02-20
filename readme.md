# WebCrawler

An easy script to crawl through websites. This crawler is not searching for anything but can be extended very easy via asynchronous callback functions.


Some configurations can be modified by creating a web-crawler.json file with specific parameters.

## Table of contents
1. [Installation](#installation)
2. [Configuration parameters](#configuration-parameters)
3. [Use callbacks](#use-callbacks)
4. [Public functions](#public-functions)
4. [Defining custom modules](#defining-custom-modules)
5. [Available parameters](#available-parameters)

### Installation

Just run *(not possible at the moment, maybe in future)*:
```
npm install --save mistermarlu/web-crawler
```

Import the `WebCrawler` class like:
```javascript

// Get commands from console.
const commands = require('minimist')(process.argv.slice(2)),
  {WebCrawler} = require('web-crawler');

let webcrawler = new WebCrawler(__dirname, commands);

```

Now you can work with the web crawler. Pretty easy, isn't it?

### Configuration parameters
Here is the full list of available configuration parameters:


```json
{
  "default": {
    "connString": "mongodb://{username}:{password}@{host}:{port}/{database}?authSource={authentication-database}",
    "connection": {
      "host": "host",
      "user": "username",
      "password": "password",
      "database": "mydb"
    },
    "dbVariant": "mongodb"
  },
  "crawler": {
    "lockFileName": "webcrawler.lock"
  },
  "output": {
    "logPath": "/full/path/to/logs",
    "logFileName": "webcrawler",
    "multiple": false
  },
  "screenShot": {
    "chromeless": {
      "waitTimeout": 3000,
      "launchChrome": false
    },
    "resolutions": [
      {
        "height": 3500,
        "width": 1920
      }
    ],
    "screenshot": {
      "filePath": "/full/path/to/screenshots/"
    },
    "clicks": [
      {
        "element": "a[href*=\"?enter\"]",
        "waits": {
          "before": 100,
          "after": 500
        }
      },
      {
        "element": ".popup .popup_closebutton",
        "waitings": {
          "before": 1000,
          "after": 1200
        }
      }
    ]
  }
}
```

Okay, now step for step: There are some available configurations in each module of the web crawler, first default:

  
**default.connString**
The connection string for mongodb because the web crawler saves some data.


**default.connection**
The connection object for mariadb because the web crawler saves some data.


**default.dbVariant**
The type of database you want to use. You can switch between mongodb and mysql.

  
**crawler.lockFileName**  
When the web crawler starts crawling it would create a `webcrawler.lock` file. 

  
**output.logPath**  
The path to the directory of the logs should be defined, otherwise it would create a log directory
within the directory where the web crawler was initialised.

  
**output.logFileName**  
The logger-1.log file would be created after starting the crawling process. You can customize this name.

  
**output.multiple**  
For default the web crawler creates for every crawling process an own log file. You can turn it off
so the web crawler would overwrite the old log file.

  
**screenShot.chromeless**  
Configurations for chromeless, see [here](https://github.com/graphcool/chromeless#usage).

  
**screenShot.resolutions**  
An array of width and height resolutions of the screenshots that should be done.

  
**screenShot.screenshot**  
Configurations for the screenshot, see [here](https://github.com/graphcool/chromeless/blob/master/docs/api.md#api-screenshot).

  
**screenShot.clicks**  
An array of objects. Each object has an `element` that should be clicked before doing the screenshot. 
`waitings` have to be an object too with `before` and `after`. These are the waiting times before and 
after clicking on the element.



### Use callbacks
Like I said you can use asynchronous callback functions to hook into the crawler.
At the moment there are some hooks available:

**1. Init**
```javascript

/**
 * Callback for initiation.
 *
 * @param {WebCrawler} webcrawler The WebCrawler instance.
 * @param {object} options The options for the webcrawler.
 * @param {string} [options.startUrl=https://www.phpdoc.org/] The url you are starting from.
 * @param {number} [options.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
 * @param {number} [options.debug=0] Turn on/off the debug mode.
 * @param {string} [options.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
 * @param {number} [options.screenShots=0] Turn on/of the function to create screenshots.
 */
function initCallback(webcrawler, options) {
  // Here you can do some operations before the crawling process begins.
  webcrawler.startCrawling();
}

webcrawler.setCallback('init', initCallback);

```

**2. Search**
```javascript

/**
 * Callback for searching.
 *
 * @param {function} $ The content of the website where we can perform like in jQuery.
 * @param {string} url The current url.
 * @returns {Promise} Returns an empty Promise.
 */
async function searchCallback($, url) {
  let links = $('a').attr('href^="/"'); // Here you can use the return value from "cheerio".
  console.log(`Found ${links.length} links.`);
  console.log(`Current visiting url is ${url}.`);
}

webcrawler.setCallback('search', searchCallback);

```

**3. Screenshot**
```javascript

/**
 * Callback for doing screenshots.
 *
 * @param {object} commands The options for the webcrawler.
 * @param {string} [commands.startUrl=https://www.phpdoc.org/] The url you are starting from.
 * @param {number} [commands.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
 * @param {number} [commands.debug=0] Turn on/off the debug mode.
 * @param {string} [commands.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
 * @param {number} [commands.screenShots=0] Turn on/of the function to create screenshots.
 * @returns {Promise} Returns an empty Promise.
 */
function screenshotCallback(commands) {
  return new Promise((resolve, reject) => {
      for (let key in commands) {
        if (commands.hasOwnProperty(key)) {
          console.log(`Command "${key}": ${commands[key]}`);
        }
      }

      resolve();
  });
}

webcrawler.setCallback('screenshot', screenshotCallback);

```

**4. Output**
```javascript

/**
 * Callback for outputting some information at the end of the log file.
 *
 * @param {string} reason The reason why the crawler has stopped the process.
 */
function outputCallback(reason) {
  console.log(reason);
}

webcrawler.setCallback('output', outputCallback);

```

**[back to top](#table-of-contents)**

### Public functions
There are a lot of functions you can use. This web crawler is a wrapper and manager of some classes. Remember, you can use a mongodb and a mysql database. So in the methods of DB the parameter is called "table" but with the usage of mongodb it would be called "collection".
So the wrapper WebCrawler has some functions and each class has it's own functions, let me show you:

### Wrapper

##### Wrapper.addModule(pathToModule)
Add a custom module.
**{string} pathToModule** *The relative path to the module.*

Example:
```javascript

webcrawler.addModule('/modules/SomeModule');
webcrawler.SomeModule.someMethod();

```

##### Wrapper.addConfig(pathToConfig, name)
Add a custom configuration file. It must be a .json file.
**{string} pathToConfig** *The absolute path to the configuration file.*
**{string} name** *The name of the configuration.*

Example:
```javascript

webcrawler.addConfig('/path/to/config.json', 'custom');

```

##### Wrapper.setCallback(name, callback)
Set a callback. On some points of the core it calls some callbacks so you can hook into some functions with your modules.
**{string} name** *A name for this callback is necessary.*
**{function} callback** *Of cause the callback should be a function.*

Example:
```javascript

function outputCallback(reason) {
  console.log(reason);
}

webcrawler.setCallback('output', outputCallback);

```

##### Wrapper.crawl(logFileName)
Prepare for the crawling process.
**{string} logFileName** *Name of the log file. Default is the name defined in a config.json.*

Example:
```javascript

let logFileName = 'log-1'; // Filename must end with "-1". Default is "logger-1"

webcrawler.crawl(logFileName); // logFileName is a optional parameter.

```

##### Wrapper.startCrawling()
Start the crawling process.

Example:
```javascript

function initCallback(webcrawler, options) {
  // Do some stuff before the webcrawler is starting.
  webcrawler.startCrawling();
}

webcrawler.setCallback('init', initCallback);
webcrawler.crawl();

```

#### DB

##### DB.insert(insert, table)
Insert new data.
**{object} insert** *The object that should be inserted.*
**{string} table** *The name of the table.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let insert = {
    foo: 'bar',
    bar: 'foo',
  };

webcrawler.db.insert(insert, 'foo').then(result => {
  // Do some stuff here.
}).catch(error => {
  // Catch the error.
});

```

##### DB.update(filter, update, table, operator = '=')
Update data.
**{object} filter** *The filter to get the current object.*
**{object} update** *The object that should be updated.*
**{string} table** *The name of the table.*
**{string} operator** *The operator for the where clause.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let update = {
    foo: 'bar',
    bar: 'bar',
  },
  filter = {
    foo: 'bar',
  };

webcrawler.db.update(filter, update, 'foo').then(result => {
  // Do some stuff here.
}).catch(error => {
  // Catch the error.
});

```

##### DB.save(filter, object, table, operator = '=')
Insert data or update if already exists.
**{object} filter** *The filter to get the current object.*
**{object} object** *The object that should be inserted or updated.*
**{string} table** *The name of the table.*
**{string} operator** *The operator for the where clause.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let obj = {
    foo: 'bar',
    bar: 'foo',
  },
  filter = {
    foo: 'bar',
  };

webcrawler.db.save(filter, obj, 'foo').then(result => {
  // Do some stuff here.
}).catch(error => {
  // Catch the error.
});

```

##### DB.delete(filter, table, operator = '=')
Delete data.
**{object} filter** *The filter to get the current object.*
**{string} table** *The name of the table.*
**{string} operator** *The operator for the where clause.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let filter = {
    foo: 'bar',
  };

webcrawler.db.delete(filter, 'foo').then(result => {
  // Do some stuff here.
}).catch(error => {
  // Catch the error.
});

```

##### DB.findAll(table)
Get all data from table.
**{string} table** *The name of the table.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

webcrawler.db.findAll('foo').then(result => {
 // Do some stuff here.
}).catch(error => {
 // Catch the error.
});

```

##### DB.find(filter, table, structure = {}, operator = '=')
Get data from table.
**{object} filter** *The filter to get the current object.*
**{string} table** *The name of the table.*
**{string} structure** *The structure in that the object should be returned.*
**{string} operator** *The operator for the where clause.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let filter = {
    foo: 'bar',
  },
  structure = {
    bar: true,
  };

webcrawler.db.find(filter, structure, 'foo').then(result => {
  // Do some stuff here.
}).catch(error => {
  // Catch the error.
});

```

##### DB.findOne(filter, table, structure = {}, operator = '=')
Get one element from table.
**{object} filter** *The filter to get the current object.*
**{string} table** *The name of the table.*
**{string} structure** *The structure in that the object should be returned.*
**{string} operator** *The operator for the where clause.*
**Return {Promise}** *Returns a Promise object with the result of the database.*

Example:
```javascript

let search = {
    id: 156,
  };

// With MySQL this is the equivalent to "SELECT * FROM foo WHERE id = 156".
webcrawler.db.findOne(search, {}, 'foo').then(result => {
 // Do some stuff here.
}).catch(error => {
 // Catch the error.
});

```

#### Output

##### Output.write(value, toConsole = false, type = '', background = '')
Write output.
**{string} value** *The value that should be printed.*
**{boolean} toConsole** *Print to console.*
**{string} type** *The type or color of the value.*
**{string} background** *The background color of the value.*

Example:
```javascript

webcrawler.output.write('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://git.rto.de/cws/rtocrawler/blob/master/core/doc/output.black.white.png)

##### Output.writeLine(value, toConsole = false, type = '', background = '')
Write output with a new line before.
**{string} value** *The value that should be printed.*
**{boolean} toConsole** *Print to console.*
**{string} type** *The type or color of the value.*
**{string} background** *The background color of the value.*

Example:
```javascript

webcrawler.output.writeLine('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://git.rto.de/cws/rtocrawler/blob/master/core/doc/output.black.white.png)

##### Output.writeWithSpace(value, toConsole = false, type = '', background = '')
Write output with a trailing new line.
**{string} value** *The value that should be printed.*
**{boolean} toConsole** *Print to console.*
**{string} type** *The type or color of the value.*
**{string} background** *The background color of the value.*

Example:
```javascript

webcrawler.output.writeWithSpace('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://git.rto.de/cws/rtocrawler/blob/master/core/doc/output.black.white.png)

##### Output.writeConsole(value, toConsole = false, type, background)
Write in console only.
**{string} value** *The value that should be printed.*
**{boolean} toConsole** *Print to console.*
**{string} type** *The type or color of the value.*
**{string} background** *The background color of the value.*

Example:
```javascript

webcrawler.output.writeConsole('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://git.rto.de/cws/rtocrawler/blob/master/core/doc/output.black.white.png)

##### Output.writeOutput(sentences, type = '')
Write array as strings with new line for each entry.
**{object[]} sentences** *An array of objects stored with default write information.*
**{string} sentences[].text** *The text that should be printed.*
**{string} sentences[].type** *The type or color of the text.*
**{string} sentences[].background** *The background color of the text.*
**{string} type** *The type or color of the first text.*

Example:
```javascript

let sentences = [];

sentences.push({text: 'The headline'});
sentences.push({text: 'An example', color: 'green'});
sentences.push({text: 'Another example', color: 'black', bg: 'green'});

webcrawler.output.writeOutput(sentences, 'underscore');

// Would print this sentences to console as small list.

```
![screenshot from console](https://git.rto.de/cws/rtocrawler/blob/master/core/doc/output.array.png)

##### Output.getColor(type, background = '')
Get colored command line output.
**{string} type** *The type or color of the value.*
**{string} background** *The background color of the value.*
**Return {string}** *Returns the colored string.*

Example:
```javascript

// Would return "\x1b[30m\x1b[47m%s\x1b[0m" to get a colored string:
let colorString = webcrawler.output.getColor('black', 'white');

console.log(colorString, 'Say something.');

```

#### ScreenShot

##### ScreenShot.stopChrome()
Kill all Google Chrome processes.

Example:
```javascript

webcrawler.screenShot.stopChrome();

```

##### ScreenShot.doScreenshots(websites, debug, callback)
Create a screenshot for each website that does not has an error.
**{object[]} websites** *An array with objects that stores website information.*
**{string} websites[].url** *The url to a website without the protocol.*
**{boolean} websites[].has_error** *Has the website an error? (Like 404, 500, etc.)*
**{string} websites[].name** *Name of the website, e.g. "imprint" or "home".*
**{string} websites[].found_url** *The url where the website was found.*
**{function} callback** *This callback would be called when the screenshot was saved.*
**Return {Promise}** *Promise object represents an object of time, timeString, done, undone and total screenshots.*

Example:
```javascript

// Websites must be an array with website objects
let websites = [
    {
      url: 'http://example.com/imprint', // Url where you want to have a screenshot.
      has_error: false, // The found website can be invalid now or may has a wrong toplevel domain.
      name: 'imprint', // Title of the website.
      found_url: 'https://github.com/MisterMarlu', // Url where the screenshot website was found (maybe interesting for portal crawling).
    }
  ];

function callbackAfterEachScreenshot(screenshotPath) {
  // Do something.
}

webcrawler.screenShot.doScreenshots(websites, callbackAfterEachScreenshot).then(details => {
 // Do some stuff here.
}).catch(error => {
 // Catch the error.
});

```

#### DelayedSave

##### DelayedSave.addType(collection, globalName, index, callback = DelayedSave.save)
Add a type with necessary information so DelayedSave know how to save the data.
**{string} collection** *Name of the collection.*
**{string} globalName** *Name of the array of objects in the class Global*
**{string} index** *Index of the collection.*
**{function} callback** *Callback to the way of saving the data.*

Example:
```javascript

class CustomModule extends BaseModule {
  constructor(options) {
    super(options);

    this.delayedSave.addType('foo', 'foo', 'bar', CustomModule.delayedSaveMethod);

    return this;
  }
}

```

#### Global

##### Global.get(name)
Get any parameter.
**{string} name** *The name of the parameter.*
**Return {*|null}** *Returns the value of the parameter or null.*

Example:
```javascript

const {Global} = require('web-crawler');

let foo = Global.get('foo');

```

##### Global.set(name, value)
Set any parameter.
**{string} name** *The name of the parameter.*
**{*} value** *The value of the parameter.*

Example:
```javascript

const {Global} = require('web-crawler');

let foo = 'bar';

Global.set('foo', foo);

```

#### Formatter

##### Formatter.toUpperFirst(string)
Converts the first letter of a string to upper case.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let upperFirst = Formatter.toUpperFirst('foo'); // Would return 'Foo'.

```

##### Formatter.camelToUnderscore(camel)
Convert camelCase to snake_case.
**{string} camel** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let underscore = Formatter.camelToUnderscore('fooBar'); // Would return 'foo_bar'.

```

##### Formatter.dashToCamel(dash)
Convert dash-case to camelCase.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let camel = Formatter.dashToCamel('foo-bar'); // Would return 'fooBar'.

```

##### Formatter.underscoreToDash(underscore)
Convert snake_case to dash-case.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let dash = Formatter.unserscoreToDash('foo_bar'); // Would return 'foo_bar'.

```

##### Formatter.camelToDash(camel)
Convert camelCase to dash-case.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let dash = Formatter.camelToDash('fooBar'); // Would return 'foo-bar'.

```

##### Formatter.dashToUnderscore(dash)
Convert dash-case to snake_case.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let underscore = Formatter.dashToUnderscore('foo-bar'); // Would return 'foo_bar'.

```

##### Formatter.underscoreToCamel(underscore)
Convert dash-case to camelCase.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let camel = Formatter.underscoreToCame('foo_bar'); // Would return 'fooBar'.

```

##### Formatter.underscoreToWhitespace(underscore)
Convert underscore to whitespaces.
**{string} string** *The string that should be converted.*
**Return {string}** *Returns the converted string.*

Example:
```javascript

const {Formatter} = require('web-crawler');

let whitespace = Formatter.underscoreToWhitespace('foo_bar'); // Would return 'foo bar'.

```

#### Parser

##### Parser.getModuleName(path)
Get the name of the module from the absolute file path.
**{string} path** *Absolute path to the file.*
**Return {string}** *Returns the module name.*

Example:
```javascript

// file "CustomModule.js".
const {Parser} = require('web-crawler');

let moduleName = Parser.getModuleName(__filename); // Would return 'CustomModule'.

```

##### Parser.getMethodName(method)
Get the name of the method that is called.
**{function} method** *The method.*
**Return {string}** *Returns the method name.*

Example:
```javascript

const {Parser} = require('web-crawler');

function foo() {
  let methodName = Parser.getMethodName(foo);
}

```

##### Parser.parseTime(ms, toArray = false)
Parse milliseconds to object or array with days, hours, minutes and seconds.
**{number} ms** *Milliseconds that should be parsed.*
**{boolean} toArray** *Return as an array.*
**Return {object|array}** *Returns an object with d, h, m and s or an array with it's values.*

Example:
```javascript

const {Parser} = require('web-crawler');

let start = new Date();

setTimeout(() => {
  let ms = new Date() - start,
    time = Parser.parseTime(ms);
}, 2000);

```

#### Helper

##### Helper.twoDigits(number)
Convert a one digit number into a two digit number.
**{number} number** *The number to convert.*
**Return {string}** *Returns a two digit number as string.*

Example:
```javascript

const {Helper} = require('web-crawler');

let minutes = Helper.twoDigits(5); // Would return "05".

```

##### Helper.getSqlTimestamp(date = new Date())
Get a current MySQL timestamp.
**{Date} date** *A Date object.*
**Return {string}** *Returns the current MySQL timestamp.*

Example:
```javascript

const {Helper} = require('web-crawler');

let timestamp = Helper.getSqlTimestamp(); // Would return "2018-02-20 15:02:26".

```

##### Helper.hasCallback(name)
Check if a callback exists.
**{string} name** *The name of a callback.*
**Return {boolean}** *Returns true or false.*

Example:
```javascript

const {Helper} = require('web-crawler');

if (Helper.hasCallback('init')) {
  // Do something.
}

```

##### Helper.getCallback(name)
Get a callback if exists.
**{string} name** *The name of a callback.*
**Return {function|null}** *Returns the callback or null if not exists.*

Example:
```javascript

const {Helper} = require('web-crawler');

if (Helper.hasCallback('init')) {
  Helper.getCallback('init')();
}

```

##### Helper.isDebug(moduleName)
Check if debug mode is enabled for the given module.
**{string} moduleName** *The name of the module.*
**Return {boolean}** *Returns true or false.*

Example:
```javascript

const {Helper} = require('web-crawler');

if (Helper.isDebug('CustomModule')) {
  console.log('Debug mode enabled for this module');
}

```

##### Helper.debugEnabled()
Check if debug mode is enabled.
**Return {boolean}** *Returns true or false.*

Example:
```javascript

const {Helper} = require('web-crawler');

if (Helper.debugEnabled()) {
  console.log('Debug mode enabled');
}

```

##### Helper.printDebugLine(output, method, file, line)
Prints the debugging line.
**{Output} output** *The Output instance.*
**{function} method** *The method which called this method.*
**{string} file** *The absolute path to the file.*
**{number} line** *The line number where this method was called.*

Example:
```javascript

const {Helper} = require('web-crawler');

class CustomModule extends BaseModule {
  constructor(options) {
    super(options);

    return this;
  }

  foo() {
    Helper.printDebugLine(this.output, this.foo, __filename, __line);
  }
}


```

**[back to top](#table-of-contents)**

### Defining custom modules

You can define your own modules with the default module generator:
```
npm run add-module
```

You can also define your module manually with this preferred template:
```javascript

// Import custom modules.
const {BaseModule} = require(`${__dirname}/../core`);

let instance = null;

/**
 * A new module.
 *
 * @extends BaseModule
 * @param {object} options An object of options, defined in the core.
 * @returns {ModuleName} Returns the ModuleName instance.
 */
class ModuleName extends BaseModule {

  /**
   * @see ModuleName.
   */
  constructor(options) {
    // Constructor of the super class.
    super(options);

    // The class ModuleName is a singleton class.
    if (!(this instanceof ModuleName)) return new ModuleName(options);
    if (instance instanceof ModuleName) return instance;

    instance = this;

    return this;
  }
}

exports.ModuleName = ModuleName;

```

**[back to top](#table-of-contents)**

### Available parameters
You can call your script with
```
node script.js --startUrl="https://github.com" --pageLimit=100 --screenShots=1 --debug=1 --debugModule=Wrapper
```

Here you can see all available parameters:

| Parameter   | Type             | Default                   | Description                                                                |
| ----------- | ---------------- | ------------------------- | -------------------------------------------------------------------------- |
| startUrl    | string           | `https://www.phpdoc.org/` | Full url with correct protocol *(`http` recommend)*                        |
| pageLimit   | number           | `0`                       | Limitation of websites to be crawled *(`0` for infinity)*                  |
| screenShots | boolean          | `0`                       | If `1` screenshots would be made for each customer website                 |
| debug       | boolean          | `0`                       | If `1` you get a lot of output for debugging. You can add a module name    |
| debugModule | string           | ` `                       | The module you like to get the debug information                           |

**[back to top](#table-of-contents)**