# WebCrawler

Web crawler to crawl through a specific website.

### Available parameters  

| Parameter   | Type    | Default                   | Description                                                   |  
| ----------- | ------- | ------------------------- | ------------------------------------------------------------- |  
| startUrl    | string  | `https://www.phpdoc.org/` | Full url with correct protocol *(http recommend)*             |  
| pageLimit   | number  | `0`                       | Limitation of websites to be crawled *(`0` for infinity)*     |  
| screenshots | boolean | `false`                   | if `true` screenshots would be made for each customer website |  
| debug       | boolean | `false`                   | if `true` you get a lot of output for debugging               |  