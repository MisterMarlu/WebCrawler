require(`${__dirname}/debugging`);

if (!String.prototype.splice) {
  /**
   * The splice() method changes the content of a string by removing a range of
   * characters and/or adding new characters.
   *
   * @this {String}
   * @param {number} start Index at which to start changing the string.
   * @param {number} delCount An integer indicating the number of old chars to remove.
   * @param {string} newSubStr The String that is spliced in.
   * @return {string} A new string with the spliced substring.
   */
  String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
  };
}

// Import modules.
const {Chromeless} = require('chromeless'),
  {Spinner} = require('cli-spinner'),
  {spawn, exec} = require('child_process'),
  axios = require('axios'),

  // Import custom modules.
  {Helper} = require(`${__dirname}/Helper`),
  {Global} = require(`${__dirname}/Global`),
  {Parser} = require(`${__dirname}/Parser`),
  {BaseModule} = require(`${__dirname}/BaseModule`);

let instance = null,
  moduleName = Parser.getModuleName(__filename),
  spinnerText = '%s Waiting for screenshots. ';

/**
 * This class can create screenshots.
 *
 * @extends BaseModule
 * @returns {ScreenShot} Returns the ScreenShot instance.
 */
class ScreenShot extends BaseModule {

  /**
   * @see ScreenShot
   */
  constructor(options) {
    // Constructor of the super class.
    super(options);

    // The class ScreenShot is a singleton class.
    if (instance instanceof ScreenShot) return instance;
    if (!(this instanceof ScreenShot)) return new ScreenShot();

    Global.set('screenshots', []);
    this.chromeless = {};
    this.screenshot = {};
    this.undone = 0;
    this.total = 0;
    this.done = 0;
    this.clicks = [];
    this.dimensions = [];

    instance = this;
    return this;
  }

  /**
   * Load all screenshots from the database into the class Global.
   */
  init() {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.init, __filename, __line);

    this.db.findAll('screenshots').then(result => {
      for (let i = 0; i < result.length; i += 1) {
        Global.get('screenshots').push(result[i].name);
      }
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Kill all Google Chrome processes.
   *
   * @param {function} [callback=] A callback that would be called when the process will be killed.
   */
  stopChrome(callback = (err, stdout, stderr) => {
  }) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.stopChrome, __filename, __line);

    // Execute the command "pkill chrome" to kill all chrome processes.
    exec('pkill chrome', (err, stdout, stderr) => {
      // Debugging line.
      if (err) this.output.writeConsole(`exec error: ${err}`, Helper.isDebug(moduleName), 'warning');

      callback(err, stdout, stderr);
    });
  }

  /**
   * Create a screenshot for each website that does not has an error.
   *
   * @async
   * @param {object[]} websites An array with objects that stores website information.
   * @param {string} websites[].url The url to a website without the protocol.
   * @param {boolean} websites[].has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} websites[].name Name of the website, e.g. "imprint" or "home".
   * @param {string} websites[].found_url The url where the website was found.
   * @param {function} callback A callback that will be called in another method.
   * @returns {Promise} Promise object represents an object of time, timeString, done, undone and total screenshots.
   */
  async doScreenshots(websites, callback) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.doScreenshots, __filename, __line);

    this.countUndone(websites);
    // Increase the listeners to the total screenshots that should be done.
    process.setMaxListeners(this.total);

    let tmpSpinner = null,
      strAdd = '',
      start = new Date(),
      chromeArgs = [
        '--headless',
        '--hide-scrollbars',
        '--remote-debugging-port=9222',
        '--disable-gpu'
      ];

    // The user "root" have to use an additional argument for Google Chrome.
    if (require("os").userInfo().username === 'root') chromeArgs.push('--no-sandbox');

    // Start server side Google Chrome.
    let chrome = spawn('google-chrome-stable', chromeArgs);

    // Iterate through the websites.
    for (let i = 0; i < websites.length; i += 1) {
      // Don't try to do screenshots of websites with errors to prevent breaking chromeless and this script.
      if (websites[i].has_error) continue;

      // Create a screenshot in each dimension.
      for (let j = 0; j < this.dimensions.length; j += 1) {
        strAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
        tmpSpinner = new Spinner(spinnerText + strAdd);
        tmpSpinner.start();

        // Check the url to create a screenshot.
        await this.checkUrl(websites[i].url, websites[i], j, callback);
        tmpSpinner.stop(true);
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
  }

  /**
   * Check if the url is accessible.
   *
   * @async
   * @param {string} url The url where the screenshot should be done.
   * @param {object} website An object that stores the website information.
   * @param {string} website.url The url to a website without the protocol.
   * @param {boolean} website.has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} website.name Name of the website, e.g. "imprint" or "home".
   * @param {string} website.found_url The url where the website was found.
   * @param {number} dimIndex The index of the current used dimension.
   * @param {function} callback A callback function that would be called in another method.
   * @returns {Promise} Returns an empty Promise object.
   */
  async checkUrl(url, website, dimIndex, callback) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.checkUrl, __filename, __line);

    // Change http to https.
    if (url.substr(0, 4) === 'http' && url.substr(0, 5) !== 'https') {
      url = url.splice(4, 0, 's'); // http -> https
    }

    // Add the protocol http.
    if (url.substr(0, 4) !== 'http') {
      url = 'http://' + url;
    }

    // Request the website to check if it's a valid url.
    await axios.get(url).then(async response => {
      // Why should it be correct and incorrect at the same time?
      if (response.status !== 200) throw 'HTTP response is not ok';

      // Create the screenshot.
      await this.screenshotting(website, dimIndex, callback);
      this.decreaseUndone();
    }).catch(async error => {
      // If the protocol was https try again with http.
      if (url.substr(0, 5) !== 'https') {
        await this.checkUrl(url, website, dimIndex, callback);
        return;
      }

      // There must be a problem with this url. We cannot visit it.
      this.output.write(`Invalid url; ${url}`, Helper.isDebug(moduleName), 'warning');
      this.decreaseUndone();
    });
  }

  /**
   * Create a screenshot from a specific website.
   *
   * @async
   * @param {object} website An object that stores the website information.
   * @param {string} website.url The url to a website without the protocol.
   * @param {boolean} website.has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} website.name Name of the website, e.g. "imprint" or "home".
   * @param {string} website.found_url The url where the website was found.
   * @param {number} dimIndex The index of the current used dimension.
   * @param {function} callback This callback would be called when the screenshot was saved.
   * @returns {Promise} Returns an empty Promise object.
   */
  async screenshotting(website, dimIndex, callback) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.screenshotting, __filename, __line);

    // Create a new chromeless instance.
    const chromeless = new Chromeless(this.chromeless);

    let name = this.getScreenshotName(website.url, website.name, dimIndex),
      url = `http://${website.url}`,
      elements = [],
      waitings = [],
      screenshotOptions = {
        filePath: `${this.screenshot.filePath}${name}.png`,
      },
      insert = false;

    // Check if there is already a screenshot like that.
    if (Global.get('screenshots').indexOf(`${name}.png`) === -1) {
      Global.get('screenshots').push(`${name}.png`);
      insert = true;
    }

    // Parse the dimensions into an integer.
    this.dimensions[dimIndex].scale = 1;
    for (let key in this.dimensions[dimIndex]) {
      if (this.dimensions[dimIndex].hasOwnProperty(key)) {
        this.dimensions[dimIndex][key] = parseInt(this.dimensions[dimIndex][key]);
      }
    }

    // Check which elements exists.
    for (let i = 0; i < this.clicks.length; i += 1) {
      let tmpElement = await chromeless
        .goto(url)
        .wait(this.clicks[i].waitings.before)
        .exists(this.clicks[i].element);

      if (tmpElement) {
        elements.push(this.clicks[i].element);
        waitings.push(this.clicks[i].waitings);
      }
    }

    // Visit the url and set the viewport.
    await chromeless
      .goto(url)
      .setViewport(this.dimensions[dimIndex]);

    // Click the existing elements.
    for (let i = 0; i < elements.length; i += 1) {
      await chromeless
        .wait(waitings[i].before)
        .click(elements[i])
        .wait(waitings[i].after);
    }

    // Create the screenshot.
    let screenshot = await chromeless
      .wait(2000)
      .screenshot(screenshotOptions);

    await chromeless.end();
    this.done += 1;

    // Insert or update the screenshot.
    let filter = {file_path: screenshot},
      update = {
        url: website.found_url,
        file_path: screenshot,
        name: `${name}.png`,
      },
      findDimension = {
        width: this.dimensions[dimIndex].width,
        height: this.dimensions[dimIndex].height,
      };

    if (Global.get('dbVariant') === 'mongodb') {
      update.width = this.dimensions[dimIndex].width;
      update.height = this.dimensions[dimIndex].height;

      if (insert) {
        this.db.insert(update, 'screenshots').then(result => {
          this.output.write(`Added new screenshot (${this.done}) ${screenshot}`);
          callback(website.found_url);
        }).catch(error => {
          console.log(error);
        });

        return;
      }

      this.db.update(filter, update, 'screenshots').then(result => {
        this.output.write(`Updated screenshot (${this.done}) ${screenshot}`);
        callback(website.found_url);
      }).catch(error => {
        console.log(error);
      });
    } else {
      this.db.findOne(findDimension).then(result => {
        update.screenshot_dimension_id = result.id;

        if (insert) {
          this.db.insert(update, 'screenshots').then(result => {
            this.output.write(`Added new screenshot (${this.done}) ${screenshot}`);
            callback(website.found_url);
          }).catch(error => {
            console.log(error);
          });

          return;
        }

        this.db.update(filter, update, 'screenshots').then(result => {
          this.output.write(`Updated screenshot (${this.done}) ${screenshot}`);
          callback(website.found_url);
        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        console.log(error);
      });
    }
  }

  /**
   * Get the name for this screenshot.
   *
   * @param {string} url The url where the screenshot should be created.
   * @param {string} pageName The name of the website, like "home" or "imprint".
   * @param {number} dimIndex The index of the current used dimension.
   * @returns {string} Returns the generated name for the screenshot.
   */
  getScreenshotName(url, pageName, dimIndex) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.getScreenshotName, __filename, __line);

    // Remove all slashes on the beginning.
    while (url.charAt((url.length - 1)) === '/') {
      url = url.slice(0, -1);
    }

    let urlArray = url.split('/');

    for (let i = 0; i < urlArray.length; i += 1) {
      if (urlArray[i].length > 0) break;
      urlArray.shift();
    }

    let name = urlArray[0];

    if (pageName.length > 0) name = `${pageName}.${name}`;
    name = `${this.dimensions[dimIndex].width}-${this.dimensions[dimIndex].height}.${name}`;

    return name;
  }

  /**
   * Decrease the number of undone screenshots.
   */
  decreaseUndone() {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.decreaseUndone, __filename, __line);

    this.undone -= 1;

    if (this.undone <= 0) this.undone = 0;
  }

  /**
   * Count the number of undone screenshots.
   *
   * @param {object[]} websites An array with objects that stores website information.
   * @param {string} websites[].url The url to a website without the protocol.
   * @param {boolean} websites[].has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} websites[].name Name of the website, e.g. "imprint" or "home".
   * @param {string} websites[].found_url The url where the website was found.
   */
  countUndone(websites) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.countUndone, __filename, __line);

    this.undone = 0;

    for (let i = 0; i < websites.length; i += 1) {
      // Don'c count websites with an error.
      if (!websites[i].has_error) this.undone += 1;
    }

    this.undone *= this.dimensions.length;
    this.total = this.undone;
  }
}

exports.ScreenShot = ScreenShot;