const express = require("express");
const { FeedbackController } = require("../../../controllers");
const {
  authCustomerToken,
  authSellerToken,
  authToken,
} = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken],
    handler: FeedbackController.createFeedback,
  },
  // This function is only used when the seller is the owner of this product
  {
    method: "post",
    path: "/reply/:feedback_id",
    middleware: [authSellerToken],
    handler: FeedbackController.replyFeedback,
  },
  {
    method: "delete",
    path: "/:feedback_id",
    middleware: [authCustomerToken],
    handler: FeedbackController.deleteFeedback,
  },
  // This function is used to display the customer-side product feedback list (no authentication required).
  {
    method: "post",
    path: "/product-feedbacks",
    handler: FeedbackController.getProductFeedbacks,
  },
  // This function is used to display a list of feedback filtered through criteria such as owner_id, user_id, product_id and rating (only used for authenticated sellers).
  {
    method: "post",
    path: "/seller/filtered-feedbacks",
    middleware: [authSellerToken],
    handler: FeedbackController.getFilteredFeedbacks,
  },
  {
    method: "get",
    path: "/products/:product_id/rating",
    handler: FeedbackController.getProductRating,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
