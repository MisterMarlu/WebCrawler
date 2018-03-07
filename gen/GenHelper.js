// Available colors for the console output.
let colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
};

// Colored check and cross for the console output.
colors.yes = `${colors.green}✔${colors.white}`;
colors.no = `${colors.red}✘${colors.white}`;

/**
 * Class that helps the Generator to be clean code.
 */
class GenHelper {

  /**
   * Returns a colored string.
   *
   * @param {string} string The string with pattern that should be replaced with the colors.
   * @returns {string} Returns the colored string.
   */
  static coloredString(string) {
    for (let name in colors) {
      if (!colors.hasOwnProperty(name)) continue;
      let color = colors[name];

      string = string.split(`%${name}%`).join(color);
    }

    string += colors.reset;

    return string;
  }

  /**
   * Set the answers into the given object.
   *
   * @param {object} object The object that gets the answers of the user.
   * @param {object} answers The answer of the user.
   */
  static setAnswers(object, answers) {
    for (let item in object) {
      if (!object.hasOwnProperty(item) || !answers.hasOwnProperty(item)) continue;
      object[item] = answers[item];
    }
  }

  /**
   * Get important directory names and paths.
   *
   * @returns {object} Returns an object with the important directory names and paths.
   */
  static getImportantDirs() {
    let directories = __dirname.split('/'),
      importantDirs = {
        crawlerDir: '',
        crawlerDirName: '',
        projectDir: '',
        projectDirName: '',
        stubsDir: `${__dirname}/stubs`,
      };

    directories.pop();
    importantDirs.crawlerDirName = directories[directories.length - 1];
    importantDirs.crawlerDir = directories.join('/');
    directories.pop();
    importantDirs.projectDirName = directories[directories.length - 1];
    importantDirs.projectDir = directories.join('/');

    return importantDirs;
  }

  /**
   * Generates the creation string for files that should be created.
   *
   * @param {boolean} error An error occurred, so it's not successful.
   * @param {string} name Name of the file that should be created.
   * @param {object} paths The private path property from Generator.
   * @param {object} paths[name] The path object for the file.
   * @param {string} paths[name].path The path to the file.
   * @returns {string} Returns the creation string.
   */
  static getCreationString(error, name, paths) {
    if (!paths.hasOwnProperty(name)) return `%no% Failed to generate output. Missing key "${name}".`;

    let string = `%yes% Successfully generated ${name} on path "%cyan%${paths[name].path}%white%"`;

    if (error) string = `%no% Unable to generate ${name}`;

    return string;
  }

  /**
   * Get all available colores.
   *
   * @returns {object} Returns an object with all available colors.
   */
  static getColors() {
    return colors;
  }

  /**
   * Clones an object with the safest way, so the source object will not be touched.
   *
   * @param {object} source The object that should be cloned.
   * @returns {object} Returns a clone of the source object.
   */
  static safeClone(source) {
    return JSON.parse(JSON.stringify(source));
  }
}

exports.GenHelper = GenHelper;