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

/**
 * Module customerInfo
 *
 * @returns {module}
 */
module.exports = function () {
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
        output.write(error, ((typeof error === 'string') ? true : debug), 'warning');

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