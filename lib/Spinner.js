const MainSpinner = require('cli-spinner'),
  {Helper} = require(`${__dirname}/Helper`);

class Spinner {

  constructor(text) {
    if (Helper.debugEnabled()) return this;

    this._spinner = new MainSpinner.Spinner(text);

    return this;
  }

  start() {
    if (Helper.debugEnabled()) return;

    this._spinner.start();
  }

  stop(clear = false) {
    if (Helper.debugEnabled()) return;

    this._spinner.stop(clear);
  }
}

exports.Spinner = Spinner;