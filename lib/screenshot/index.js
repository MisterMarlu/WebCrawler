/**
 * Import modules.
 */
const {Chromeless} = require('chromeless');
const Spinner = require('cli-spinner').Spinner;

/**
 * Import custom modules.
 */
const Output = require('../output').Output;
const Crawler = require('../crawler').Crawler;

/**
 * Necessary variables.
 */
let output = new Output(),
  crawler = new Crawler(),
  instance = {};

/**
 * Constants.
 */
const spinnerText = '%s Waiting for screenshots. ',
  waitTimeout = 3000,
  viewPort = {width: 1920, height: 3500, scale: 1},
  options = {filePath: '/var/www/html/webcrawler/screenshots/'},
  exists = {
    entry: 'a[href*="?enter"]',
    popup: '.popup .popup_closebutton'
  },
  wait = {
    entry: 100,
    popup: 1200
  };

/**
 * Screenshot constructor.
 *
 * @returns {Screenshot}
 * @constructor
 */
let Screenshot = function () {
  if (!this instanceof Screenshot) return new Screenshot();
  if (instance instanceof Screenshot) return instance;

  this.undone = 0;
  this.totalScreenshots = 0;
  this.screenshotsDone = 0;
  instance = this;

  return this;
};

/**
 * Do a screenshot for each website that does not has an error.
 *
 * @param websites: {array}
 * @returns {Promise.<void>}
 */
Screenshot.prototype.doScreenshots = async function (websites) {
  this.countUndone(websites);
  let tmpSpinner = null,
    stAdd = '',
    start = new Date();

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      stAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
      tmpSpinner = new Spinner(spinnerText + stAdd);
      tmpSpinner.start();
      // Do the screenshot.
      await this.screenshotting(websites[i]);
      tmpSpinner.stop(true);
    }
  }

  let t = crawler.parseTime((new Date() - start));
  let read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;
  console.log(`Time for screenshotting: ${read}`);
};

/**
 * Do a screenshot from a specific website.
 *
 * @param website: {{url: string,
 *    website: string,
 *    imprint: website || boolean,
 *    rto: boolean,
 *    hasError: boolean}}
 * @returns {Promise.<void>}
 */
Screenshot.prototype.screenshotting = async function (website) {
  const chromeless = new Chromeless({waitTimeout});
  let name = this.getScreenshotName(website.website, website.imprint),
    url = 'http://' + website.website,
    screenshot = '',
    entry = false,
    popup = false,
    screenshotOptions = {
      filePath: options.filePath + name + '.png'
    };

  // Check if entry exists.
  try {
    entry = await chromeless
      .goto(url)
      .exists(exists.entry);
  } catch (error) {
    output.write(`Unable to check for enter button (url: ${url})`, true, 'error');
    console.log(error);
  }

  // If entry exists try if popup exists.
  if (entry) {
    try {
      popup = await chromeless
        .goto(url)
        .exists(exists.popup);
    } catch (error) {
      output.write(`Unable to check for popup (url: ${url})`, true, 'error');
      console.log(error);
    }
  }

  // If there is no entry and no popup do a screenshot.
  if (!entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .scrollTo(0, viewPort.height)
        .setViewport(viewPort)
        .wait(2000) // For Websites with transitions.
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 1 (url: ${url})`, true, 'error');
      console.log(error);
    }
  }

  // If there is an entry do a screenshot with clicking entry before.
  if (entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .click(exists.entry)
        .wait(wait.entry)
        .scrollTo(0, viewPort.height)
        .setViewport(viewPort)
        .wait(2000) // For Websites with transitions.
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 2 (url: ${url})`, true, 'error');
      console.log(error);
    }
  }

  // If there are entry and popup do a screenshot after clicking on entry and popup.
  if (entry && popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .click(exists.entry)
        .wait(wait.entry)
        .click(exists.popup)
        .wait(wait.popup)
        .scrollTo(0, viewPort.height)
        .setViewport(viewPort)
        .wait(2000) // For Websites with transitions.
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 3 (url: ${url})`, true, 'error');
      console.log(error);
    }
  }

  await chromeless.end();
  this.screenshotsDone += 1;
  output.write(`Added screenshot (${this.screenshotsDone}) ${screenshot}`);
  this.decreaseUndone();

  // If the website has an imprint do a screenshot.
  if (website.hasOwnProperty('imprint') && website.imprint.length > website.website.length) {
    let tmpWebsite = {imprint: true};

    for (let key in website) {
      if (website.hasOwnProperty(key) && key !== 'imprint' && key !== 'website') {
        tmpWebsite[key] = website[key];
      }

      if (key === 'website') {
        tmpWebsite.website = website.imprint;
      }
    }

    await this.screenshotting(tmpWebsite);
  }
};

/**
 * Get name for this screenshot.
 *
 * @param website: {string}
 * @param isImprint?: {boolean}
 * @returns {string}
 */
Screenshot.prototype.getScreenshotName = function (website, isImprint) {
  if (typeof isImprint !== 'boolean') isImprint = false;

  website = website.split('.');
  let name = (website[0] === 'www') ? website[1] : website[0];

  if (isImprint) name = `imprint.${name}`;

  return name;
};

/**
 * Count websites without screenshot.
 *
 * @param websites: {array}
 * @returns {number}
 */
Screenshot.prototype.countUndone = function (websites) {
  this.undone = 0;

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      this.undone += 1;

      if (websites[i].imprint > websites[i].website) {
        this.undone += 1;
      }
    }
  }

  this.totalScreenshots = this.undone;

  return this.undone;
};

/**
 * Decrease the number of undone screenshots.
 */
Screenshot.prototype.decreaseUndone = function () {
  this.undone -= 1;

  if (this.undone <= 0) this.undone = 0;
};

exports.Screenshot = Screenshot;