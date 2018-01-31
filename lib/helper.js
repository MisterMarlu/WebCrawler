const {Global} = require(`${__dirname}/global`);

class Helper {
  static hasCallback(name) {
    let callbacks = Global.get('callbacks');

    return typeof callbacks[name] !== 'undefined';
  }

  static getCallback(name) {
    let callbacks = Global.get('callbacks');

    return (this.hasCallback(name) ? callbacks[name] : null);
  }
}

exports.Helper = new Helper();