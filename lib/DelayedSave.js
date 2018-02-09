// Import custom modules.
const {Global} = require(`${__dirname}/Global`),
  {Helper} = require(`${__dirname}/Helper`);

let instance = null;

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

    this.types = [];

    instance = this;
    return this;
  }

  /**
   * Add a type with necessary information so DelayedSave know how to save the data.
   *
   * @param {string} collection Name of the collection.
   * @param {string} globalName Name of the array of objects in the class Global.
   * @param {string} index Index of the collection.
   * @param {function} [callback=DelayedSave.save] Callback to the way of saving the data.
   */
  addType(collection, globalName, index, callback = DelayedSave.save) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.addType, __filename, __line);

    let type = {collection, globalName, index, callback},
      typeIndex = this.types.findIndex(obj => {
        return obj.globalName === globalName;
      });

    if (typeIndex === -1) {
      this.types.push(type);
      return;
    }

    this.types[typeIndex] = type;
  }

  /**
   * Save all found objects where a type is given.
   *
   * @param {number} [i=0] An increment for recursively calls.
   * @returns {Promise} Returns an empty promise.
   */
  saveAll(i = 0) {
    // Debugging line.
    Helper.printDebugLine(instance.output, this.saveAll, __filename, __line);

    return new Promise((resolve, reject) => {
      // If there are no more types, we're done.
      if (!instance.types[i]) {
        resolve();
        return;
      }

      // Get all objects from the class Global and clear this parameter.
      let objects = Global.get(instance.types[i].globalName);
      Global.set(instance.types[i].globalName, []);

      // Call the callback of the type.
      instance.types[i].callback(objects, instance.types[i]).then(() => {
        // Call this method recursively.
        instance.saveAll(i + 1).then(() => {
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
   * The default saving process.
   *
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
    Helper.printDebugLine(instance.output, DelayedSave.save, __filename, __line);

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

exports.DelayedSave = DelayedSave;