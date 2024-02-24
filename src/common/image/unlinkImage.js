const fs = require("fs");
const path = require("path");

function unlinkImage(imagePath) {
  if (!/^\/?public\//.test(imagePath)) {
    // If not, prepend "public/" to the path
    imagePath = path.join("public/", imagePath);
}

  const fileExists = fs.existsSync(imagePath);
  if (!fileExists) {
    console.log(`File ${imagePath} does not exist`);
    return;
  }

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.error(`Error deleting the file ${imagePath}:`, err);
    } else {
      console.log(`File ${imagePath} deleted successfully`);
    }
  });
}

module.exports = unlinkImage;

