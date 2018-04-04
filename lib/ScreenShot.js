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
  {spawn, execSync} = require('child_process'),
  axios = require('axios'),

  // Import custom modules.
  Helper = require(`${__dirname}/Helper`),
  Spinner = require(`${__dirname}/Spinner`),
  Global = require(`${__dirname}/Global`),
  Parser = require(`${__dirname}/Parser`),
  BaseModule = require(`${__dirname}/BaseModule`);

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
   * Kill all Google Chrome processes.
   */
  stopChrome() {
    // Debugging line.
    Helper.printDebugLine(this.stopChrome, __filename, __line);

    // pids -> process identifiers.
    let pids = [];

    try {
      // Grep all processes from chrome.
      let tmp = execSync('pgrep chrome');
      tmp = tmp.toString();
      pids = tmp.split("\n");
      pids.pop();
    } catch (e) {
      // No catching.
    }

    // Execute the command "pkill chrome" to kill all chrome processes.
    if (pids.length > 0) execSync('pkill chrome');
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
  doScreenshots(websites, callback) {
    // Debugging line.
    Helper.printDebugLine(this.doScreenshots, __filename, __line);

    // Count how much screenshots we should create.
    this.countUndone(websites);
    // Increase the listeners to the total screenshots that should be done.
    process.setMaxListeners(this.total);

    let start = new Date(),
      chromeArgs = [
        '--headless',
        '--hide-scrollbars',
        '--remote-debugging-port=9222',
        '--disable-gpu'
      ];

    // The user "root" have to use an additional argument for Google Chrome.
    if (require("os").userInfo().username === 'root') chromeArgs.push('--no-sandbox');

    // Start server side Google Chrome without any graphical user interface (GUI).
    let chrome = spawn('google-chrome-stable', chromeArgs);

    return new Promise((resolve, reject) => {
      // Need this timeout to get chrome time to start.
      setTimeout(() => {
        // Iterate through the websites and create screenshots.
        this.iterateWebsites(websites, callback).then(() => {
          // Stop server side Google Chrome.
          chrome.kill('SIGINT');

          let time = new Date() - start,
            t = Parser.parseTime(time),
            read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;

          resolve({
            time,
            timeString: `Time for screenshotting: ${read}`,
            done: this.done,
            undone: this.undone,
            total: this.total
          });
        }).catch(error => {
          reject(error);
        });
      }, 1000);
    });
  }

  /**
   * Iterate through the websites to create screenshots asynchronously.
   *
   * @async
   * @param {object[]} websites An array with objects that stores website information.
   * @param {string} websites[].url The url to a website without the protocol.
   * @param {boolean} websites[].has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} websites[].name Name of the website, e.g. "imprint" or "home".
   * @param {string} websites[].found_url The url where the website was found.
   * @param {function} callback A callback that will be called in another method.
   * @param {number} [i=0] The increment of the websites.
   * @returns {Promise} Returns an empty Promise object.
   */
  iterateWebsites(websites, callback, i = 0) {
    return new Promise((resolve, reject) => {
      // No more websites? Ok, we're done, finally.
      if (!websites[i] || typeof websites[i] === 'undefined') {
        resolve();
        return;
      }

      let website = websites[i];
      // No screenshots for websites with an error. Try the next website.
      if (website.has_error) {
        this.iterateWebsites(websites, callback, i + 1).then(() => {
          resolve();
        }).catch(error => {
          reject(error);
        });
        return;
      }

      // Iterate the dimensions for the websites.
      this.iterateDimensions(website, websites, i, callback).then(() => {
        this.iterateWebsites(websites, callback, i + 1).then(() => {
          resolve();
        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * Iterate through the dimensions to create screenshots asynchronously.
   *
   * @async
   * @param {object} website An object that stores website information.
   * @param {string} website.url The url to a website without the protocol.
   * @param {boolean} website.has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} website.name Name of the website, e.g. "imprint" or "home".
   * @param {string} website.found_url The url where the website was found.
   * @param {object[]} websites An array with objects that stores website information.
   * @param {string} websites[].url The url to a website without the protocol.
   * @param {boolean} websites[].has_error Has the website an error? (Like 404, 500, etc.)
   * @param {string} websites[].name Name of the website, e.g. "imprint" or "home".
   * @param {string} websites[].found_url The url where the website was found.
   * @param {number} i The increment of the websites.
   * @param {function} callback A callback that will be called in another method.
   * @param {number} [j=0] The increment of the dimensions.
   * @returns {Promise} Returns an empty Promise object.
   */
  iterateDimensions(website, websites, i, callback, j = 0) {
    let strAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`,
      tmpSpinner = new Spinner(spinnerText + strAdd);

    // Start the updated spinner so the user know how much screenshots to do.
    tmpSpinner.start();

    return new Promise((resolve, reject) => {
      // No more dimension? Ok, next website.
      if (!this.dimensions[j]) {
        tmpSpinner.stop(true);
        resolve();
        return;
      }

      // Check if the url is valid and create a screenshot.
      this.checkUrl(website.url, website, j, callback).then(() => {
        // Screenshot done, stop the spinner and continue with the next dimension.
        tmpSpinner.stop(true);
        this.iterateDimensions(website, websites, i, callback, j + 1).then(() => {
          resolve();
        }).catch(error => {
          reject(error);
        });
      }).catch(error => {
        reject(error);
      });
    });
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
  checkUrl(url, website, dimIndex, callback) {
    // Debugging line.
    Helper.printDebugLine(this.checkUrl, __filename, __line);

    // Change http to https.
    if (url.substr(0, 4) === 'http' && url.substr(0, 5) !== 'https') {
      url = url.splice(4, 0, 's'); // http -> https
    }

    // Add the protocol http.
    if (url.substr(0, 4) !== 'http') {
      url = 'http://' + url;
    }

    return new Promise((resolve, reject) => {
      // Request the website to check if it's a valid url.
      axios.get(url).then(response => {
        // Why should it be correct and incorrect at the same time?
        if (response.status !== 200) throw 'HTTP response is not ok';

        // Create the screenshot.
        this.screenshotting(website, dimIndex, callback).then(() => {
          this.decreaseUndone();
          resolve();
        }).catch(error => {
          reject(error);
        });
      }).catch(async error => {
        // If the protocol was https try again with http.
        if (url.substr(0, 5) !== 'https') {
          this.checkUrl(url, website, dimIndex, callback).then(() => {
            resolve();
          }).catch(error => {
            reject(error);
          });
          return;
        }

        // There must be a problem with this url. We cannot visit it.
        this.output.write(`Invalid url; ${url}`, Helper.isDebug(moduleName), 'warning');
        this.decreaseUndone();
        resolve();
      });
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
    Helper.printDebugLine(this.screenshotting, __filename, __line);

    // Create a new chromeless instance with the predefined arguments.
    const chromeless = new Chromeless(this.chromeless);

    let name = this.getScreenshotName(website.url, website.name, dimIndex),
      url = `http://${website.url}`,
      elements = [],
      waitings = [],
      screenshotOptions = {
        // Chromeless can only create .png images (v1.5.0).
        filePath: `${this.screenshot.filePath}${name}.png`,
      };

    // Parse the dimensions into an integer.
    this.dimensions[dimIndex].scale = 1;
    for (let key in this.dimensions[dimIndex]) {
      if (this.dimensions[dimIndex].hasOwnProperty(key)) {
        this.dimensions[dimIndex][key] = parseInt(this.dimensions[dimIndex][key]);
      }
    }

    // Check which elements exists.
    for (let i = 0; i < this.clicks.length; i += 1) {
      try {
        let tmpElement = await chromeless
          .goto(url)
          .wait(this.clicks[i].waitings.before)
          .exists(this.clicks[i].element);

        if (tmpElement) {
          elements.push(this.clicks[i].element);
          waitings.push(this.clicks[i].waitings);
        }
      } catch (e) {
        this.output.write(`Unable to check element ${this.clicks[i].element}`, true, 'warning');
      }
    }

    // Visit the url and set the viewport.
    try {
      await chromeless
        .goto(url)
        .setViewport(this.dimensions[dimIndex]);
    } catch (e) {
      this.output.write(`Unable to visit website ${url}`, true, 'warning');
      return;
    }

    // Click on the existing elements.
    for (let i = 0; i < elements.length; i += 1) {
      try {
        await chromeless
          .wait(waitings[i].before)
          .click(elements[i])
          .wait(waitings[i].after);
      } catch (e) {
        this.output.write(`Unable to click the element ${elements[i]}`, true, 'warning');
        return;
      }
    }

    // I have to initiate the variable "screenshot" here to prevent errors.
    let screenshot = '';

    // Create the screenshot.
    try {
      screenshot = await chromeless
        .wait(2000)
        .screenshot(screenshotOptions);

      await chromeless.end();
      this.done += 1;
    } catch (e) {
      this.output.write(`Unable to create screenshot ${name}`, true, 'warning');
      return;
    }

    // Do not try to save an empty screenshot.
    if (screenshot === '') return;

    // Insert or update the screenshot.
    let filter = {name: `${name}.png`},
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

      this.db.save(filter, update, 'screenshots').then(result => {
        this.output.write(`Added / updated screenshot (${this.done}) ${screenshot}`);
        callback(update.url);
      }).catch(error => {
        console.log(error);
      });
    } else {
      this.db.findOne(findDimension, 'screenshot_dimensions').then(result => {
        update.screenshot_dimension_id = result.id;

        this.db.save(filter, update, 'screenshots').then(result => {
          this.output.write(`Added / updated screenshot (${this.done}) ${screenshot}`);
          callback(update.url);
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
    Helper.printDebugLine(this.getScreenshotName, __filename, __line);

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
    Helper.printDebugLine(this.decreaseUndone, __filename, __line);

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
    Helper.printDebugLine(this.countUndone, __filename, __line);

    this.undone = 0;

    for (let i = 0; i < websites.length; i += 1) {
      // Don't count websites with an error.
      if (!websites[i].has_error) this.undone += 1;
    }

    this.undone *= this.dimensions.length;
    this.total = this.undone;
  }
}

module.exports = ScreenShot;