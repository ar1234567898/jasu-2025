const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const baseUrl = "https://jasu2025.eu/virtual-booth.php?id=";
const result = {};
let id = 1;
let consecutiveMissing = 0;

(async () => {
  while (true) {
    const url = `${baseUrl}${id}`;
    try {
      const response = await axios.get(url, {
        validateStatus: (status) => status < 500, // Handle 404 manually
      });

      if (response.status === 404) {
        console.log(`❌ Page ${id} not found (404). Stopping.`);
        break;
      }

      const $ = cheerio.load(response.data);
      const imgSrc = $(".grid-image2").attr("src");

      if (imgSrc) {
        const fullUrl = imgSrc.startsWith("http")
          ? imgSrc
          : `https://jasu2025.eu/${imgSrc}`;
        result[id] = fullUrl;
        console.log(`ID ${id}: ✅ Image found`);
        consecutiveMissing = 0; // reset counter
      }

      if (!imgSrc) {
        consecutiveMissing++;
        console.log(
          `ID ${id}: ⚠️ No image found (${consecutiveMissing} missing in a row)`
        );

        if (consecutiveMissing >= 2) {
          console.log(`🛑 Stopping: 2 images in a row not found.`);
          fs.writeFileSync("images.json", JSON.stringify(result, null, 2));
          console.log("📁 Done. Saved to images.json");
          break;
        }
      }

      id++;
    } catch (err) {
      console.error(`❌ Error on ID ${id}:`, err.message);
      break;
    }
  }
})();
