/**
 * Import modules.
 */
const {Chromeless} = require('chromeless');

/**
 * Constants.
 */
const spinnerText = '%s Waiting for screenshots. ',
  waitTimeout = 3000,
  viewPort = {width: 1920, height: 3500, scale: 1},
  options = {filePath: '/var/www/html/webcrawler/screenshots/'},
  exists = {
    entry: '.enter_buttons a[href="?enter"]',
    popup: '.popup .popup_closebutton'
  },
  wait = {
    entry: 100,
    popup: 1200
  };

/**
 * Module Screenshots.
 */
module.exports = function () {
  // Counter for undone screenshots.
  this.undone = 0;
  this.totalScreenshots = 0;

  /**
   * Do a screenshot for each website that does not has an error.
   *
   * @param websites
   * @param output
   * @param spinner
   * @returns {Promise.<void>}
   */
  this.doScreenshots = async function (websites, output, spinner) {
    this.countUndone(websites);
    let tmpSpinner = null;
    let stAdd = '';

    for (let i = 0; i < websites.length; i += 1) {
      if (!websites[i].hasError) {
        stAdd = ' (' + this.undone + ' screenshot' + ((this.undone === 1) ? '' : 's') + ' remaining)';
        tmpSpinner = new spinner(spinnerText + stAdd);
        tmpSpinner.start();
        // Do the screenshot.
        await this.screenshotting(websites[i], output);
        tmpSpinner.stop(true);
      }
    }
  };

  /**
   * So a screenshot from a specific website.
   *
   * @param website
   * @param output
   * @returns {Promise.<void>}
   */
  this.screenshotting = async function (website, output) {
    const chromeless = new Chromeless({waitTimeout});
    let name = this.getScreenshotName(website.website, website.imprint),
      url = 'http://' + website.website,
      screenshot = '',
      entry = false,
      popup = false,
      screenshotOptions = {
        filePath: options.filePath + name + '.png'
      };

    try {
      entry = await chromeless
        .goto(url)
        .exists(exists.entry);
    } catch (error) {
      console.log(`Unable to check for enter button (url: ${url})`);
      console.log(error);
    }

    if (entry) {
      try {
        popup = await chromeless
          .goto(url)
          .exists(exists.popup);
      } catch (error) {
        console.log(`Unable to check for popup (url: ${url})`);
        console.log(error);
      }
    }

    if (!entry && !popup) {
      try {
        screenshot = await chromeless
          .goto(url)
          .scrollTo(0, viewPort.height)
          .setViewport(viewPort)
          .screenshot(screenshotOptions);
      } catch (error) {
        console.log(`Unable to do screenshots - Part 1 (url: ${url})`);
        console.log(error);
      }
    }

    if (entry && !popup) {
      try {
        screenshot = await chromeless
          .goto(url)
          .click(exists.entry)
          .wait(wait.entry)
          .scrollTo(0, viewPort.height)
          .setViewport(viewPort)
          .screenshot(screenshotOptions);
      } catch (error) {
        console.log(`Unable to do screenshots - Part 2 (url: ${url})`);
        console.log(error);
      }
    }

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
          .screenshot(screenshotOptions);
      } catch (error) {
        console.log(`Unable to do screenshots - Part 3 (url: ${url})`);
        console.log(error);
      }
    }

    await chromeless.end();
    output.write(`Added screenshot ${screenshot}`);
    this.decreaseUndone();

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

      await this.screenshotting(tmpWebsite, output);
    }
  };

  /**
   * Get name for this screenshot.
   *
   * @param website: {string}
   * @param isImprint
   * @returns {string}
   */
  this.getScreenshotName = function (website, isImprint) {
    if (typeof isImprint !== 'boolean') isImprint = false;

    website = website.split('.');
    let name = (website[0] === 'www') ? website[1] : website[0];

    if (isImprint) name = `imprint.${name}`;

    return name;
  };

  /**
   * Count websites without screenshots.
   *
   * @param websites
   * @returns {number}
   */
  this.countUndone = function (websites) {
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
   * Decreases the number of undone screenshots.
   */
  this.decreaseUndone = function () {
    this.undone -= 1;

    if (this.undone <= 0) this.undone = 0;
  };

  return this;
};