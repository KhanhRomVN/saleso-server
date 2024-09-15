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
  create: async (feedbackData) =>
    handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(feedbackData);
      if (error) throw new Error(error.details[0].message);
      const result = await collection.insertOne(feedbackData);
      return result.insertedId;
    }),

  reply: async (feedbackId, replyData) =>
    handleDBOperation(async (collection) => {
      await collection.updateOne(
        { _id: new ObjectId(feedbackId) },
        { $set: { reply: replyData } }
      );
    }),

  delete: async (feedbackId) =>
    handleDBOperation(async (collection) => {
      await collection.deleteOne({ _id: new ObjectId(feedbackId) });
    }),

  getById: async (feedbackId) =>
    handleDBOperation(async (collection) => {
      return await collection.findOne({ _id: new ObjectId(feedbackId) });
    }),

  getByProduct: async (productId, skip, limit) =>
    handleDBOperation(async (collection) => {
      return await collection
        .find({ product_id: productId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    }),

  getFiltered: async ({ owner_id, product_id, user_id, rating, skip, limit }) =>
    handleDBOperation(async (collection) => {
      const filters = { owner_id, ...(product_id && { product_id }), ...(user_id && { user_id }), ...(rating && { rating }) };
      return await collection
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
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
