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
At the moment there are three hooks available:

**1. Search**
```javascript

/**
 * @param $ Return value from "cheerio.load"
 * @param url: {string} The current visited url
 * @param debug: {boolean} Debug mode is on or off.
 */
async function searchCallback($, url, debug) {
  let links = $('a').attr('href^="/"'); // Here you can use the return value from "cheerio".
  console.log(`Found ${links.length} links.`);
  console.log(`Current visiting url is ${url}.`);
  console.log(`Is debug mode enabled? ${debug}`);
}

crawler.setSearchCallback(searchCallback);

```

**2. Screenshot**
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
}

crawler.setScreenshotCallback(screenshotCallback);

```

**3. Output**
```javascript

/**
 * @param reason: {string} Reason for ending crawling process (e.g. reached pageLimit)
 */
async function outputCallback(reason) {
  console.log(reason);
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
This method adds the module to the web crawler so you can use it in the crawler. But remember: it calls `new Module({output, db})`.
```javascript

const {WebCrawler} = require('web-crawler'),
  {SomeModule} = require('some-module');

let crawler = new WebCrawler(__dirname);

crawler.addModule('SomeModule', '/modules/some-module');
crawler.SomeModule.someMethod();

```

#### WebCrawler.setSearchCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.setScreenshotCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.setOutputCallback(callback)
[See "Use callbacks"](#use-callbacks)

#### WebCrawler.crawl(options, logFileName)
*(async function)* This method prepares and starts the crawling process.
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
}

crawler.crawl(options, logFileName);

```

#### DB.insert(object, collection, callback)
Method to insert an object into the mongodb.
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
Method to update an object in the mongodb.
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
Method to insert an object into the mongodb or update if it's already exists.
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
Method to find all objects of a collection in the mongodb.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.db.findAll('foo', function(error, result) {
  if (error) throw error;

  // do something.
});

```

#### DB.find(search, structure, collection, callback)
Method to find some objects in the the mongodb.
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
Method to find an object in the the mongodb.
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
Method to write something into the log file and/or to the console.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.write('I have something to log.', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```

#### Output.writeLine(value, print, type, background)
Method to write something into the log file and/or to the console with a new line before.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeLine('I have something to log.', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```

#### Output.writeWithSpace(value, print, type, background)
Method to write something into the log file and/or to the console with a trailing new line.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeWithSpace('I have something to log.', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```

#### Output.writeConsole(value, type, background)
Method to write something to the console (wont be written into the log file).
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

crawler.output.writeConsole('I have something to log.', true, 'black', 'white');

// Would print this string to the console with font color black and background color white.

```

#### Output.getColor(type, background)
Get colored command line output.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname);

// Would return "\x1b[30m\x1b[47m%s\x1b[0m" to get a colored string:
let colorString = crawler.output.getColor('black', 'white');

console.log(colorString, 'Say something.')

```

#### ScreenShot.doScreenshots(websites, debug, callback)
*(async function)* Do a screenshot for each website that does not has an error.
```javascript

const {WebCrawler} = require('web-crawler');

let crawler = new WebCrawler(__dirname),
// Websites must be an array with website objects
  websites = [
    {
      found_url: 'https://github.com/MisterMarlu', // Url where the screenshot website was found (maybe interesting for portal crawling).
      name: 'Imprint', // Title of the website.
      url: 'http://example.com/imprint', // Url where you want to have a screenshot.
      hasError: false, // The found website can be invalid now or may has a wrong toplevel domain.
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