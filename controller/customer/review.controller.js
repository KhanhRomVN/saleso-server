const { ReviewModel } = require("../../models/index");
const logger = require("../../config/logger");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in ${operation.name}: ${error}`);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const ReviewController = {
  createReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const reviewData = {
        ...req.body,
        user_id: req.user._id.toString(),
      };
      const newReview = await ReviewModel.createReview(reviewData);
      return { message: "Review added successfully", review: newReview };
    }),

  getReviewById: (req, res) =>
    handleRequest(req, res, async (req) =>
      ReviewModel.getReviewById(req.params.review_id)
    ),

  getReviewsByProductId: (req, res) =>
    handleRequest(req, res, async (req) =>
      ReviewModel.getReviewsByProductId(req.params.product_id)
    ),

  getReviewsByUserId: (req, res) =>
    handleRequest(req, res, async (req) =>
      ReviewModel.getReviewsByUserId(req.params.user_id)
    ),

  updateReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const updatedReview = await ReviewModel.updateReview(
        req.params.review_id,
        req.user._id.toString(),
        req.body
      );
      return { message: "Review updated successfully", review: updatedReview };
    }),

  deleteReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      await ReviewModel.deleteReview(
        req.params.review_id,
        req.user._id.toString()
      );
      return { message: "Review deleted successfully" };
    }),

  likeReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const updatedReview = await ReviewModel.likeReview(
        req.params.review_id,
        req.user._id.toString()
      );
      return { message: "Review liked successfully", review: updatedReview };
    }),

  unlikeReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const updatedReview = await ReviewModel.unlikeReview(
        req.params.review_id,
        req.user._id.toString()
      );
      return { message: "Review unliked successfully", review: updatedReview };
    }),

  getProductRating: (req, res) =>
    handleRequest(req, res, async (req) =>
      ReviewModel.getAverageRatingForProduct(req.params.product_id)
    ),
};

module.exports = ReviewController;
