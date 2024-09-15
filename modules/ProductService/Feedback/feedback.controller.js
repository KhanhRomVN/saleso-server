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
  create: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id, rating, comment, images = [] } = req.body;
      const user_id = req.user._id.toString();
      const product = await ProductModel.getById(product_id);
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

      await FeedbackModel.create(feedbackData);
      return { message: "Feedback created successfully" };
    }),

  reply: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { feedbackId } = req.params;
      const { comment } = req.body;
      const user_id = req.user._id.toString();
      const feedback = await FeedbackModel.getById(feedbackId);
      if (user_id !== feedback.owner_id) {
        throw new Error("Unauthorized to reply to this feedback");
      }

      const replyData = {
        comment,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await FeedbackModel.reply(feedbackId, replyData);
      return { message: "Feedback replied successfully" };
    }),

  delete: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { feedbackId } = req.params;
      const user_id = req.user._id.toString();

      const feedback = await FeedbackModel.getById(feedbackId);
      if (!feedback) {
        throw new Error("Feedback not found");
      }

      if (feedback.user_id !== user_id && feedback.owner_id !== user_id) {
        throw new Error("Unauthorized to delete this feedback");
      }

      await FeedbackModel.delete(feedbackId);
      return { message: "Feedback deleted successfully" };
    }),

  getByProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      const feedbacks = await FeedbackModel.getByProduct(productId, skip, limit);

      const feedbacksWithUserData = await Promise.all(
        feedbacks.map(async (feedback) => {
          const user = await UserModel.getById(feedback.user_id, "customer");
          return { ...feedback, username: user.username };
        })
      );

      return feedbacksWithUserData;
    }),

  getFiltered: async (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id, user_id, rating, page = 1, limit = 10 } = req.query;
      const owner_id = req.user._id.toString();
      const skip = (page - 1) * limit;

      const params = {
        owner_id,
        product_id,
        user_id,
        rating: rating ? parseInt(rating) : undefined,
        skip,
        limit: parseInt(limit),
      };

      const feedbackList = await FeedbackModel.getFiltered(params);

      const enrichedFeedbackList = await Promise.all(
        feedbackList.map(async (feedback) => {
          const [user, product] = await Promise.all([
            UserModel.getById(feedback.user_id, "customer"),
            ProductModel.getById(feedback.product_id),
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
      const { productId } = req.params;
      return await FeedbackModel.getAverageRatingForProduct(productId);
    }),
};

module.exports = FeedbackController;
