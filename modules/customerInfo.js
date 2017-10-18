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
   * @param url: string
   */
  this.canHaveWebsite = function (url) {
    return (url.toLowerCase().includes('sex-anzeigen'));
  };

  /**
   * Set customer information.
   *
   * @param url: string
   * @param $
   * @param customers: {}
   * @param output
   */
  this.setCustomer = function (url, $, customers, output) {
    var self = this;
    var customerPage = $('.icon_url_text').find('a').attr('href');
    var i = {
      with: customers.withWebsite.length,
      without: customers.withoutWebsite.length
    };

    if (typeof customerPage === 'undefined') {
      customers.withoutWebsite[i.without] = url;
      return;
    }

    // Make the request to customer's website.
    axios.get(customerPage)
      .then(function (response) {
        if (response.status !== 200) {
          return;
        }

        var $ = cheerio.load(response.data);
        self.setCustomerSettings(customers, i.with, url, customerPage, $);
      })
      .catch(function (error) {
        output.writeLine('Error when try to visit customer page: ' + customerPage, 'warning');

        customers.withWebsite[i.with] = {
          url: url,
          website: customerPage,
          rto: false,
          hasError: true
        };
      });
  };

  /**
   * Set information about a customer's website (if there is a website)
   *
   * @param customers: {}
   * @param i: {}
   * @param url: string
   * @param website: string
   * @param $
   */
  this.setCustomerSettings = function (customers, i, url, website, $) {
    var self = this;
    var links = $('a[href]');
    var imprintLink = '';
    var rto = false;

    // Search for imprint link.
    links.each(function () {
      if ($(this).attr('href').toLowerCase().includes('impressum')) {
        imprintLink = self.fullLink($(this).attr('href'), website);
      }
    });

    $('*').contents().each(function () {
      if (!rto) {
        rto = self.searchForRto(this, $, rto, website);
      }
    });

    if (!rto) {
      rto = self.searchForRtoRequest(rto, website);
    }

    var exists = false;

    for (var j = 0; j < customers.withWebsite.length; j += 1) {
      if (customers.withWebsite[j].website === website) {
        exists = true;
      }
    }

    if (!exists) {
      customers.withWebsite[i] = {
        url: url,
        website: website,
        imprint: imprintLink,
        rto: rto,
        hasError: false
      };
    }
  };

  this.searchForRto = function (contents, $, isRto, website) {
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

  this.searchForRtoRequest = function (isRto, website) {
    if (isRto) {
      return true;
    }

    // if (!isRto) {
    //   var ipAddress = '';
    //   dns.lookup('www.rto.de', function (error, address, family) {
    //     if (error) {
    //       return;
    //     }
    //
    //     ipAddress = address;
    //   });
    //
    //   dns.lookup(website, function (error, address, family) {
    //     if (error) {
    //       return;
    //     }
    //
    //     if (ipAddress === address) {
    //       isRto = true;
    //       return true;
    //     }
    //   });
    // }

    // Check in imprint.
    if (!isRto) {
      // Searching for imprint.
    }

    return isRto;
  };

  /**
   * Should be completed.
   *
   * @param link: string
   * @param base: string
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