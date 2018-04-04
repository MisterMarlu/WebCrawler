// Import modules.
const MainSpinner = require('cli-spinner'),

  // Import custom modules.
  Helper = require(`${__dirname}/Helper`);

/**
 * This spinner is a class that is similar to the cli-spinner, but with our debug information.
 */
class Spinner {

  /**
   * Create a new instance of the spinner.
   *
   * @param {string} text The text that should be printed with the spinner.
   * @returns {Spinner} Returns the instance of the Spinner.
   */
  constructor(text) {
    // No spinner while debugging.
    if (Helper.debugEnabled()) return this;

    // Do all the things, that the original spinner would do.
    this._spinner = new MainSpinner.Spinner(text);

    return this;
  }

  /**
   * Start the spinner.
   */
  start() {
    // No spinner while debugging.
    if (Helper.debugEnabled()) return;

    // Do all the things, that the original spinner would do.
    this._spinner.start();
  }

  /**
   * Stop the spinner.
   *
   * @param {boolean} [clear=false] Clear the spinner line from the command line.
   */
  stop(clear = false) {
    // No spinner while debugging.
    if (Helper.debugEnabled()) return;

    // Do all the things, that the original spinner would do.
    this._spinner.stop(clear);
  }
}

module.exports = Spinner;