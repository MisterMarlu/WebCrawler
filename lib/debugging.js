// Define some globals for better debugging.
if (typeof __stack === 'undefined') {
  /**
   * Define __stack for __line.
   */
  Object.defineProperty(global, '__stack', {
    get: function () {
      let orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function (_, stack) {
        return stack;
      };
      let err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      let stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
    }
  });

  if (typeof __line === 'undefined') {
    /**
     * Define __line for debugging.
     */
    Object.defineProperty(global, '__line', {
      get: function () {
        return __stack[1].getLineNumber();
      }
    });
  }
}