/**
 * @author lbraun
 * @date 16.10.2017
 * @licence MIT
 */

const axios = require('axios');
const cheerio = require('cheerio');

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
   * @param customers: object
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

    axios.get(customerPage)
      .then(function (response) {
        if (response.status !== 200) {
          customers.otherWebsite[i.ow] = {
            url: url,
            website: customerPage
          };
          return;
        }

        var $ = cheerio.load(response.data);
        self.setCustomerSettings(customers, i, url, customerPage, $);
      });
  };

  /**
   * Set information about a customer's website (if there is a website)
   *
   * @param customers: object
   * @param i: object
   * @param url: string
   * @param website: string
   * @param $
   */
  this.setCustomerSettings = function (customers, i, url, website, $) {
    var self = this;
    var links = $('a[href]');
    var imprintLink = '';
    var rto = false;

    links.each(function () {
      if ($(this).attr('href').toLowerCase().includes('impressum')) {
        imprintLink = self.fullLink($(this).attr('href'), website);
      }
    });

    $('*').contents().each(function () {
      if (this.nodeType === 8) {
        if (typeof this.nodeType === 'string' && this.nodeValue.includes('heartbeat')) {
          rto = true;
        }
      }
    });

    var type = (rto) ? 'rtoWebsite' : 'otherWebsite';
    var iType = (rto) ? 'rw' : 'ow';

    customers[type][i[iType]] = {
      url: url,
      website: website,
      imprint: imprintLink
    };
  };

  /**
   * Should be completed.
   *
   * @param href: string
   * @param base: string
   * @returns {string}
   */
  this.fullLink = function (href, base) {
    return href;
  };

  return this;
};