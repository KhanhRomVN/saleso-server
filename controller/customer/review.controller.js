const {
  ReviewModel,
  UserModel,
  UserDetailModel,
} = require("../../models/index");
const logger = require("../../config/logger");

const addReview = async (req, res) => {
  const userId = req.user._id.toString();
  const { prod_id, comment, rate } = req.body;
  try {
    const reviewData = {
      prod_id,
      user_id: userId,
      comment,
      rate,
    };
    await ReviewModel.addReview(reviewData);
    logger.info(`Review added successfully by user: ${userId}`);
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    logger.error("Error adding review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getListReviewByProdId = async (req, res) => {
  const { prod_id } = req.body;
  try {
    const reviews = await ReviewModel.getListReviewByProdId(prod_id);

    const enhancedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await UserModel.getUserById(review.user_id);
        const userDetails = await UserDetailModel.getUserDetailByUserId(
          review.user_id
        );

        return {
          ...review,
          username: user.username,
          avatar: userDetails.avatar,
        };
      })
    );

    res.status(200).json(enhancedReviews);
  } catch (error) {
    logger.error("Error getting product reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getListReviewByUserId = async (req, res) => {
  const { user_id } = req.body;
  try {
    const reviews = await ReviewModel.getListReviewByUserId(user_id);
    logger.info(`Retrieved reviews for user: ${user_id}`);
    res.status(200).json(reviews);
  } catch (error) {
    logger.error("Error getting user reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getStaticReview = async (req, res) => {
  const { prod_id } = req.body;
  try {
    const reviews = await ReviewModel.getListReviewByProdId(prod_id);

    const ratingCounts = {
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
    };

    let totalRating = 0;
    let reviewCount = 0;

    reviews.forEach((review) => {
      totalRating += review.rate;
      reviewCount++;

      if (review.rate === 1) ratingCounts.oneStar++;
      if (review.rate === 2) ratingCounts.twoStar++;
      if (review.rate === 3) ratingCounts.threeStar++;
      if (review.rate === 4) ratingCounts.fourStar++;
      if (review.rate === 5) ratingCounts.fiveStar++;
    });

    const overallRating =
      reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

    res.status(200).json({
      ratingCounts,
      overallRating,
    });
  } catch (error) {
    logger.error("Error getting static review data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateComment = async (req, res) => {
  const { review_id, comment } = req.body;
  try {
    await ReviewModel.updateComment(review_id, comment);
    logger.info(`Updated comment for review: ${review_id}`);
    res.status(200).json({ message: "Comment updated successfully" });
  } catch (error) {
    logger.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateRate = async (req, res) => {
  const { review_id, rate } = req.body;
  try {
    await ReviewModel.updateRate(review_id, rate);
    logger.info(`Updated rate for review: ${review_id}`);
    res.status(200).json({ message: "Rate updated successfully" });
  } catch (error) {
    logger.error("Error updating rate:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const delReview = async (req, res) => {
  const { review_id } = req.body;
  try {
    await ReviewModel.delReview(review_id);
    logger.info(`Deleted review: ${review_id}`);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    logger.error("Error deleting review:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
