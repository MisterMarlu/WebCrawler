const fs = require('fs'),
  cp = require("child_process"),
  inquirer = require('inquirer'),
  GenHelper = require('./GenHelper'),
  genConfig = require('./genConfig');

/**
 * Class that generates files from stub.
 */
class GenFiles {

  /**
   * @see GenFiles.
   */
  constructor() {
    this._configStub = require('./stubs/configStub');
    this._directories = GenHelper.getImportantDirs();
    this._questions = GenHelper.safeClone(genConfig.questions);
    this._comments = GenHelper.safeClone(genConfig.comments);
    this._databaseInfo = GenHelper.safeClone(genConfig.databaseInfo);
    this._moduleInfo = GenHelper.safeClone(genConfig.moduleInfo);
    this._quickStartInfo = GenHelper.safeClone(genConfig.quickStartInfo);
    this._paths = GenHelper.safeClone(genConfig.paths);
    this._replacements = GenHelper.safeClone(genConfig.replacements);

    this.setReplacements();
    this.replaceObjectString(this._paths);
  }

  /**
   * Generate correct content from stub file.
   *
   * @param {string} stubFile Name of the stub file with extension.
   * @returns {string} Returns the generated content as string.
   */
  genContent(stubFile) {
    let stub = fs.readFileSync(`${this._directories.stubsDir}/${stubFile}`),
      lines = stub.toString().split("\r\n");

    for (let i = 0; i < lines.length; i += 1) {
      for (let j = 0; j < this._replacements.length; j += 1) {
        lines[i] = GenHelper.replace(lines[i], this._replacements[j]);
      }
    }

    return lines.join("\r\n");
  }

  interpretFile(filePath, loops = {}) {
    let stub = fs.readFileSync(filePath),
      lines = stub.toString().split("\r\n"),
      newLines = [],
      loopLines = [],
      loopType = '',
      inLoop = false;

    for (let i = 0; i < lines.length; i += 1) {
      let line = lines[i];

      if (line.includes('%%loop')) {
        loopType = line.substring(line.lastIndexOf('=') + 1, line.lastIndexOf(';'));
        inLoop = true;
        continue;
      }

      if (line.includes('%%endloop')) {
        inLoop = false;

        if (!loops.hasOwnProperty(loopType)) continue;

        for (let j = 0; j < loops[loopType].length; j += 1) {
          for (let k = 0; k < loopLines.length; k += 1) {
            let replacement = {
              pattern: `%${loopType}%`,
              replacement: loops[loopType][j],
            };

            line = GenHelper.replace(loopLines[k], replacement);

            for (let j = 0; j < this._replacements.length; j += 1) {
              line = GenHelper.replace(line, this._replacements[j]);
            }

            newLines.push(line);
          }
        }

        loopType = '';
        continue;
      }

      if (inLoop) {
        loopLines.push(line);
        continue;
      }

      for (let j = 0; j < this._replacements.length; j += 1) {
        line = GenHelper.replace(line, this._replacements[j]);
      }

      newLines.push(line);
    }

    return newLines.join("\r\n");
  }

  /**
   * Generate correct content for quick start.
   *
   * @returns {string} Returns the generated content as string.
   */
  async genQuickStart() {
    let replacements = [
        {
          pattern: '%sectionAddModules%',
          replacement: this._quickStartInfo.modules ? await this.genAddModules() : '',
        },
        {
          pattern: '%sectionCallbacks%',
          replacement: this._quickStartInfo.callbacks ? this.genCallbacks() : '',
        },
        {
          pattern: '%sectionSetCallback%',
          replacement: this._quickStartInfo.callbacks ? this.genSetCallbacks() : '',
        },
      ],
      content = this.genContent('quickStartStub.js'),
      lines = content.split("\r\n");

    for (let i = 0; i < lines.length; i += 1) {
      for (let j = 0; j < replacements.length; j += 1) {
        lines[i] = GenHelper.replace(lines[i], replacements[j]);
      }
    }

    return lines.join("\r\n");
  }

  genAddModules() {
    let content = `// ${this._comments.addModule}` + "\r\n";

    for (let i = 0; i < this._quickStartInfo.moduleNames.length; i += 1) {
      let moduleName = this._quickStartInfo.moduleNames[i],
        replacement = {
          pattern: '%pathToModule%',
          replacement: `/${this._quickStartInfo.moduleDirName}/${moduleName}`,
        };

      this.addReplacement(replacement);
      content += this.genContent('quickStart/addModule.js');
      content += "\r\n";
    }

    return content;
  }

  getCallbackArray() {
    let callbackDir = `${this._directories.stubsDir}/quickStart/callbacks`,
      callbackList = fs.readdirSync(callbackDir),
      callbacks = [];

    for (let i = 0; i < callbackList.length; i += 1) {
      let file = callbackList[i],
        fileArray = file.split('.');

      if (fileArray[fileArray.length - 1] !== 'js') continue;

      let callback = {
        name: fileArray[0],
        file: `${callbackDir}/${file}`,
      };

      callbacks.push(callback);
    }

    return callbacks;
  }

  genCallbacks() {
    let content = '',
      callbackArray = this.getCallbackArray(),
      loops = {};

    if (this._quickStartInfo.modules) loops['ModuleName'] = this._quickStartInfo.moduleNames;

    for (let i = 0; i < callbackArray.length; i += 1) {
      content += this.interpretFile(callbackArray[i].file, loops);
      content += "\r\n";

      if ((i + 1) < callbackArray.length) content += "\r\n";
    }

    return content;
  }

  genSetCallbacks() {
    let content = `// ${this._comments.setCallback}` + "\r\n",
      callbackArray = this.getCallbackArray();

    for (let i = 0; i < callbackArray.length; i += 1) {
      let replacements = [
        {
          pattern: '%callbackName%',
          replacement: callbackArray[i].name,
        },
        {
          pattern: '%callbackFunctionName%',
          replacement: `${callbackArray[i].name}Callback`,
        },
      ];

      this.addReplacements(replacements);
      content += this.genContent('quickStart/setCallback.js');
      content += "\r\n";
    }

    return content;
  }

  /**
   * Set replacements.
   */
  setReplacements() {
    for (let i = 0; i < this._replacements.length; i += 1) {
      let string = this._replacements[i].replacement,
        type = string.split('%').join('');

      if (!this._directories.hasOwnProperty(type)) continue;

      let replacement = this._directories[type];

      this._replacements[i].replacement = GenHelper.replace(string, string, replacement);
    }
  }

  /**
   * Add a new replacement.
   *
   * @param {object} replacement The replacement object that should be added or updated.
   * @param {string} replacement.pattern The pattern for this replacement.
   * @param {*} replacement.replacement The replacement value.
   */
  addReplacement(replacement) {
    let exists = false;

    for (let i = 0; i < this._replacements.length; i += 1) {
      if (this._replacements[i].pattern !== replacement.pattern) continue;
      exists = true;
      this._replacements[i].replacement = replacement.replacement;
    }

    if (!exists) this._replacements.push(replacement);
  }

  /**
   * Add new replacements.
   *
   * @param {object[]} replacements The replacement objects that should be added or updated in an array.
   * @param {string} replacements[].pattern The pattern for this replacement.
   * @param {*} replacements[].replacement The replacement value.
   */
  addReplacements(replacements) {
    for (let i = 0; i < replacements.length; i += 1) {
      this.addReplacement(replacements[i]);
    }
  }

  /**
   * Deep replacing of strings in objects.
   *
   * @param {object} object An object where all strings should be replaced with a given pattern.
   */
  replaceObjectString(object) {
    for (let property in object) {
      if (!object.hasOwnProperty(property)) continue;
      if (typeof object[property] === 'object') {
        this.replaceObjectString(object[property]);
        continue;
      }

      if (typeof object[property] !== 'string') continue;

      for (let i = 0; i < this._replacements.length; i += 1) {
        object[property] = GenHelper.replace(object[property], this._replacements[i]);
      }
    }
  }
}

module.exports = GenFiles;