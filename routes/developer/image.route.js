const express = require("express");
const { ImageController } = require("../../controller/index");
const router = express.Router();

router.post("/add/category", ImageController.addCategory);
router.post("/add/banner", ImageController.addBanner);
router.post("/categories", ImageController.getCategories);
router.post("/banners", ImageController.getBanners);
router.post("/category/:id", ImageController.deleteCategory);
router.post("/banner/:id", ImageController.deleteBanner);

module.exports = router;
