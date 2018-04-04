require(`${__dirname}/debugging`);

// Import custom modules.
const Global = require(`${__dirname}/Global`),
  Helper = require(`${__dirname}/Helper`);

let instance = null,
  saving = false;

/**
 * With this class objects can be saved without overlapping.
 *
 * @returns {DelayedSave} Returns the DelayedSave instance.
 */
class DelayedSave {

  /**
   * @see DelayedSave.
   */
  constructor(options) {
    // The class DelayedSave is a singleton class.
    if (instance instanceof DelayedSave) return instance;
    if (!(this instanceof DelayedSave)) return new DelayedSave(options);

    for (let key in options) {
      if (options.hasOwnProperty(key)) this[key] = options[key];
    }

    this.types = {};
    this.positions = [];

    instance = this;
    return this;
  }

  /**
   * Add a type with necessary information so DelayedSave know how to save the data.
   *
   * @param {number} position Position of the ordered saving types.
   * @param {string} collection Name of the collection.
   * @param {string} globalName Name of the array of objects in the class Global.
   * @param {string} index Index of the collection.
   * @param {function} [callback=DelayedSave.save] Callback to the way of saving the data.
   */
  addType(position, collection, globalName, index, callback = DelayedSave.save) {
    // Debugging line.
    Helper.printDebugLine(this.addType, __filename, __line);

    this.types[position] = {position, collection, globalName, index, callback};

    for (let p in this.types) {
      if (!this.types.hasOwnProperty(p)) continue;
      if (this.positions.includes(p)) continue;
      this.positions.push(p);
    }

    this.positions.sort();
  }

  /**
   * Check if DelayedSave is saving at this moment.
   *
   * @returns {boolean} Returns true or false.
   */
  static isSaving() {
    return saving;
  }

  /**
   * Save all found objects where a type is given.
   *
   * @async
   * @param {number} [i=0] An increment for recursively calls.
   * @returns {Promise} Returns an empty promise.
   */
  saveAll(i = 0) {
    // Debugging line.
    Helper.printDebugLine(this.saveAll, __filename, __line);

    // We are saving now.
    saving = true;

    return new Promise((resolve, reject) => {
      let position = instance.positions[i];

      // If there are no more types, we're done.
      if (!instance.types[position]) {
        saving = false;
        resolve();
        return;
      }

      // Get all objects from the class Global and clear this parameter.
      let objects = Global.get(instance.types[position].globalName);
      Global.set(instance.types[position].globalName, []);

      // Call the callback of the type.
      instance.types[position].callback(objects, instance.types[position]).then(() => {
        // Call this method recursively to save all registered types.
        instance.saveAll(i + 1).then(() => {
          saving = false;
          resolve();
        }).catch(error => {
          saving = false;
          reject(error);
        });
      }).catch(error => {
        saving = false;
        reject(error);
      });
    });
  }

  /**
   * The default saving process.
   *
   * @async
   * @param {object[]} objects An array of objects to save into the database.
   * @param {object} type An object with information about the type.
   * @param {string} type.collection Name of the collection.
   * @param {string} type.globalName Name of the array of objects in the class Global.
   * @param {string} type.index Index of the collection.
   * @param {number} [i=0] An increment for recursively calls.
   * @returns {Promise} Returns an empty promise.
   */
  static save(objects, type, i = 0) {
    // Debugging line.
    Helper.printDebugLine(DelayedSave.save, __filename, __line);

    return new Promise((resolve, reject) => {
      // If there are no more objects, we're done.
      if (!objects[i]) {
        resolve();
        return;
      }

      // Store the object into the database.
      instance.db.save({[type.index]: objects[i][type.index]}, objects[i], type.collection)
        .then(result => {
          // Call this method recursively.
          DelayedSave.save(objects, type, i + 1).then(() => {
            resolve();
          }).catch(error => {
            reject(error);
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

module.exports = DelayedSave;