# [scribd-scraper](https://www.npmjs.com/package/scribd-scraper)

This tool scrapes Scribd documents, downloading images from each page and converting to PDF.

## How to use

Install the package:

```bash
npm i scribd-scraper
```
## Examples
### Only download images

```javascript
const scrapeScribd = require('scribd-scraper');

const url = 'https://pt.scribd.com/document/477711709/1990-02-mara-maravilha-pdf';
const dir = './images';

scrapeScribd(url, dir)
  .then(() => {
    console.log("Images downloaded successfully.");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
```

### Download and convert to PDF

```javascript
const scrapeScribd = require('scribd-scraper');

const url = 'https://pt.scribd.com/document/477711709/1990-02-mara-maravilha-pdf';
const dir = './images';
const pdf = true;

scrapeScribd(url, dir, pdf)
  .then(() => {
    console.log("Images downloaded and converted to PDF successfully.");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
```

