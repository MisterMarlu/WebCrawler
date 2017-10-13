/**
 * @author lbraun
 * @date 13.10.2017
 * @licence MIT
 */

const {Chromeless} = require('chromeless');

async function run() {
  const chromeless = new Chromeless();

  const screenshot = await chromeless
    .goto('http://www.ladies.de/Home')
    .wait(500)
    .setViewport({width: 1080, height: 5000, scale: 1})
    .screenshot({filePath: '/var/www/html/webcrawler/shot.png'});

  console.log(screenshot); // prints local file path or S3 url

  await chromeless.end();
}

run().catch(console.error.bind(console));

// const { Chromeless } = require('chromeless');
//
// function run() {
//   const chromeless = new Chromeless();
//
//   const screenshot = chromeless
//     .goto('http://www.ladies.de/Home')
//     .wait(500)
//     .setViewport({width: 1080, height: 5000, scale: 1})
//     .screenshot();
//
//   console.log(screenshot); // prints local file path or S3 url
//
//   chromeless.end();
// }
//
// run().catch(console.error.bind(console));