const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const inputPath = 'js/table-data-compsci.json';
const outputPath = 'js/table-data-compsci-with-authors.json';

(async () => {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  for (let i = 0; i < data.length; i++) {
    const project = data[i];
    if (!project.details_url) continue;
    try {
      const res = await axios.get(project.details_url);
      const $ = cheerio.load(res.data);
      const strongs = $('.col-md-6 strong');
      if (strongs.length >= 2) {
        project.author = $(strongs[1]).text().trim();
        console.log(`ID ${project.id}: ${project.author}`);
      } else {
        project.author = '';
        console.log(`ID ${project.id}: author not found`);
      }
    } catch (e) {
      project.author = '';
      console.log(`ID ${project.id}: error`);
    }
  }
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Done!');
})();