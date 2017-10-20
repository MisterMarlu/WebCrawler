/**
 * Add to js functions.
 */
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

/**
 * Import modules.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns');
const {Chromeless} = require('chromeless');

/**
 * Module customerInfo
 *
 * @returns {module}
 */
module.exports = function () {
  this.numScreenshots = 0;
  this.chromeless = new Chromeless({waitTimeout: 1000});

  /**
   * Check if site can have a customer website.
   *
   * @param url: {string}
   * @param search?: {string}
   */
  this.canHaveWebsite = function (url, search) {
    search = (typeof search === 'undefined') ? 'sex-anzeigen' : search;
    return (url.toLowerCase().includes(search.toLowerCase()));
  };

  /**
   * Set customer information.
   *
   * @param url: {string}
   * @param $
   * @param customers: {}
   * @param output
   * @param debug: {boolean}
   */
  this.setCustomer = function (url, $, customers, output, debug) {
    var customerPage = $('.icon_url_text').find('a').attr('href');
    var i = {
      with: customers.withWebsite.length,
      without: customers.withoutWebsite.length
    };

    if (typeof customerPage === 'undefined') {
      customers.withoutWebsite[i.without] = url;
      output.write('Found customer without website: ' + url, debug, 'success');
      return;
    }

    // Make the request to customer's website.
    this.requestCustomerPage(customerPage, url, customers, i.with, output, debug);
  };

  /**
   * Requesting to customers page via  http and https.
   *
   * @param website: {string}
   * @param url: {string}
   * @param customers: {}
   * @param i: {int}
   * @param output
   * @param debug: {boolean}
   */
  this.requestCustomerPage = function (website, url, customers, i, output, debug) {
    var self = this;

    axios.get(website)
      .then(function (response) {
        if (response.status !== 200) {
          return;
        }

        // Read and check website.
        var $ = cheerio.load(response.data);
        self.setCustomerSettings(customers, i, url, website, $, output, debug);
      })
      .catch(function (error) {
        output.writeLine('Error when try to visit customer page: ' + website, true, 'warning');
        if (debug) {
          console.log(error);
        }

        if (website.substr(0, 5) !== 'https') {
          output.writeWithSpace('Try now to visit customer page with https.', true, 'warning');
          website = website.splice(4, 0, 's'); // http -> https
          self.requestCustomerPage(website, url, customers, i, output, debug);
          return;
        }

        customers.withWebsite[i] = {
          url: url,
          website: website,
          rto: false,
          hasError: true
        };
      });
  };

  /**
   * Set information about a customer's website (if there is a website).
   *
   * Function must be an asynchronous function to be able to use the keyword await.
   *
   * @param customers: {}
   * @param i: {int}
   * @param url: {string}
   * @param website: {string}
   * @param $
   * @param output
   * @param debug: {boolean}
   */
  this.setCustomerSettings = async function (customers, i, url, website, $, output, debug) {
    var self = this;
    var links = $('a[href]');
    var imprintLink = '';
    var rto = false;
    website = self.removeUrlProtocol(website);

    // Search for imprint link.
    links.each(function () {
      if ($(this).attr('href').toLowerCase().includes('impressum')) {
        imprintLink = self.fullLink($(this).attr('href'), website);
      }
    });

    // Search for heartbeat or rto.
    $('*').contents().each(function () {
      if (!rto) {
        rto = self.searchForRto(this, $, rto);
      }
    });

    if (!rto) {
      // Check ip address and imprint for rto. Using the keyword await to get return value
      // from asynchronous function.
      rto = await self.searchForRtoRequest(rto, website);
    }

    var exists = false;
    for (var j = 0; j < customers.withWebsite.length; j += 1) {
      if (customers.withWebsite[j].website === website) {
        exists = true;
      }
    }

    if (!exists) {
      var rtoString = (rto) ? 'RTO' : 'other';
      output.write('Found customer with ' + rtoString + ' website: ' + website, debug, 'success');
      this.numScreenshots += 1;

      if (imprintLink.length > website.length) {
        this.numScreenshots += 1;
      }

      customers.withWebsite[i] = {
        url: url,
        website: website,
        imprint: imprintLink,
        rto: rto,
        hasError: false
      };
    }
  };

  /**
   * Removes "http://" and "https://" from website.
   *
   * @param website: {string}
   * @returns {string}
   */
  this.removeUrlProtocol = function (website) {
    // Remove "http".
    website = website.slice(4, website.length);

    // Remove "s" when it was "https".
    if (website.substr(0, 1) === 's') {
      website = website.slice(1, website.length);
    }

    // Remove "://" from "http://".
    return website.slice(3, website.length);
  };

  /**
   * Checks every node type for heartbeat or rto.
   *
   * @param contents
   * @param $
   * @param isRto: {boolean}
   * @returns {boolean}
   */
  this.searchForRto = function (contents, $, isRto) {
    // If isRto is already true, don't try to set true again.
    if (isRto) {
      return true;
    }

    // Check for heartbeat.
    if (!isRto) {
      if (contents.nodeType === contents.COMMENT_NODE) {
        if (typeof contents.nodeValue === 'string' && contents.nodeValue.includes('heartbeat')) {
          return true;
        }
      }
    }

    // Check in meta (publisher === 'rto').
    if (!isRto) {
      var metaTag = $("meta[name='publisher']");
      if (typeof metaTag !== 'undefined' && typeof metaTag.attr('content') !== 'undefined') {
        if (metaTag.attr('content').toLowerCase().includes('rto')) {
          return true;
        }
      }
    }

    return isRto;
  };

  /**
   * Checks website ip address and imprint (if it's given).
   *
   * Imprint would not be checked. ToDo: Implement imprint checking.
   *
   * @param isRto: {boolean}
   * @param website: {string}
   * @returns {boolean}
   */
  this.searchForRtoRequest = function (isRto, website) {
    if (isRto) {
      return true;
    }

    // Check if rto is hosting customer's website.
    if (!isRto) {
      dns.lookup('www.rto.de', function (rtoError, rtoAddress, rtoFamily) {
        if (rtoError) {
          return;
        }

        dns.lookup(website, function (error, address, family) {
          if (error) {
            return;
          }

          if (rtoAddress === address) {
            isRto = true;
            return true;
          }
        });
      });
    }

    // Check in imprint.
    if (!isRto) {
      // Searching for imprint with own request.
    }

    return isRto;
  };

  this.doScreenshots = async function (websites, output) {
    for (var i = 0; i < websites.length; i += 1) {
      var website = websites[i];
      var screenshot = await this.screenshotting(website, output).catch(this.screenshotCatch());
      output.write('Added screenshot: ' + screenshot, false);
    }
  };

  this.screenshotting = async function (website, output) {
    var name = this.getScreenshotName(website.website, website.imprint);
    var url = 'http://' + website.website;
    var viewPort = {width: 1920, height: 3500, scale: 1};
    var screenshotOptions = {filePath: `/var/www/html/webcrawler/screenshots/${name}.png`};
    var screenshot = '';

    await this.chromeless.clearCache();
    var entry = await this.chromeless
      .goto(url)
      .exists('.enter_buttons a[href="?enter"]')
      .catch(this.screenshotCatch());
    entry = (typeof entry !== 'undefined');
    var popup = false;

    if (entry)  {
      popup = await this.chromeless
        .goto(url)
        .exists('.popup .popup_closebutton')
        .catch(this.screenshotCatch());
    }

    if (!entry) {
      screenshot = await this.chromeless
        .goto(url)
        .setViewport(viewPort)
        .screenshot(screenshotOptions)
        .catch(this.screenshotCatch(true));
    }

    if (entry && (typeof popup === 'undefined' || !popup)) {
      screenshot = await this.chromeless
        .goto(url)
        .click('.enter_buttons a[href="?enter"]')
        .wait(100)
        .setViewport(viewPort)
        .screenshot(screenshotOptions)
        .catch(console.error.bind(console));
    }

    if (entry && popup) {
      screenshot = await this.chromeless
        .goto(url)
        .click('.enter_buttons a[href="?enter"]')
        .wait(100)
        .click('.close_popupbutton')
        .wait(1200)
        .setViewport(viewPort)
        .screenshot(screenshotOptions)
        .catch(console.error.bind(console));
    }

    await this.chromeless.end();

    if (website.hasOwnProperty('imprint') && website.imprint.length > website.website.length) {
      var tmpWebsite = {};
      for (var key in website) {
        if (website.hasOwnProperty(key) && key !== 'imprint') {
          tmpWebsite[key] = website[key];
        }

        if (key === 'website') {
          tmpWebsite.website = website.imprint;
        }
      }

      var impScreen = await this.screenshotting(tmpWebsite, output)
        .catch(console.error.bind(console));
      output.write('Added imprint screenshot: ' + impScreen);
    }

    return screenshot;
  };

  this.getScreenshotName = function (website, isImprint) {
    if (typeof isImprint === 'undefined' || typeof isImprint === 'string') {
      isImprint = false;
    }

    var websiteArray = website.split('.');
    var name = (websiteArray[0] === 'www') ? websiteArray[1] : websiteArray[0];

    if (isImprint) {
      name += '_imprint';
    }

    return name;
  };

  /**
   * Get the full url of the imprint.
   *
   * @param link: {string}
   * @param base: {string}
   * @returns {string}
   */
  this.fullLink = function (link, base) {
    if (link.substr(0, 4) === 'http' || link.substr(0, 3) === 'www') {
      return link;
    }

    if (link.substr(0, 1) === '/') {
      if (base.substr((base.length - 1), 1) === '/') {
        base = base.substr(base.length, -1);
      }

      return base + link;
    }


    if (base.substr((base.length - 1), 1) !== '/') {
      base += '/';
    }

    return base + link;
  };

  return this;
};