# [scribd-scraper](https://www.npmjs.com/package/scribd-scraper)

This package scrapes Scribd documents, downloading images from each page.

## How to use

Install the package:

```bash
npm install scribd-scraper
```

### Example

```javascript
const scrapeScribd = require('scribd-scraper');

const urlscribd = 'https://pt.scribd.com/document/477711709/1990-02-mara-maravilha-pdf';
const directory = './images';

scrapeScribd(urlscribd, directory)
  .then(() => {
    console.log("Images downloaded successfully.");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
```

