/**
 * Formatter is a helper class and just has static methods.
 */
class Formatter {

  /**
   * Converts the first letter of a string to upper case.
   *
   * @param {string} string The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static toUpperFirst(string) {
    if (typeof string !== 'string') {
      throw `The parameter must be type of "string", given is type of "${typeof string}"`;
    }

    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Convert camelCase to snake_case.
   *
   * @param {string} camel The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static camelToUnderscore(camel) {
    return camel.replace(/\.?([A-Z])/g, function (x, y) {
      return "_" + y.toLowerCase()
    }).replace(/^_/, "");
  }

  /**
   * Convert dash-case to camelCase.
   *
   * @param {string} dash The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static dashToCamel(dash) {
    return dash.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  }

  /**
   * Convert snake_case to dash-case.
   *
   * @param {string} underscore The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static underscoreToDash(underscore) {
    return underscore.replace('_', '-');
  }

  /**
   * Convert camelCase to dash-case.
   *
   * @param {string} camel The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static camelToDash(camel) {
    let underscore = this.camelToUnderscore(camel);

    return this.underscoreToDash(underscore);
  }

  /**
   * Convert dash-case to snake_case.
   *
   * @param {string} dash The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static dashToUnderscore(dash) {
    let camel = this.dashToCamel(dash);

    return this.camelToUnderscore(camel);
  }

  /**
   * Convert snake_case to camelCase.
   *
   * @param {string} underscore The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static underscoreToCamel(underscore) {
    let dash = this.underscoreToDash(underscore);

    return this.dashToCamel(dash);
  }

  /**
   * Convert underscore to whitespaces.
   *
   * @param {string} underscore The string that should be converted.
   * @returns {string} Returns the converted string.
   */
  static underscoreToWhitespace(underscore) {
    return underscore.replace('_', ' ');
  }
}

exports.Formatter = Formatter;