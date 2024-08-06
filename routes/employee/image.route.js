const express = require("express");
const { ImageController } = require("../../controller/index");
const router = express.Router();

router.post("/add", ImageController.addImage);
router.get("/", ImageController.getImages);
router.delete("/:id", ImageController.deleteImage);
router.patch("/:id/path", ImageController.updateImagePath);
router.patch("/:id/url", ImageController.updateImageUrl);

module.exports = router;
