const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function downloadImage(imgUrl, imgNum, dir) {
  try {
    const response = await axios({
      url: imgUrl,
      responseType: 'stream'
    });

    const filePath = path.resolve(dir, `${imgNum}.jpg`);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Error downloading image ${imgNum}`);
  }
}

async function fetchImagesFromJsonp(contentUrl, imgNum, dir) {
  try {
    const response = await axios.get(contentUrl);
    const data = response.data;

    const jsonpContent = data.match(/window\.\w+_callback\(\[\"(.+)\"\]\);/);

    if (jsonpContent && jsonpContent[1]) {
      const htmlContent = jsonpContent[1];
      const $ = cheerio.load(htmlContent);
      let imgUrl = $('img').attr('orig');
      if (imgUrl) {
        imgUrl = imgUrl.replace(/\\\"/g, '').replace(/\/$/, '');
        await downloadImage(imgUrl, imgNum, dir);
      }
    }
  } catch (error) {
    throw new Error(`Error processing JSONP ${contentUrl}`);
  }
}

async function scrapeScribd(url, dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const scriptText = $('script:contains("docManager.addPage")').html();
    const contentUrlRegex = /contentUrl:\s*"(https:\/\/[^\"]+\.jsonp)"/g;
    let match;
    let imgNum = 1;

    console.log("Downloading images...");

    while ((match = contentUrlRegex.exec(scriptText)) !== null) {
      const contentUrl = match[1];
      await fetchImagesFromJsonp(contentUrl, imgNum, dir);
      imgNum++;
    }

    console.log(`All images downloaded at: ${dir}`);
  } catch (error) {
    console.error(`Error processing main page:`, error.message);
  }
}

module.exports = scrapeScribd;
