const Joi = require("joi");
const { getDB } = require("../../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "feedbacks";
const COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required(),
  is_owner: Joi.boolean().required(),
  product_id: Joi.string().required(),
  owner_id: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  reply: Joi.object({
    comment: Joi.string().required(),
    createdAt: Joi.date().default(Date.now),
    updatedAt: Joi.date().default(Date.now),
  }),
  createdAt: Joi.date().default(Date.now),
  updatedAt: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const FeedbackModel = {
  createFeedback: async (feedbackData) =>
    handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(feedbackData);
      if (error) throw new Error(error.details[0].message);
      const result = await collection.insertOne(feedbackData);
      return result.insertedId;
    }),

  replyFeedback: async (feedback_id, replyData) =>
    handleDBOperation(async (collection) => {
      await collection.updateOne(
        { _id: new ObjectId(feedback_id) },
        { $set: { reply: replyData } }
      );
    }),

  deleteFeedback: async (feedback_id) =>
    handleDBOperation(async (collection) => {
      await collection.deleteOne({ _id: new ObjectId(feedback_id) });
    }),

  getFeedbackById: async (feedback_id) =>
    handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(feedback_id) });
    }),

  getAllFeedbacks: async (start, end, ownerId) =>
    handleDBOperation(async (collection) => {
      const feedbacks = await collection
        .find({ owner_id: ownerId })
        .sort({ createdAt: -1 })
        .skip(start - 1)
        .limit(end - start + 1)
        .toArray();
      return feedbacks;
    }),

  getCustomerFeedbacks: async (userId, start, end, ownerId) =>
    handleDBOperation(async (collection) => {
      const feedbacks = await collection
        .find({ user_id: userId, owner_id: ownerId })
        .sort({ createdAt: -1 })
        .skip(start - 1)
        .limit(end - start + 1)
        .toArray();
      return feedbacks;
    }),

  getProductFeedbacks: async (productId, start, end) =>
    handleDBOperation(async (collection) => {
      const feedbacks = await collection
        .find({ product_id: productId })
        .sort({ createdAt: -1 })
        .skip(start - 1)
        .limit(end - start + 1)
        .toArray();
      return feedbacks;
    }),

  getFilteredFeedbacks: async (params) =>
    handleDBOperation(async (collection) => {
      const { owner_id, product_id, rating, start, end } = params;

      const filters = { owner_id };
      if (product_id) filters.product_id = product_id;
      if (rating) filters.rating = rating;

      const feedbacks = await collection
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(start - 1)
        .limit(end - start + 1)
        .toArray();
      return feedbacks;
    }),

  getAverageRatingForProduct: async (product_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) throw new Error("Invalid product ID");

      const result = await collection
        .aggregate([
          { $match: { product_id: product_id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
              ratingCounts: {
                $push: {
                  rating: "$rating",
                  count: 1,
                },
              },
            },
          },
          { $unwind: "$ratingCounts" },
          {
            $group: {
              _id: "$ratingCounts.rating",
              count: { $sum: "$ratingCounts.count" },
              averageRating: { $first: "$averageRating" },
              totalReviews: { $first: "$totalReviews" },
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $first: "$averageRating" },
              totalReviews: { $first: "$totalReviews" },
              ratingDistribution: {
                $push: {
                  rating: "$_id",
                  count: "$count",
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              averageRating: { $round: ["$averageRating", 1] },
              totalReviews: 1,
              ratingDistribution: 1,
            },
          },
        ])
        .toArray();

      if (result.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: [
            { rating: 1, count: 0 },
            { rating: 2, count: 0 },
            { rating: 3, count: 0 },
            { rating: 4, count: 0 },
            { rating: 5, count: 0 },
          ],
        };
      }

      const fullRatingDistribution = [1, 2, 3, 4, 5].map((rating) => {
        const found = result[0].ratingDistribution.find(
          (r) => r.rating === rating
        );
        return found ? found : { rating, count: 0 };
      });

      return {
        ...result[0],
        ratingDistribution: fullRatingDistribution,
      };
    }),
};

module.exports = FeedbackModel;
