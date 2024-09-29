const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

async function downloadImage(imgUrl, dir) {
  try {
    const response = await axios({
      url: imgUrl,
      responseType: 'stream'
    });

    const imgName = path.basename(imgUrl);
    const filePath = path.resolve(dir, imgName);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Error downloading image ${imgUrl}`);
  }
}

async function fetchImagesFromJsonp(contentUrl, dir) {
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
        await downloadImage(imgUrl, dir);
      }
    }
  } catch (error) {
    throw new Error(`Error processing JSONP ${contentUrl}`);
  }
}

async function scrapeScribd(url, dir, pdf = false) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const scriptText = $('script:contains("docManager.addPage")').html();
    const contentUrlRegex = /contentUrl:\s*"(https:\/\/[^\"]+\.jsonp)"/g;
    let match;

    while ((match = contentUrlRegex.exec(scriptText)) !== null) {
      const contentUrl = match[1];
      await fetchImagesFromJsonp(contentUrl, dir);
    }

    if (pdf) {
      await imagesToPDF(dir);
      const images = fs.readdirSync(dir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
      for (const image of images) {
        fs.unlinkSync(path.join(dir, image));
      }
    }
  } catch (error) {
    console.error(`Error processing main page:`, error.message);
  }
}

async function imagesToPDF(dir) {
  const doc = new PDFDocument({ autoFirstPage: false });
  const outputFilePath = path.join(dir, 'file.pdf');
  const stream = fs.createWriteStream(outputFilePath);
  doc.pipe(stream);

  const images = fs.readdirSync(dir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));

  for (const image of images) {
    const imgPath = path.join(dir, image);
    const img = doc.openImage(imgPath);

    doc.addPage({ size: [img.width, img.height] });
    doc.image(imgPath, 0, 0, { width: img.width, height: img.height });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

module.exports = scrapeScribd;
