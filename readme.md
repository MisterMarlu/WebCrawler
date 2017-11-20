# WebCrawler

An easy script to crawl through websites. This crawler is not searching for anything but can be extended very easy via asynchronous callback functions.


Some configurations can be modified by creating a web-crawler.json file with specific parameters.

## Table of contents
1. [Installation](#installation)
2. [Configuration parameters](#configuration-parameters)
3. [Use callbacks](#use-callbacks)
4. [Public functions](#public-functions)
5. [Available parameters](#available-parameters)

### Installation

Just run *(not possible at the moment, maybe in future)*:
```
npm install --save mistermarlu/web-crawler
```

Import the `WebCrawler` class like:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

```

Now you can work with the web crawler. Pretty easy, isn't it?

### Configuration parameters
Here is the full list of available configuration parameters:


```json
{
  "db": {
    "connString": "mongodb://{user}:{password}@{host}:{port}/{database}?authSource={authentication-database}"
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
      "waitTimeout": 3000
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

Okay, now step for step: There are some available configurations in each module of the web crawler, first db:

  
**db.connString**  
The connection string for mongodb because the web crawler saves some data.

  
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
 * @param webcrawler: {WebCrawler} Instance of the current used WebCrawler.
 * @param options: {{}} An object with starting options.
 */
function initCallback(webcrawler, options) {
  // Here you can do some operations before the crawling process begins.
  webcrawler.startCrawling(options);
}

crawler.setInitCallback(initCallback);

```

**2. Search**
```javascript

/**
 * @param $ Return value from "cheerio.load"
 * @param url: {string} The current visited url
 * @param crawler: {Crawler} An instance of the crawler module inside of the web-crawler.
 */
async function searchCallback($, url, crawler) {
  let links = $('a').attr('href^="/"'); // Here you can use the return value from "cheerio".
  console.log(`Found ${links.length} links.`);
  console.log(`Current visiting url is ${url}.`);
  console.log(`Is debug mode enabled? ${crawler.debug}`);
  
  return 0;
}

crawler.setSearchCallback(searchCallback);

```

**3. Screenshot**
```javascript

/**
 * @param commands: {{startUrl: string, pageLimit: int, screenShots: boolean, debug: boolean}} Object of commands that you can get the script.
 */
async function screenshotCallback(commands) {
  for (let key in commands) {
    if (commands.hasOwnProperty(key)) {
      console.log(`Command "${key}": ${commands[key]}`);
    }
  }
  
  return 0;
}

crawler.setScreenshotCallback(screenshotCallback);

```

**4. Output**
```javascript

/**
 * @param reason: {string} Reason for ending crawling process (e.g. reached pageLimit)
 */
async function outputCallback(reason) {
  console.log(reason);
  
  return 0;
}

crawler.setOutputCallback(outputCallback);

```

**[back to top](#table-of-contents)**

### Public functions
There are a lot of functions you can use. This web crawler is a wrapper and manager of four classes:
1. Crawler
2. Database
3. Output
4. Screenshot

So the "wrapper" WebCrawler has some functions and each class has it's own functions, let me show you

#### WebCrawler.addModule(moduleName, path)
Initialize external module to make it usable into WebCrawler.  
**moduleName: {string}**  
**path: {string}**  
```javascript

WebCrawler.prototype.addModule = function (moduleName, path) {
  let Module = require(this.projectPath + path)[moduleName];
  this[moduleName] = new Module({output: this.output, db: this.db});
};

```

Example: 
```javascript

const {WebCrawler} = require('web-crawler'),
  {SomeModule} = require('some-module');

let crawler = new WebCrawler(__dirname);

crawler.addModule('SomeModule', '/modules/some-module');
crawler.SomeModule.someMethod();

```

#### WebCrawler.setInitCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.setSearchCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.setScreenshotCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.setOutputCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.crawl(options, logFileName)
*(async function)* Prepare the crawling process.  
**options** Can be type of object or string.  
**logFileName?: {string}**  
```javascript

WebCrawler.prototype.crawl = function (options, logFileName) {
  if (typeof logFileName === 'undefined') logFileName = this.output.logFileName;
  if (typeof options === 'string') options = {startUrl: options};

  this.databaseCheck();

  // Do not run multiple crawling processes.
  if (this.crawler.hasLockFile()) return;

  saveStartingUrl(options.startUrl, this);

  let self = this;
  setTimeout(function () {
    // Init the log.
    self.output.initLogger(logFileName);
    self.crawler.setOptions(options);
    self.crawler.init(options.startUrl);
    self.output.writeUserInput(self.crawler);

    if (typeof self.initCallback === 'function') {
      self.initCallback(self, options);
      return;
    }

    self.startCrawling(options);
  }, 10000);
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  logFileName = 'log-1'; // Filename must end with "-1". Default is "logger-1"

// Can be a string of the starting url.
let options = 'https://github.com';

// Can also be an object of the available commands.
let options = {
  startUrl: 'https://github.com',
  pageLimit: 1000,
  screenShots: true,
  debug: false
};

crawler.crawl(options, logFileName);

```

#### WebCrawler.startCrawling(options)
*(async function)* Start the crawling process.  
**options: {{}}** Must contain "startUrl" as string.  
```javascript

WebCrawler.prototype.startCrawling = async function (options) {
  // The crawling process.
  let reason = await this.crawler.start(this.searchCallback);

  if (typeof options.screenShots !== 'undefined' && options.screenShots === 'true') {
    // Call the callbacks so the customer can do everything.
    if (typeof this.screenshotCallback === 'function') {
      await this.screenshotCallback(this.crawler.commands);
    }
  }

  if (typeof this.outputCallback === 'function') {
    await this.outputCallback(reason);
  }

  // End the crawling process after killing all chrome processes.
  this.screenShot.stopChrome(this.crawler.end());
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

function initCallback(webcrawler, options) {
  webcrawler.startCrawling(options);
}

crawler.setInitCallback(initCallback);
crawler.crawl(options, logFileName);

```
#### DB.insert(object, collection, callback)
Insert new data into mongodb.  
**object: {{}}**  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.insert = function (object, collection, callback) {
  this.query(arguments, insertCallback);
};

function insertCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  object.created_at = new Date();
  object.updated_at = object.created_at;

  db.collection(collection).insertOne(object, function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  someObj = {
    foo: 'bar',
    time: new Date()
  };

crawler.db.insert(someObj, 'foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.update(oldObject, newObject, collection, callback)
Update data in mongodb.  
**oldObject: {{}}**  
**newObject: {{}}**  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.update = function (oldObject, newObject, collection, callback) {
  this.query(arguments, updateCallback);
};

function updateCallback(db, args) {
  let oldObject = args[0],
    newObject = args[1],
    collection = args[2],
    callback = args[3];

  newObject.updated_at = new Date();

  db.collection(collection).updateOne(oldObject, newObject, function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  someObj = {
    foo: 'bar',
    bar: 'foo',
    time: new Date()
  },
  oldObj = {
    foo: 'bar',
    bar: 'bar',
  };

crawler.db.update(oldObj, someObj, 'foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.save(oldObject, newObject, collection, callback)
Insert new data into mongodb, if already exist, update.  
**oldObject: {{}}**  
**newObject: {{}}**  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.save = function (oldObject, newObject, collection, callback) {
  this.query(arguments, saveCallback, false);
};

function saveCallback(db, args) {
  let oldObject = args[0],
    newObject = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).find(oldObject, {_id: false}).toArray(function (error, result) {
    if (error) throw error;

    newObject.updated_at = new Date();

    if (result.length < 1) {
      newObject.created_at = newObject.updated_at;
      db.collection(collection).insertOne(newObject, function (error, result) {
        callback(error, result);
        db.close();
      });

      return;
    }

    for (let index in result) {
      let updateObject = {};

      for (let key in result[index]) {
        updateObject[key] = result[index][key];
      }

      for (let key in newObject) {
        if (newObject.hasOwnProperty(key)) {
          updateObject[key] = newObject[key];
        }
      }

      db.collection(collection).updateOne(oldObject, updateObject, function (error, result) {
        callback(error, result);
        db.close();
      });
    }
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  someObj = {
    foo: 'bar',
    bar: 'foo',
    time: new Date()
  },
  oldObj = {
    foo: 'bar',
  };

crawler.db.save(oldObj, someObj, 'foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.delete(object, collection, callback)
Method to delete an object from the mongodb.  
**object: {{}}**   
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.delete = function (object, collection, callback) {
  this.query(arguments, deleteCallback);
};

function deleteCallback(db, args) {
  let object = args[0],
    collection = args[1],
    callback = args[2];

  db.collection(collection).deleteOne(object, function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  someObj = {
    foo: 'bar',
  };

crawler.db.delete(someObj, 'foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.findAll(collection, callback)
Get all data from mongodb.  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.findAll = function (collection, callback) {
  this.query(arguments, findAllCallback);
};

function findAllCallback(db, args) {
  let collection = args[0],
    callback = args[1];

  db.collection(collection).find({}).toArray(function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.db.findAll('foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.find(search, structure, collection, callback)
Get data from mongodb.  
**search: {{}}**  
**structure: {{}}**  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.find = function (search, structure, collection, callback) {
  this.query(arguments, findCallback);
};

function findCallback(db, args) {
  let search = args[0],
    structure = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).find(search, structure).toArray(function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  search = {
    foo: 'bar',
  },
  structure = {
    _id: false,
  };

crawler.db.find(search, structure, 'foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.findOne(search, structure, collection, callback)
Get data from mongodb.  
**search: {{}}**  
**structure: {{}}**  
**collection: {string}**  
**callback: {function}**  
```javascript

DB.prototype.findOne = function (search, structure, collection, callback) {
  this.query(arguments, findOneCallback);
};

function findOneCallback(db, args) {
  let search = args[0],
    structure = args[1],
    collection = args[2],
    callback = args[3];

  db.collection(collection).findOne(search, structure, function (error, result) {
    callback(error, result);
  });
}

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
  search = {
    _id: '5a09ba884172bb1ce5264fae',
  },
  structure = {
    _id: true,
  };

crawler.db.findOne(search, structure, 'foo', function(error, foo) {
  if (error) throw error;

  // do something.
});

```

#### Output.write(value, print, type, background)
Write output.  
**value: {*}**  
**print?: {boolean}**  
**type?: {string}**  
**background?: {string}**  
```javascript

Output.prototype.write = function (value, print, type, background) {
  if (typeof value === 'object') {
    this.logger.write(JSON.stringify(value) + "\r\n");
  } else {
    this.logger.write(value + "\r\n");
  }

  if (typeof print === 'undefined' || !print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  if (typeof background === 'undefined' || background.length < 1) {
    console.log(this.getColor(type), value);
    return;
  }

  console.log(this.getColor(type, background), ` ${value} `);
};

```

Example: 
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.write('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://github.com/MisterMarlu/WebCrawler/blob/master/doc/output.black.white.png)

#### Output.writeLine(value, print, type, background)
Write output with a new line before.  
**value: {*}**  
**print?: {boolean}**  
**type?: {string}**  
**background?: {string}**  
```javascript

Output.prototype.writeLine = function (value, print, type, background) {
  this.logger.write("\r\n");

  if (print) console.log();

  this.write(value, print, type, background);
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeLine('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://github.com/MisterMarlu/WebCrawler/blob/master/doc/output.black.white.png)

#### Output.writeWithSpace(value, print, type, background)
Write output with a trailing new line.  
**value: {*}**  
**print?: {boolean}**  
**type?: {string}**  
**background?: {string}**  
```javascript

Output.prototype.writeWithSpace = function (value, print, type, background) {
  this.write(value, print, type, background);
  this.logger.write("\r\n");

  if (print) console.log();
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeWithSpace('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://github.com/MisterMarlu/WebCrawler/blob/master/doc/output.black.white.png)

#### Output.writeConsole(value, print, type, background)
Write in console only. 
**value: {*}**  
**print?: {boolean}**  
**type?: {string}**  
**background?: {string}**  
```javascript

Output.prototype.writeConsole = function (value, print, type, background) {
  if (!print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  if (typeof background === 'undefined' || background.length < 1) {
    console.log(this.getColor(type), value);
    return;
  }

  console.log(this.getColor(type, background), ` ${value} `);
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeConsole('An example', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```
![screenshot from console](https://github.com/MisterMarlu/WebCrawler/blob/master/doc/output.black.white.png)

#### Output.writeConsole(sentences, type)
Write array as strings with new line for each entry.  
**sentences: {[{text: string, color: string, bg: string}]}**  
**type?: {string}**  
```javascript

Output.prototype.writeOutput = function (sentences, type) {
  this.writeLine(sentences[0].text, true, type);

  for (let i = 1; i < sentences.length; i += 1) {
    let color = sentences[i].color || '',
      bg = sentences[i].bg || '';
    this.write(sentences[i].text, true, color, bg);
  }
};

```

Example:
```javascript

const { WebCrawler } = require('web-crawler');

let sentences = [],
  crawler = new WebCrawler(__dirname);

sentences.push({text: 'The headline'});
sentences.push({text: 'An example', color: 'green'});
sentences.push({text: 'Another example', color: 'black', bg: 'green'});

crawler.output.writeOutput(sentences, 'underscore');

// Would print this sentences to console as small list.

```
![screenshot from console](https://github.com/MisterMarlu/WebCrawler/blob/master/doc/output.array.png)

#### Output.getColor(type, background)
Get colored command line output.  
**type: {string}**  
**background?: {string}**  
```javascript

Output.prototype.getColor = function (type, background) {
  let colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      underscore: "\x1b[4m",
      blink: "\x1b[5m",
      reverse: "\x1b[7m",
      hidden: "\x1b[8m",

      black: "\x1b[30m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",

      bgBlack: "\x1b[40m",
      bgRed: "\x1b[41m",
      bgGreen: "\x1b[42m",
      bgYellow: "\x1b[43m",
      bgBlue: "\x1b[44m",
      bgMagenta: "\x1b[45m",
      bgCyan: "\x1b[46m",
      bgWhite: "\x1b[47m",

      comment: "\x1b[90m"
    },
    string = '';

  colors.error = colors.red;
  colors.success = colors.green;
  colors.warning = colors.yellow;
  colors.default = colors.magenta;
  colors.debug = colors.cyan;

  if (colors.hasOwnProperty(type)) {
    string = colors[type] + '%s' + colors.reset;

    if (typeof background !== 'undefined' && colors.hasOwnProperty(`bg${toUpperFirst(background)}`)) {
      string = colors[`bg${toUpperFirst(background)}`] + string;
    }
  }

  return string;
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

// Would return "\x1b[30m\x1b[47m%s\x1b[0m" to get a colored string:
let colorString = crawler.output.getColor('black', 'white');

console.log(colorString, 'Say something.')

```

#### ScreenShot.doScreenshots(websites, debug, callback)
*(async function)* Do a screenshot for each website that does not has an error.  
**websites: {[{url: string, has_error: boolean, name: string, found_url: string}]}**  
**debug: {boolean}**  
**callback?: {function}**  
```javascript

ScreenShot.prototype.doScreenshots = async function (websites, debug, callback) {
  this.countUndone(websites);
  let tmpSpinner = null,
    stAdd = '',
    start = new Date(),
    chromeArgs = [
      '--headless',
      '--hide-scrollbars',
      '--remote-debugging-port=9222',
      '--disable-gpu'
    ];

  if (require("os").userInfo().username === 'root') chromeArgs.push('--no-sandbox');

  // Start server side Google Chrome.
  let chrome = spawn('google-chrome-stable', chromeArgs);

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].has_error) {
      for (let j = 0; j < this.dimensions.length; j += 1) {
        stAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
        tmpSpinner = new Spinner(spinnerText + stAdd);
        tmpSpinner.start();

        // Do the screenshot.
        await this.checkUrl(websites[i].url, websites[i], j, debug, callback);
        tmpSpinner.stop(true);
      }
    }
  }

  // Stop server side Google Chrome.
  chrome.kill('SIGINT');

  let time = new Date() - start,
    t = parseTime(time),
    read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;

  return {
    time,
    timeString: `Time for screenshotting: ${read}`,
    done: this.done,
    undone: this.undone,
    total: this.total
  };
};

```

Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
// Websites must be an array with website objects
  websites = [
    {
      found_url: 'https://github.com/MisterMarlu', // Url where the screenshot website was found (maybe interesting for portal crawling).
      name: 'Imprint', // Title of the website.
      url: 'http://example.com/imprint', // Url where you want to have a screenshot.
      has_error: false, // The found website can be invalid now or may has a wrong toplevel domain.
    }
  ];

function callbackAfterEachScreenshot(screenshotPath) {
  // Do something.
}

crawler.screenshots.doScreenshots(websites, false, callbackAfterEachScreenshot);

```

**[back to top](#table-of-contents)**

### Available parameters
You can call your script with
```
node script.js --startUrl="https://github.com"
```

Here you can see all available parameters:

| Parameter   | Type    | Default                   | Description                                                   |  
| ----------- | ------- | ------------------------- | ------------------------------------------------------------- |  
| startUrl    | string  | `https://www.phpdoc.org/` | Full url with correct protocol *(`http` recommend)*           |  
| pageLimit   | number  | `0`                       | Limitation of websites to be crawled *(`0` for infinity)*     |  
| screenShots | boolean | `false`                   | if `true` screenshots would be made for each customer website |  
| debug       | boolean | `false`                   | if `true` you get a lot of output for debugging               |

**[back to top](#table-of-contents)**