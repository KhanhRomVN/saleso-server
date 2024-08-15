const { ReviewModel, UserModel } = require("../../models/index");
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

// Create 1 hàm để check xem khách hàng đã mua sản phẩm này chưa (tạm thời chưa cần code)

const ReviewController = {
  createReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const user = await UserModel.getUserById(customer_id, "customer");
      const reviewData = {
        ...req.body,
        username: user.username,
        customer_id,
        likes: [],
        reply: [],
      };
      await ReviewModel.createReview(reviewData);
      return { message: "Create review successfully!" };
    }),

  replyReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { review_id } = req.params;
      const customer_id = req.user._id.toString();
      const user = await UserModel.getUserById(customer_id, "customer");
      const username = user.username;
      const replyData = {
        ...req.body,
        customer_id,
        username,
        likes: [],
        reply: [],
      };
      await ReviewModel.replyReview(review_id, replyData);
      return { message: "Reply review successfully" };
    }),

  getReviewById: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { review_id } = req.params;
      return await ReviewModel.getReviewById(review_id);
    }),

  getReviewsByProductId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      return await ReviewModel.getReviewsByProductId(product_id);
    }),

  getReviewsByCustomerId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { customer_id } = req.params;
      return await ReviewModel.getReviewsByCustomerId(customer_id);
    }),

  deleteReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { review_id } = req.params;
      return await ReviewModel.deleteReview(review_id);
    }),

  likeReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const { review_id } = req.params;
      return await ReviewModel.likeReview(review_id, customer_id);
    }),

  unlikeReview: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const { review_id } = req.params;
      return await ReviewModel.unlikeReview(review_id, customer_id);
    }),

  getProductRating: (req, res) =>
    handleRequest(req, res, async (req) =>
      ReviewModel.getAverageRatingForProduct(req.params.product_id)
    ),
};

module.exports = ReviewController;
