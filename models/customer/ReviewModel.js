const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "reviews";
const COLLECTION_SCHEMA = Joi.object({
  prod_id: Joi.string().required(),
  user_id: Joi.string().required(),
  comment: Joi.string().required(),
  rate: Joi.number().min(1).max(5).required(),
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date()),
}).options({ abortEarly: false });

const addReview = async (reviewData) => {
  const db = getDB();
  try {
    const validatedReview = await COLLECTION_SCHEMA.validateAsync(reviewData);
    await db.collection(COLLECTION_NAME).insertOne(validatedReview);
  } catch (error) {
    console.error("Error in addReview: ", error);
    throw error;
  }
};

const getListReviewByProdId = async (prod_id) => {
  const db = getDB();
  try {
    const reviews = await db
      .collection(COLLECTION_NAME)
      .find({ prod_id })
      .toArray();
    return reviews;
  } catch (error) {
    console.error("Error getting reviews by product id:", error);
    throw error;
  }
};

const getListReviewByUserId = async (user_id) => {
  const db = getDB();
  try {
    const reviews = await db
      .collection(COLLECTION_NAME)
      .find({ user_id })
      .toArray();
    return reviews;
  } catch (error) {
    console.error("Error getting reviews by user id:", error);
    throw error;
  }
};

const getStaticReview = async (prod_id) => {};

const updateComment = async (review_id, comment) => {
  const db = getDB();
  try {
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(review_id) },
        { $set: { comment, updatedAt: new Date() } }
      );
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

const updateRate = async (review_id, rate) => {
  const db = getDB();
  try {
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(review_id) },
        { $set: { rate, updatedAt: new Date() } }
      );
  } catch (error) {
    console.error("Error updating rate:", error);
    throw error;
  }
};

const delReview = async (review_id) => {
  const db = getDB();
  try {
    await db
      .collection(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(review_id) });
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

module.exports = {
  addReview,
  getListReviewByProdId,
  getListReviewByUserId,
  getStaticReview,
  updateComment,
  updateRate,
  delReview,
};
