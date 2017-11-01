# WebCrawler

An easy script to crawl through websites. This crawler is not searching for anything but can be
extended very easy via asynchronous callback function.


Some configurations can be modified by creating a web-crawler.json file with specific parameters.

### Available parameters  

| Parameter   | Type    | Default                   | Description                                                   |  
| ----------- | ------- | ------------------------- | ------------------------------------------------------------- |  
| startUrl    | string  | `https://www.phpdoc.org/` | Full url with correct protocol *(`http` recommend)*           |  
| pageLimit   | number  | `0`                       | Limitation of websites to be crawled *(`0` for infinity)*     |  
| screenShots | boolean | `false`                   | if `true` screenshots would be made for each customer website |  
| debug       | boolean | `false`                   | if `true` you get a lot of output for debugging               |  