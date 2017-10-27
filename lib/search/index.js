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
 * Import custom modules.
 */
const Output = require('../output').Output;
const {getCustomerId} = require('../parser');

/**
 * Necessary variables.
 */
let instance = {},
  output = new Output(),
  searchFor = '';

/**
 * Search constructor.
 *
 * @param searchingFor: {string}
 * @returns {Search}
 * @constructor
 */
let Search = function (searchingFor) {
  if (!this instanceof Search) return new Search(searchFor);
  if (instance instanceof Search) return instance;
  if (typeof searchingFor === 'undefined') searchingFor = require('../config.json').searchFor;

  this.alreadyVisited = [];
  searchFor = searchingFor.toLowerCase();

  instance = this;

  return this;
};

/**
 * Set new search for.
 *
 * @param searchingFor: {string}
 * @returns {Search}
 */
Search.prototype.setSearchFor = function (searchingFor) {
  searchFor = searchingFor;
  return this;
};

/**
 * Check if website url contains the search for string.
 *
 * @param url: {string}
 * @returns {boolean}
 */
Search.prototype.canHaveWebsite = function (url) {
  return (url.toLowerCase().includes(searchFor));
};

/**
 * Set customer/post information.
 *
 * @param url: {string}
 * @param $
 * @param customers: {{}}
 * @param starting: {string}
 * @param debug: {boolean}
 * @returns {Promise.<void>}
 */
Search.prototype.setCustomer = async function (url, $, customers, starting, debug) {
  let customerPage = $('.icon_url_text').find('a').attr('href'),
    customerId = getCustomerId($),
    i = {
      with: customers.withWebsite.length,
      without: customers.withoutWebsite.length
    };

  if (typeof customerPage === 'undefined') {
    customers.withoutWebsite[i.without] = url;
    output.write(`Found customer without website: ${url}`, debug, 'success');
    if (this.alreadyVisited.indexOf(url) < 0) {
      this.alreadyVisited.push(url);
    }
    return;
  }

  let tmpWebsite = removeUrlProtocol(customerPage);
  if (tmpWebsite.substr(0, 3) === 'www') {
    tmpWebsite = trimFront(4, tmpWebsite);
  }

  // If current found website is part of the starting url.
  if (fromStartingUrl(tmpWebsite, starting)) {
    this.alreadyVisited.push(tmpWebsite);
  }

  if (this.alreadyVisited.indexOf(tmpWebsite) > -1) {
    return;
  }

  this.alreadyVisited.push(tmpWebsite);

  // Make the request to customer's website.
  requestCustomerPage(customerPage, url, customers, i.with, debug);
};

/**
 * Removes "http://" and "https://" from website.
 *
 * @param website: {string}
 * @returns {string}
 */
function removeUrlProtocol(website) {
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
}

/**
 * Check if website is a subpage from the starting url.
 *
 * @param website: {string}
 * @param starting: {string}
 * @returns {boolean}
 */
function fromStartingUrl(website, starting) {
  starting = removeUrlProtocol(starting);
  if (starting.substr(0, 3) === 'www') {
    starting = trimFront(4, starting);
  }

  return (website.includes(starting));
}

/**
 * Trim the front of the string.
 *
 * @param remove: {int}
 * @param string: {string}
 * @returns {string}
 */
function trimFront(remove, string) {
  return string.substr(remove, (string.length - remove));
}

/**
 * Requesting to customers website via http and https.
 *
 * @param website: {string}
 * @param url: {string}
 * @param customers: {{}}
 * @param i: {int}
 * @param debug: {boolean}
 */
function requestCustomerPage(website, url, customers, i, debug) {
  // Make the request.
  axios.get(website)
    .then(function (response) {
      if (response.status !== 200) return;

      // Read and check website.
      let $ = cheerio.load(response.data);
      setCustomerSettings(customers, i, url, website, $, debug);
    })
    .catch(function (error) {
      output.writeLine(`Error when try to visit customer page: ${website}`, true, 'warning');
      if (debug) console.log(error);

      if (website.substr(0, 5) !== 'https') {
        output.writeWithSpace('Try now to visit customer page with https.', true, 'warning');
        website = website.splice(4, 0, 's'); // http -> https
        requestCustomerPage(website, url, customers, i, debug);
        return;
      }

      customers.withWebsite[i] = {
        url: url,
        website: website,
        rto: false,
        hasError: true
      };
    });
}

/**
 * Set information about a customer's website (if there is a website).
 *
 * Function must be an asynchronous function to be able to use the keyword "await".
 *
 * @param customers: {}
 * @param i: {int}
 * @param url: {string}
 * @param website: {string}
 * @param $
 * @param debug: {boolean}
 */
async function setCustomerSettings(customers, i, url, website, $, debug) {
  let links = $('a[href]'),
    imprintLink = '',
    rto = false;

  website = removeUrlProtocol(website);

  // Search for imprint link.
  links.each(function () {
    if ($(this).attr('href').toLowerCase().includes('impressum')) {
      imprintLink = fullLink($(this).attr('href'), website);
    }
  });

  // Search for heartbeat or rto.
  $('*').contents().each(function () {
    if (!rto) {
      rto = searchForRto(this, $, rto);
    }
  });

  if (!rto) {
    // Check ip address and imprint for rto. Using the keyword await to get return value
    // from asynchronous function.
    rto = await searchForRtoRequest(rto, website, imprintLink, debug);
  }

  let exists = false;
  for (let j = 0; j < customers.withWebsite.length; j += 1) {
    if (customers.withWebsite[j].website === website) {
      exists = true;
    }
  }

  if (!exists) {
    let rtoString = (rto) ? 'RTO' : 'other';
    output.write(`Found customer with ${rtoString} website: ${website}`, debug, 'success');

    customers.withWebsite[i] = {
      url: url,
      website: website,
      imprint: imprintLink,
      rto: rto,
      hasError: false
    };
  }
}

/**
 * Checks every node type for "heartbeat" or "rto gmbh".
 *
 * @param contents
 * @param $
 * @param isRto: {boolean}
 * @returns {boolean}
 */
function searchForRto(contents, $, isRto) {
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
      if (metaTag.attr('content').toLowerCase().includes('rto gmbh')) {
        isRto = true;
        return isRto;
      }
    }
  }

  return isRto;
}

/**
 * Checks website ip address and imprint (if it's given).
 *
 * @param isRto: {boolean}
 * @param website: {string}
 * @param imprint: {string}
 * @param debug: {boolean}
 * @returns {boolean}
 */
async function searchForRtoRequest(isRto, website, imprint, debug) {
  if (isRto) return true;

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
}

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

/**
 * Get the full url of a link.
 *
 * @param link: {string}
 * @param base: {string}
 * @returns {string}
 */
function fullLink(link, base) {
  link = removeUrlProtocol(link);

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
}

exports.Search = Search;