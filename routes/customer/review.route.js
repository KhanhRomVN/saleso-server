const express = require("express");
const { ReviewController } = require("../../controller/index");
const { authToken } = require("../../middleware/authToken");
const router = express.Router();

//* Add Review
router.post("/add-review", authToken, ReviewController.addReview);

//* Get Review
router.post("/get-list-product-review", ReviewController.getListReviewByProdId);
router.post("/get-list-user-review", ReviewController.getListReviewByUserId);
router.post("/get-static-review", ReviewController.getStaticReview);

//* Update Review
router.post("/update-comment", authToken, ReviewController.updateComment);
router.post("/update-rate", authToken, ReviewController.updateRate);

//* Delete Review (For Customer)
router.post("/del-review", authToken, ReviewController.delReview);

module.exports = router;
