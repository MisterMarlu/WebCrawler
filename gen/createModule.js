const fs = require('fs'),
  inquirer = require("inquirer");

function start() {
  let questions = [
      {
        type: 'input',
        name: 'moduleName',
        message: 'Module name:',
        default: 'ModuleStub'
      },
      {
        type: 'input',
        name: 'moduleDir',
        message: 'Module directory:',
        default: 'modules'
      },
    ],
    prompt = inquirer.createPromptModule();

  prompt(questions).then(answers => {
    let dirArr = __dirname.split('/'),
      countBack = 2;

    for (let i = 0; i < countBack; i += 1) {
      dirArr.pop();
    }

    let moduleName = answers.moduleName,
      directory = dirArr.join('/'),
      stub = fs.readFileSync(`${__dirname}/ModuleStub.js`),
      lines = stub.toString().split("\r\n"),
      modulePath = `${directory}/${answers.moduleDir}`,
      path = `${modulePath}/${moduleName}.js`,
      options = {
        moduleName,
        path,
        content: '',
      };

    for (let i = 0; i < lines.length; i += 1) {
      lines[i] = lines[i].split('%ModuleStub%').join(moduleName);
    }

    options.content = lines.join("\r\n");

    if (!fs.existsSync(modulePath)) fs.mkdirSync(modulePath);
    if (fs.existsSync(path)) {
      let question = [
          {
            type: 'confirm',
            name: 'delete',
            message: `There is already a module called "${moduleName}". Overwrite?`,
          },
        ],
        confirm = inquirer.createPromptModule();

      confirm(question).then(answersTwo => {
        if (!answersTwo.delete) {
          start();
          return;
        }

        fs.unlinkSync(path);
        generateModule(options);
      });
      return;
    }

    generateModule(options);
  });
}

function generateModule(options) {
  fs.writeFile(options.path, options.content, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;

    // success case, the file was saved
    let cyan = "\x1b[36m",
      green = "\x1b[32m",
      white = "\x1b[37m",
      reset = "\x1b[0m";

    console.log();
    console.log(`${green}✔${white} Module "${cyan + options.moduleName + white}" generated on path "${cyan + options.path + white}".${reset}`);
  });
}

start();