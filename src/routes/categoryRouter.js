const express = require('express');
const { addNewCategory, allCategories, getCategory, updateCategoryById, allCategoriesByAccessType } = require('../controllers/categoryController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const fs = require('fs');
const userFileUploadMiddleware = require("../middlewares/fileUpload");

const UPLOADS_FOLDER_USERS = "./public/uploads/categories";
const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);
const convertHeicToPng = require('../middlewares/converter');

if (!fs.existsSync(UPLOADS_FOLDER_USERS)) {
  // If not, create the folder
  fs.mkdirSync(UPLOADS_FOLDER_USERS, { recursive: true }, (err) => {
      if (err) {
          console.error("Error creating uploads folder:", err);
      } else {
          console.log("Uploads folder created successfully");
      }
  });
} else {
  console.log("Uploads folder already exists");
}

router.post('/', [uploadUsers.single("image")], convertHeicToPng(UPLOADS_FOLDER_USERS), isValidUser, addNewCategory);
router.put('/:id', [uploadUsers.single("image")], convertHeicToPng(UPLOADS_FOLDER_USERS), isValidUser, updateCategoryById);
router.get('/acess-type', allCategoriesByAccessType);
router.get('/', allCategories);
router.get('/:id', isValidUser,getCategory);

module.exports = router;