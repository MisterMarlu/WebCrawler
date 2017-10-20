/**
 * @author lbraun
 * @date 13.10.2017
 * @licence MIT
 */

const {Chromeless} = require('chromeless');

async function run() {
  const chromeless = new Chromeless();

  const screenshot = await chromeless
    .goto('http://www.swingerclub-saphir.de/impressum')
    .wait(100)
    .scrollTo(0, 3500)
    .setViewport({width: 1920, height: 3500, scale: 1})
    .screenshot({filePath: '/var/www/html/webcrawler/manually/shot.png'});

  console.log(screenshot); // prints local file path or S3 url

  await chromeless.end();
}

run().catch(console.error.bind(console));
