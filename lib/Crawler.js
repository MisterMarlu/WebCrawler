require(`${__dirname}/debugging`);

// Import modules.
const fs = require('fs'),
  URL = require('url-parse'),
  axios = require('axios'),
  cheerio = require('cheerio'),

  // Import custom modules.
  Global = require(`${__dirname}/Global`),
  Parser = require(`${__dirname}/Parser`),
  Helper = require(`${__dirname}/Helper`),
  DelayedSave = require(`${__dirname}/DelayedSave`),
  Spinner = require(`${__dirname}/Spinner`),
  BaseModule = require(`${__dirname}/BaseModule`);

let instance = null,
  moduleName = Parser.getModuleName(__filename);

/**
 * The Crawler is this class that visits the portal to get all relative links to visit the next
 * subpage.
 *
 * @extends BaseModule
 * @returns {Crawler} Returns the Crawler instance.
 */
class Crawler extends BaseModule {

  /**
   * @see Crawler.
   */
  constructor(options) {
    // Constructor of the super class.
    super(options);

    // The class Wrapper is a singleton class.
    if (instance instanceof Crawler) return instance;
    if (!(this instanceof Crawler)) return new Crawler(options);

    this.pageLimit = 0;
    this.startUrl = '';
    this.visited = [];
    this.followingPages = [];
    this.numVisited = 0;
    this.url = {};
    this.baseUrl = '';
    this.errorList = {};
    this.startTime = new Date();
    this.lockFileName = '';
    this.checkUrlTime = true;
    this.foundUrlTime = 1000;
    this.stop = null;
    this.delayedSave = new DelayedSave(options);
    this.localBlacklist = [
      'track',
      'guides',
      'detect',
      'banner',
      'click',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
    ];

    instance = this;
    return this;
  }

  /**
   * Initiate the crawling process.
   *
   * @async
   * @param {function} stop The function that should be called when the crawling process has been done.
   * @returns {Promise} Returns an empty Promise object.
   */
  async start(stop) {
    // Debugging line.
    Helper.printDebugLine(this.start, __filename, __line);

    // Prevent multiple processes.
    if (this.hasLockFile()) return;

    this.pageLimit = Global.get('PAGE_LIMIT');
    this.startUrl = Global.get('START_URL');
    this.url = new URL(this.startUrl);
    this.baseUrl = `${this.url.protocol}//${this.url.hostname}`;
    this.stop = stop;
    this.followingPages.push(this.startUrl);
    this.createLockFile();
    this.startTime = new Date();
    await this.crawlViaObjects();
  }

  /**
   * Write ending lines into the .log file and remove the .lock file.
   */
  end() {
    // Debugging line.
    Helper.printDebugLine(this.end, __filename, __line);

    // Let the user know that the cache stored in the database will be cleared.
    let tmpSpinner = new Spinner('Clearing cache stored in the database %s');
    tmpSpinner.start();

    this.clearCacheDB().then(() => {
      // Remove the information with the spinner.
      tmpSpinner.stop(true);

      // If we used the database as cache, the user should know this.
      if (Global.get('useDB')) {
        this.output.writeLine(`Used database until page ${Global.get('useDB')}`, true);
      }

      // Write some ending lines.
      this.output.writeUserInput(this);
      this.getReadableTime();

      // Close the write stream to the log file.
      this.output.logger.end();
      this.removeLockFile();
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Clearing temporary saved data in the database.
   *
   * @async
   * @returns {Promise} Returns an empty Promise object.
   */
  clearCacheDB() {
    // Debugging line.
    Helper.printDebugLine(this.clearCacheDB, __filename, __line);

    return new Promise((resolve, reject) => {
      // Remove all visited urls.
      this.db.delete({}, 'visited_urls').then(visit => {
        // Remove all found urls.
        this.db.delete({}, 'found_urls').then(found => {
          // Just finish when all data has been removed.
          if (Global.get('dbVariant') === 'mongodb') {
            if (visit.deletedCount === 0 && found.deletedCount === 0) {
              resolve();
              return;
            }
          } else {
            if (visit.affectedRows === 0 && found.affectedRows === 0) {
              resolve();
              return;
            }
          }

          // Call this method recursively.
          this.clearCacheDB().then(() => {
            resolve();
          }).catch(error => {
            reject(error);
          });
        }).catch((error => {
          reject(error);
        }));
      }).catch((error => {
        reject(error);
      }));
    });
  }

  /**
   * Check if url already visited. If not, visit this url. This is the object variant.
   * INFO: The most comments are parameters in the method "Helper.debug".
   *
   * @async
   * @returns {Promise} Returns an empty Promise object.
   */
  async crawlViaObjects() {
    // Debugging line.
    Helper.printDebugLine(this.crawlViaObjects, __filename, __line);

    // When we visited 1,000 urls check the speed of the database way.
    Helper.debug(__filename, `this.numVisited: ${this.numVisited}`);
    if (this.numVisited === 1000) {
      Helper.debug(__filename, 'Call the equivalent method with database connection once', 1);
      this.crawlViaDb();
      return;
    }

    Helper.debug(__filename, 'Check if we should store the collected data into the database', 3);
    Crawler.checkSaveTimer();

    Helper.debug(__filename, `this.pageLimit: ${this.pageLimit}`);
    if (this.numVisited >= this.pageLimit && this.pageLimit !== 0) {
      Helper.debug(__filename, 'Page limit is reached, leave process', 1);
      return this.stop('page limit');
    }

    let startTime = new Date(),
      useDB = false,
      // Get the next url to visit.
      nextPage = this.followingPages.pop();

    Helper.debug(__filename, `nextPage: ${nextPage}`);
    if (typeof nextPage === 'undefined') {
      Helper.debug(__filename, 'There is no next page, we crawled the whole portal, probably', 1);
      return this.stop('last page');
    }

    Helper.debug(__filename, 'Remove the url, which we want to visit, from the database', 2);
    this.db.delete({url: nextPage}, 'found_urls').then(result => {
      Helper.debug(__filename, `this.visited.includes(nextPage): ${this.visited.includes(nextPage)}`);
      if (this.visited.includes(nextPage)) {
        Helper.debug(__filename, 'We already visited this url, repeat', 4);
        return this.crawlViaObjects();
      }

      // Check if this variant is faster than the database variant.
      let urlTime = new Date() - startTime;
      Helper.debug(__filename, `urlTime: ${urlTime}`);
      Helper.debug(__filename, `this.foundUrlTime: ${this.foundUrlTime}`);
      Helper.debug(__filename, `urlTime > (this.foundUrlTime * 20): ${urlTime > (this.foundUrlTime * 20)}`);
      if (urlTime > (this.foundUrlTime * 20)) {
        Helper.debug(__filename, 'This variant is not faster than the database variant', 3);
        // Now we're using the database variant til the end.
        useDB = true;
        Global.set('useDB', this.numVisited);

        Helper.debug(__filename, 'Sync the current found urls with the database', 3);
        this.syncFoundUrls().then(() => {
          // Visit the url and continue with the database variant.
          this.visitPage(nextPage, useDB);
        }).catch(error => {
          console.log(error);
        });
        return;
      }

      // Visit the url.
      this.visitPage(nextPage, useDB);
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Check if url already visited. If not, visit this url. This is the database variant.
   *
   * @async
   * @returns {Promise} Returns an empty Promise object.
   */
  async crawlViaDb() {
    // Debugging line.
    Helper.printDebugLine(this.crawlViaDb, __filename, __line);

    // Check if we should store the collected data into the database.
    Crawler.checkSaveTimer();

    // Page limit is reached, leave process.
    if (this.numVisited >= this.pageLimit && this.pageLimit !== 0) return this.stop('page limit');

    let start = new Date(),
      useDB = true;

    // Get the next url to visit.
    this.db.findOne({}, 'found_urls').then(page => {
      // If there is no next page we crawled the whole portal, probably.
      if (!page || page.length === 0) {
        this.stop('last page');
        return;
      }

      let nextPage = page.url;

      // Remove the url, which we want to visit, from the database.
      this.db.delete({url: page.url}, 'found_urls').then(result => {
        this.db.findOne({url: nextPage}, 'visited_urls').then(result => {
          // If we already visited this url repeat.
          if (result) {
            if (Global.get('dbVariant') === 'mongodb') {
              this.crawlViaDb();
              return;
            } else {
              if (result.length > 0) {
                this.crawlViaDb();
                return;
              }
            }
          }

          // If we just want to check the time, we would continue with the object variant.
          if (this.checkUrlTime) {
            this.foundUrlTime = new Date() - start;
            useDB = false;
          }

          // Visit the url.
          this.visitPage(nextPage, useDB);
        }).catch(error => {
          console.log('CATCH');
        });
      }).catch(error => {
        console.log(error);
      });
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Visit the url and let the customer search for whatever he want.
   *
   * @async
   * @param {string} url The url we want to visit.
   * @param {boolean} [db=false] Using the database variant.
   * @returns {Promise} Returns an empty Promise object.
   */
  async visitPage(url, db = false) {
    // Debugging line.
    Helper.printDebugLine(this.visitPage, __filename, __line);

    this.increaseVisited(url).then(() => {
      // Debugging line.
      this.output.writeLine(`Visiting page ${url}`, Helper.isDebug(moduleName));

      // Information in the log file.
      this.output.write(`Visited pages: ${this.numVisited}`, true);

      // Make the request.
      axios.get(url).then(async response => {
        // Debugging line.
        this.output.write(`Status: ${response.status}`, Helper.isDebug(moduleName));

        // Why should it be correct and incorrect at the same time?
        if (response.status !== 200) {
          if (db) this.crawlViaDb();
          else this.crawlViaObjects();
          return;
        }

        // Reading the DOM.
        let $ = cheerio.load(response.data);

        // Find all links to collect the next links to visit.
        await this.collectLinks($, db);

        // Call the search callback function so the customer can do everything he want.
        if (Helper.hasCallback('search')) Helper.getCallback('search')($, url);

        // Repeat.
        if (db) this.crawlViaDb();
        else this.crawlViaObjects();
      }).catch(error => {
        this.output.writeLine(`Error on url ${url}`, true, 'warning');

        // If we have a response we don't have an error on our code, puh :D
        if (typeof error.response !== 'undefined') {
          this.output.write(`Status: ${error.response.status}`, true, 'warning');
          this.output.writeWithSpace(`Status text: ${error.response.statusText}`, true, 'warning');

          // Add this error into the error list.
          if (typeof this.errorList[error.response.status] === 'undefined') {
            this.errorList[error.response.status] = [];
          }

          this.errorList[error.response.status].push(url);
        } else {
          // Oh no, something went wrong in our code :(
          this.output.write('Request was sent with no response.', true, 'error');

          if (Helper.isDebug(moduleName)) console.log(error);
        }

        // Repeat.
        if (db) this.crawlViaDb();
        else this.crawlViaObjects();
      });
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Increase visited pages counter.
   *
   * @async
   * @param {string} url The url we want to visit.
   * @returns {Promise} Returns an empty Promise object.
   */
  increaseVisited(url) {
    // Debugging line.
    Helper.printDebugLine(this.increaseVisited, __filename, __line);

    this.visited.push(url);
    this.numVisited += 1;

    return new Promise((resolve, reject) => {
      // Update starting url.
      let filter = {url: this.startUrl},
        update = {url: this.startUrl, num_visited: this.numVisited};
      this.db.save(filter, update, 'starting_urls').then(res => {
        // Add this url to the visited urls.
        this.db.save({url: url}, {url: url}, 'visited_urls').then(result => {
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
   * Collect all (relative) links.
   *
   * @async
   * @param {function} $ The content of the website where we can perform like in jQuery.
   * @param {boolean} [db=false] Using the database variant.
   * @returns {Promise} Returns an empty Promise object.
   */
  async collectLinks($, db = false) {
    // Debugging line.
    Helper.printDebugLine(this.collectLinks, __filename, __line);

    let links = $("a[href^='/']"),
      abLinks = $("a[href^='http']");

    // Add links to link list.
    await links.each((index, element) => {
      this.collectRelativeLinks($(element).attr('href'), db);
    });

    // Maybe the subpages are absolute links.
    await abLinks.each((index, element) => {
      let href = $(element).attr('href');

      // The link includes our base url? Ok, maybe a subpage.
      if (href.includes(this.baseUrl)) {
        let inLocalBlacklist = false;

        // Has this link anything from our local blacklist?
        for (let i = 0; i < this.localBlacklist.length; i += 1) {
          if (href.toLowerCase().includes(this.localBlacklist[i])) inLocalBlacklist = true;
        }

        // Not in the blacklist? Ok, it can be a subpage.
        if (!inLocalBlacklist) {
          if (!db) {
            // Did we ever visit this link on this run?
            if (!this.visited.includes(href)) {
              // This link is not in the list of following pages?
              if (!this.followingPages.includes(href)) {
                // Now it is. A subpage.
                this.followingPages.push(href);
                this.db.save({url: href}, {url: href}, 'found_urls').then(result => {
                }).catch(error => {
                  console.log(error);
                });
              }
            }
          } else {
            // Did we ever visit this link on this run?
            this.db.findOne({url: href}, 'visited_urls').then(result => {
              if (Global.get('dbVariant') === 'mysql') {
                if (result.length > 0) return;
              } else {
                if (result) return;
              }
              // This link is not in the list of following pages?
              this.db.findOne({url: href}, 'found_urls').then(result => {
                if (Global.get('dbVariant') === 'mysql') {
                  if (result.length > 0) return;
                } else {
                  if (result) return;
                }
                // Now it would be.
                this.db.save({url: href}, {url: href}, 'found_urls').then(result => {
                }).catch(error => {
                  console.log(error);
                });
              }).catch(error => {
                console.log(error);
              });
            }).catch(error => {
              console.log(error);
            });
          }
        }
      }
    });
  }

  /**
   * Split relative from shorted absolute links (e.g. "/google.com").
   *
   * @param {string} link The url of the link.
   * @param {boolean} [db=false] Using the database variant.
   */
  collectRelativeLinks(link, db = false) {
    // Debugging line.
    Helper.printDebugLine(this.collectRelativeLinks, __filename, __line);
    let inLocalBlacklist = false;

    // Has this link anything from our local blacklist?
    for (let i = 0; i < this.localBlacklist.length; i += 1) {
      if (link.toLowerCase().includes(this.localBlacklist[i])) inLocalBlacklist = true;
    }

    // Is it in our blacklist? Ok, next.
    if (inLocalBlacklist) return;

    let linkArray = link.split('/'),
      linkType = 'typeRelative';

    for (let i = 0; i < link.length;) {
      if (linkArray[0] === '') {
        linkArray.shift();
      } else {
        i += 1;
      }
    }

    // Points (.) are not allowed in routes, are they?
    if (linkArray.length === 0 || linkArray[0].includes('.')) linkType = 'typeAbsolute';
    link = linkArray.join('/');

    let tmpUrlRel = `${this.baseUrl}/${link}`,
      tmpUrlAbs = `${this.url.protocol}//${link}`,
      tmpUrl = (linkType === 'typeRelative') ? tmpUrlRel : tmpUrlAbs;

    if (link.length < 1) return;
    if (!db) {
      if (this.visited.includes(tmpUrl)) return;
      if (this.followingPages.includes(tmpUrl)) return;
      if (linkType !== 'typeRelative') return;

      this.followingPages.push(tmpUrl);
      this.db.save({url: tmpUrl}, {url: tmpUrl}, 'found_urls').then(result => {
      }).catch(error => {
        console.log(error);
      });
    } else {
      if (linkType !== 'typeRelative') return;

      this.db.findOne({url: tmpUrl}, 'visited_urls').then(result => {
        if (Global.get('dbVariant') === 'mysql') {
          if (result.length > 0) return;
        } else {
          if (result) return;
        }
        this.db.findOne({url: tmpUrl}, 'found_urls').then(result => {
          if (Global.get('dbVariant') === 'mysql') {
            if (result.length > 0) return;
          } else {
            if (result) return;
          }
          this.db.save({url: tmpUrl}, {url: tmpUrl}, 'found_urls').then(result => {
          }).catch(error => {
            console.log(error);
          });
        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        console.log(error);
      });
    }
  }

  /**
   * Check if this command is default.
   *
   * @param {string} command The name of the command.
   * @returns {boolean} Returns if the command is like the default command.
   */
  isDefault(command) {
    // Debugging line.
    Helper.printDebugLine(this.isDefault, __filename, __line);

    // If there is no property available, it is an invalid property.
    if (!Global.get('input').hasOwnProperty(command)) return false;

    return (Global.get('input')[command] === Global.get('input').default[command]);
  }

  /**
   * Stops execution timer and prints readable time.
   */
  getReadableTime() {
    // Debugging line.
    Helper.printDebugLine(this.getReadableTime, __filename, __line);

    // Stop the time please. How long was the crawling process?
    let ms = new Date() - this.startTime,
      time = Parser.parseTime(ms),
      timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

    this.output.write(timeString, true, 'success');
    this.output.writeLine(`Stopped at: ${new Date()}`, true, 'success');
  }

  /**
   * Creates lock file.
   */
  createLockFile() {
    // Debugging line.
    Helper.printDebugLine(this.createLockFile, __filename, __line);

    // Update starting url.
    let filter = {url: Global.get('START_URL')},
      update = {
        url: Global.get('START_URL'),
        active: true
      };

    this.db.save(filter, update, 'starting_urls').then(res => {
    }).catch(error => {
      console.log(error);
    });

    // Create the lock file.
    fs.writeFileSync(`${Global.get('projectPath')}/${this.lockFileName}`, new Date());
  }

  /**
   * Removes lock file.
   */
  removeLockFile() {
    // Debugging line.
    Helper.printDebugLine(this.removeLockFile, __filename, __line);

    // Remove lock file.
    fs.unlinkSync(`${Global.get('projectPath')}/${this.lockFileName}`);

    // Update starting url.
    let filter = {url: Global.get('START_URL')},
      update = {
        url: Global.get('START_URL'),
        active: false
      },
      self = this;

    this.db.save(filter, update, 'starting_urls').then(res => {
      // Close the database connection.
      if (Global.get('dbVariant') === 'mongodb') {
        self.db.database.close();
      } else {
        self.db.database.end();
      }
    }).catch(error => {
      console.log(error);
    });
  }

  /**
   * Check if lock file exists.
   *
   * @returns {boolean} Returns the existence of the lock file.
   */
  hasLockFile() {
    // Debugging line.
    Helper.printDebugLine(this.hasLockFile, __filename, __line);

    return fs.existsSync(`${Global.get('projectPath')}/${this.lockFileName}`);
  }

  /**
   * Store all following urls into the database.
   *
   * @async
   * @param {number} [i=0] An increment for recursively calls.
   * @returns {Promise} Returns an empty Promise object.
   */
  syncFoundUrls(i = 0) {
    // Debugging line.
    Helper.printDebugLine(this.syncFoundUrls, __filename, __line);

    return new Promise((resolve, reject) => {
      // If there are no more following urls, we're done.
      if (!this.followingPages[i]) {
        resolve();
        return;
      }

      // Get the next url.
      let next = this.followingPages[i];
      this.db.save({url: next}, {url: next}, 'found_urls').then(result => {
        // Call this method recursively.
        this.syncFoundUrls(i + 1).then(() => {
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
   * Check if it's time to save the collected data.
   */
  static checkSaveTimer() {
    // Debugging line.
    Helper.printDebugLine(Crawler.checkSaveTimer, __filename, __line);

    let time = new Date();

    if (time < Global.get('saveTimer')) return;

    // Set new timer.
    time.setMinutes(time.getMinutes() + 1); // Save again in one minute.
    Global.set('saveTimer', time);

    // Don not try to start a saving process when already exists.
    if (DelayedSave.isSaving()) return;

    // Save all collected data.
    instance.delayedSave.saveAll().then(() => {
    }).catch(error => {
      console.log(error);
    });
  }
}

module.exports = Crawler;