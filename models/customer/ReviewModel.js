const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "reviews";
const COLLECTION_SCHEMA = Joi.object({
  customer_id: Joi.string().required(),
  username: Joi.string().required(),
  product_id: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  likes: Joi.array().items(Joi.string()),
  reply: Joi.array().items(Joi.string()),
  verified_purchase: Joi.boolean().default(false),
});

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const ReviewModel = {
  createReview: async (reviewData) =>
    handleDBOperation(async (collection) => {
      const { error } = COLLECTION_SCHEMA.validate(reviewData);
      if (error) throw new Error(error.details[0].message);
      await collection.insertOne(reviewData);
    }),

  getReviewById: async (reviewId) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(reviewId)) throw new Error("Invalid review ID");
      return await collection.findOne({ _id: new ObjectId(reviewId) });
    }),

  getReviewsByProductId: async (productId) =>
    handleDBOperation(async (collection) => {
      return await collection.find({ product_id: productId }).toArray();
    }),

  getReviewsByCustomerId: async (customer_id) =>
    handleDBOperation(async (collection) => {
      return await collection.find({ customer_id: customer_id }).toArray();
    }),

  replyReview: async (review_id, replyData) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");

      const { error } = COLLECTION_SCHEMA.validate(replyData);
      if (error) throw new Error(error.details[0].message);

      const result = await collection.insertOne(replyData);
      const newReplyId = result.insertedId;

      const updateResult = await collection.findOneAndUpdate(
        { _id: new ObjectId(review_id) },
        {
          $push: {
            reply: newReplyId.toString(),
          },
        },
        { returnDocument: "after" }
      );
    }),

  deleteReview: async (reviewId) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(reviewId)) throw new Error("Invalid review ID");
      const result = await collection.deleteOne({
        _id: new ObjectId(reviewId),
      });
      if (result.deletedCount === 0) throw new Error("Review not found");
      return { message: "Review deleted successfully" };
    }),

  likeReview: async (review_id, customer_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");
      const result = await collection.updateOne(
        { _id: new ObjectId(review_id) },
        { $push: { likes: customer_id } }
      );
      if (result.modifiedCount === 0) throw new Error("Review not found");
      return { message: "Review liked successfully" };
    }),

  unlikeReview: async (review_id, customer_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");
      const result = await collection.updateOne(
        { _id: new ObjectId(review_id) },
        { $pull: { likes: customer_id } }
      );
      if (result.modifiedCount === 0) throw new Error("Review not found");
      return { message: "Review unliked successfully" };
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

module.exports = ReviewModel;
