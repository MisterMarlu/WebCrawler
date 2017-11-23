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
  "default": {
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

Okay, now step for step: There are some available configurations in each module of the web crawler, first default:

  
**default.connString**
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
  webcrawler.startCrawling();
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
 * @param commands: {{startUrl: string, pageLimit: int, screenShots: boolean, debug: boolean|string}} Object of commands that you can get the script.
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

#### WebCrawler.startCrawling()
*(async function)* Start the crawling process.  
Example:
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

function initCallback(webcrawler, options) {
  webcrawler.startCrawling();
}

crawler.setInitCallback(initCallback);
crawler.crawl(options, logFileName);

```
#### DB.insert(object, collection, callback)
Insert new data into mongodb.  
**object: {{}}**  
**collection: {string}**  
**callback: {function}**  
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
**callback?: {function}**
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

crawler.screenshots.doScreenshots(websites, callbackAfterEachScreenshot);

```

**[back to top](#table-of-contents)**

### Available parameters
You can call your script with
```
node script.js --startUrl="https://github.com" --pageLimit=100 --screenShots=true --debug=Crawler
```

Here you can see all available parameters:

| Parameter   | Type             | Default                   | Description                                                                |
| ----------- | ---------------- | ------------------------- | -------------------------------------------------------------------------- |
| startUrl    | string           | `https://www.phpdoc.org/` | Full url with correct protocol *(`http` recommend)*                        |
| pageLimit   | number           | `0`                       | Limitation of websites to be crawled *(`0` for infinity)*                  |
| screenShots | boolean          | `false`                   | If `true` screenshots would be made for each customer website              |
| debug       | boolean / string | `false`                   | If `true` you get a lot of output for debugging. You can add a module name |

**[back to top](#table-of-contents)**