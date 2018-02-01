/**
 * Class Formatter.
 */
class Formatter {

  /**
   * Converts the first letter of a string to upper case.
   *
   * @param string: String
   * @returns {string}
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
   * @param camel: String
   * @returns {String}
   */
  static camelToUnderscore(camel) {
    return camel.replace(/\.?([A-Z])/g, function (x, y) {
      return "_" + y.toLowerCase()
    }).replace(/^_/, "");
  }

  /**
   * Convert dash-case to camelCase.
   *
   * @param dash: String
   * @returns {String}
   */
  static dashToCamel(dash) {
    return dash.replace(/-([a-z])/g, function (g) {
      return g[1].toUpperCase();
    });
  }

  /**
   * Convert snake_case to dash-case.
   *
   * @param underscore: String
   * @returns {String}
   */
  static underscoreToDash(underscore) {
    return underscore.replace('_', '-');
  }

  /**
   * Convert camelCase to dash-case.
   *
   * @param camel: String
   * @returns {String}
   */
  static camelToDash(camel) {
    let underscore = this.camelToUnderscore(camel);

    return this.underscoreToDash(underscore);
  }

  /**
   * Convert dash-case to snake_case.
   *
   * @param dash: String
   * @returns {String}
   */
  static dashToUnderscore(dash) {
    let camel = this.dashToCamel(dash);

    return this.camelToUnderscore(camel);
  }

  /**
   * Convert snake_case to camelCase.
   *
   * @param underscore: String
   * @returns {String}
   */
  static underscoreToCamel(underscore) {
    let dash = this.underscoreToDash(underscore);

    return this.dashToCamel(dash);
  }

  /**
   * Convert underscore to whitespaces.
   *
   * @param underscore: String
   * @returns {String}
   */
  static underscoreToWhitespace(underscore) {
    return underscore.replace('_', ' ');
  }
}

exports.Formatter = new Formatter();