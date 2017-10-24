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
  this.allreadyVisited = [];

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
   * @param starting: {string}
   * @param output
   * @param debug: {boolean}
   */
  this.setCustomer = async function (url, $, customers, starting, output, debug) {
    let customerPage = $('.icon_url_text').find('a').attr('href'),
      i = {
        with: customers.withWebsite.length,
        without: customers.withoutWebsite.length
      };

    if (typeof customerPage === 'undefined') {
      customers.withoutWebsite[i.without] = url;
      output.write('Found customer without website: ' + url, debug, 'success');
      if (this.allreadyVisited.indexOf(url) < 0) {
        this.allreadyVisited.push(url);
      }
      return;
    }

    let tmpWebsite = this.removeUrlProtocol(customerPage);
    if (tmpWebsite.substr(0, 3) === 'www') {
      tmpWebsite = this.trimFront(4, tmpWebsite);
    }

    if (this.fromStartingUrl(tmpWebsite, starting)) {
      this.allreadyVisited.push(tmpWebsite);
    }

    if (this.allreadyVisited.indexOf(tmpWebsite) > -1) {
      return;
    }

    this.allreadyVisited.push(tmpWebsite);

    // Make the request to customer's website.
    this.requestCustomerPage(customerPage, url, customers, i.with, output, debug);
  };

  this.trimFront = function (remove, website) {
    return website.substr(remove, (website.length - remove));
  };

  this.fromStartingUrl = function (website, starting) {
    starting = this.removeUrlProtocol(starting);
    if (starting.substr(0, 3) === 'www') {
      starting = this.trimFront(4, starting);
    }

    return (website.includes(starting));
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
    let self = this;

    axios.get(website)
      .then(function (response) {
        if (response.status !== 200) {
          return;
        }

        // Read and check website.
        let $ = cheerio.load(response.data);
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
    let self = this,
      links = $('a[href]'),
      imprintLink = '',
      rto = false;

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
      rto = await self.searchForRtoRequest(rto, website, imprintLink, output, debug);
    }

    let exists = false;
    for (let j = 0; j < customers.withWebsite.length; j += 1) {
      if (customers.withWebsite[j].website === website) {
        exists = true;
      }
    }

    if (!exists) {
      let rtoString = (rto) ? 'RTO' : 'other';
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
    if (website.substr(0, 4) !== 'http') {
      return website;
    }

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
      // Node type 8 is a comment.
      if (contents.nodeType === 8) {
        if (typeof contents.nodeValue === 'string' && contents.nodeValue.toLowerCase().includes('heartbeat')) {
          isRto = true;
          return isRto;
        }
      }
    }

    // Check in meta (publisher === 'rto').
    if (!isRto) {
      let metaTag = $("meta[name='publisher']");
      if (typeof metaTag !== 'undefined' && typeof metaTag.attr('content') !== 'undefined') {
        if (metaTag.attr('content').toLowerCase().includes('rto')) {
          isRto = true;
          return isRto;
        }
      }
    }

    return isRto;
  };

  /**
   * Checks website ip address and imprint (if it's given).
   *
   * @param isRto: {boolean}
   * @param website: {string}
   * @param imprint: {string}
   * @param output
   * @param debug: {boolean}
   * @returns {boolean}
   */
  this.searchForRtoRequest = function (isRto, website, imprint, output, debug) {
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
            return isRto;
          }
        });
      });
    }

    // Check in imprint.
    if (!isRto && imprint > website) {
      axios.get('http://' + imprint)
        .then(function (response) {
          if (response.status !== 200) {
            return;
          }

          isRto = searchImprint(response);
        })
        .catch(function (error) {
          output.writeLine('Unable to visit customers imprint with http. Trying with https.', true, 'warning');
          output.writeWithSpace('Url: ' + imprint, debug, 'warning');

          axios.get('https://' + imprint)
            .then(function (response) {
              if (response.status !== 200) {
                return;
              }

              isRto = searchImprint(response);
            })
            .catch(function (error) {
              output.write('Unable to visit customers imprint with https.', true, 'warning');
              output.writeWithSpace('Url: ' + imprint, debug, 'warning');
            });
        });
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
    link = this.removeUrlProtocol(link);

    if (link.substr(0, 3) === 'www') {
      return link;
    }

    let linkArray = link.split('.'),
      baseArray = base.split('.'),
      baseIndex = 0;

    if (baseArray[0] === 'www') {
      baseIndex += 1;
    }

    if (linkArray[0] === baseArray[baseIndex]) {
      if (baseIndex === 0) {
        return link;
      }

      link = 'www.' + link;
    }

    if (link.substr(0, 3) === 'www') {
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

/**
 * Search for "rto gmbh".
 *
 * @param response
 * @returns {boolean}
 */
function searchImprint(response) {
  let $ = cheerio.load(response.data);
  $('*').contents().each(function () {
    if (typeof this.nodeValue === 'string' && this.nodeValue.toLowerCase().includes('rto gmbh')) {
      return true
    }
  });

  return false;
}