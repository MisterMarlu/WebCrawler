/**
 * Import modules.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const request = require('request');

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
   */
  this.setCustomer = function (url, $, customers) {
    var self = this;
    var customerPage = $('.icon_url_text').find('a').attr('href');
    var i = {
      nw: customers.noWebsite.length,
      rw: customers.rtoWebsite.length,
      ow: customers.otherWebsite.length
    };

    if (typeof customerPage === 'undefined') {
      customers.noWebsite[i.nw] = url;
      return;
    }

    // Make the request to customer's website.
    axios.get(customerPage)
      .then(function (response) {
        if (response.status !== 200) {
          return;
        }

        var $ = cheerio.load(response.data);
        self.setCustomerSettings(customers, i, url, customerPage, $);
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

    // Search in comments for 'heartbeat' comment.
    $('*').contents().each(function () {
      self.searchForRto(this, $, rto, website);
      if (this.nodeType === 8) {
        if (typeof this.nodeValue === 'string' && this.nodeValue.includes('heartbeat')) {
          rto = true;
        }
      }
    });

    var type = (rto) ? 'rtoWebsite' : 'otherWebsite';
    var iType = (rto) ? 'rw' : 'ow';
    var exists = false;

    for (var j = 0; j < customers[type].length; j += 1) {
      if (customers[type][j].website === website) {
        exists = true;
      }
    }

    if (!exists) {
      customers[type][i[iType]] = {
        url: url,
        website: website,
        imprint: imprintLink
      };
    }
  };

  this.searchForRto = function (contents, $, isRto, website) {
    // If isRto is already true, don't try to set true again.
    if (isRto) {
      return;
    }

    // Check for heartbeat.
    if (!isRto) {
      if (contents.nodeType === 8) {
        if (typeof contents.nodeValue === 'string' && contents.nodeValue.includes('heartbeat')) {
          isRto = true;
          return;
        }
      }
    }

    // Check in meta (publisher === 'rto').
    if (!isRto) {
      var metaTag = $("meta[name='publisher']");
      if (typeof metaTag !== 'undefined' && typeof metaTag.attr('content') !== 'undefined') {
        if (metaTag.attr('content').toLowerCase().includes('rto')) {
          isRto = true;
          return;
        }
      }
    }

    // Check with ip (compare with ip from rto.de).
    if (!isRto) {
      var ip = '';
      request('www.rto.de', function (error, request, body) {
        ip = request.remoteIP;
      }).on('response', function (res) {
        res.remoteIP = res.connection.remoteAddress;
      });

      request(website, function (error, request, body) {
        if (ip === request.remoteIP) {
          isRto = true;
        }
      }).on('response', function (res) {
        res.remoteIP = res.connection.remoteAddress;
      });
    }

    // Check in imprint.
    if (!isRto) {
      // Searching for imprint.
    }
  };

  /**
   * Should be completed.
   *
   * @param link: string
   * @param base: string
   * @returns {string}
   */
  this.fullLink = function (link, base) {
    console.log(link);
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