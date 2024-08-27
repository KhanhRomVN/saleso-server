const { FeedbackModel, UserModel, ProductModel } = require("../../../models");
const logger = require("../../../config/logger");

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

const FeedbackController = {
  createFeedback: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id, rating, comment, images = [] } = req.body;
      const user_id = req.user._id.toString();
      const product = await ProductModel.getProductByProdId(product_id);
      const is_owner = user_id === product.seller_id;

      const feedbackData = {
        user_id,
        is_owner,
        product_id,
        owner_id: product.seller_id,
        rating,
        comment,
        images,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await FeedbackModel.createFeedback(feedbackData);
      return { message: "Feedback created successfully" };
    }),

  replyFeedback: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { feedback_id } = req.params;
      const { comment } = req.body;
      const user_id = req.user._id.toString();
      const feedback = await FeedbackModel.getFeedbackById(feedback_id);
      if (user_id !== feedback.owner_id) {
        return {
          error: "You do not have permission to respond to this comment",
        };
      }

      const replyData = {
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await FeedbackModel.replyFeedback(feedback_id, replyData);
      return { message: "Feedback replied successfully" };
    }),

  deleteFeedback: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { feedback_id } = req.params;
      const user_id = req.user._id.toString();

      const feedback = await FeedbackModel.getFeedbackById(feedback_id);
      if (!feedback) {
        throw new Error("Feedback not found");
      }

      if (feedback.user_id !== user_id || feedback.owner_id !== user_id) {
        throw new Error("Unauthorized to delete this feedback");
      }

      await FeedbackModel.deleteFeedback(feedback_id);
      return { message: "Feedback deleted successfully" };
    }),

  getProductFeedbacks: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id, start = 1, end = 10 } = req.body;
      const feedbacks = await FeedbackModel.getProductFeedbacks(
        product_id,
        start,
        end
      );

      const feedbacksWithUserData = await Promise.all(
        feedbacks.map(async (feedback) => {
          const user = await UserModel.getUserById(
            feedback.user_id,
            "customer"
          );
          return {
            ...feedback,
            username: user.username,
          };
        })
      );

      return feedbacksWithUserData;
    }),

  getFilteredFeedbacks: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id, user_id, rating, start = 1, end = 10 } = req.body;
      const owner_id = req.user._id.toString();

      const params = {
        owner_id,
        start: parseInt(start),
        end: parseInt(end),
      };

      if (product_id) params.product_id = product_id;
      if (user_id) params.user_id = user_id;
      if (rating) params.rating = parseInt(rating);

      const feedbackList = await FeedbackModel.getFilteredFeedbacks(params);

      const enrichedFeedbackList = await Promise.all(
        feedbackList.map(async (feedback) => {
          const [user, product] = await Promise.all([
            UserModel.getUserById(feedback.user_id, "customer"),
            ProductModel.getProductByProdId(feedback.product_id),
          ]);

          return {
            ...feedback,
            username: user.username,
            product_name: product.name,
            product_image: product.images[0] || null,
          };
        })
      );

      return enrichedFeedbackList;
    }),

  getProductRating: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const rating = await FeedbackModel.getAverageRatingForProduct(product_id);
      return rating;
    }),
};

module.exports = FeedbackController;
