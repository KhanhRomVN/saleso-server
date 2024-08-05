const Joi = require("joi");
const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "reviews";
const COLLECTION_SCHEMA = Joi.object({
  user_id: Joi.string().required(),
  product_id: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  likes: Joi.number().default(0),
  helpful_count: Joi.number().default(0),
  images: Joi.array().items(Joi.string()),
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
      const { error, value } = COLLECTION_SCHEMA.validate(reviewData, {
        abortEarly: false,
      });
      if (error) {
        throw new Error(
          `Validation error: ${error.details.map((d) => d.message).join(", ")}`
        );
      }

      const now = new Date();
      const validatedReview = { ...value, createdAt: now, updatedAt: now };

      const result = await collection.insertOne(validatedReview);
      return { ...validatedReview, _id: result.insertedId };
    }),

  getReviewById: async (review_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");
      return await collection.findOne({ _id: new ObjectId(review_id) });
    }),

  getReviewsByProductId: async (product_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(product_id)) throw new Error("Invalid product ID");
      return await collection
        .find({ product_id: product_id })
        .sort({ createdAt: -1 })
        .toArray();
    }),

  getReviewsByUserId: async (user_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(user_id)) throw new Error("Invalid user ID");
      return await collection
        .find({ user_id: user_id })
        .sort({ createdAt: -1 })
        .toArray();
    }),

  updateReview: async (review_id, user_id, updateData) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(review_id), user_id: user_id },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Review not found or update not authorized");
      }

      return result.value;
    }),

  deleteReview: async (review_id, user_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");

      const result = await collection.deleteOne({
        _id: new ObjectId(review_id),
        user_id: user_id,
      });

      if (result.deletedCount === 0) {
        throw new Error("Review not found or delete not authorized");
      }

      return result;
    }),

  likeReview: async (review_id, user_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(review_id) },
        { $inc: { likes: 1 }, $addToSet: { likedBy: user_id } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Review not found");
      }

      return result.value;
    }),

  unlikeReview: async (review_id, user_id) =>
    handleDBOperation(async (collection) => {
      if (!ObjectId.isValid(review_id)) throw new Error("Invalid review ID");

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(review_id) },
        { $inc: { likes: -1 }, $pull: { likedBy: user_id } },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Review not found");
      }

      return result.value;
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

      // Đảm bảo rằng tất cả các rating từ 1-5 đều có trong kết quả
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
