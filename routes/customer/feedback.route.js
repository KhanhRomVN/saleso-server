const express = require("express");
const { FeedbackController } = require("../../controller/index");
const {
  authCustomerToken,
  authSellerToken,
  authToken,
} = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authToken],
    handler: FeedbackController.createFeedback,
  },
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
  {
    method: "post",
    path: "/seller/feedbacks",
    middleware: [authSellerToken],
    handler: FeedbackController.getAllFeedbacks,
  },
  {
    method: "post",
    path: "/seller/customer-feedbacks",
    middleware: [authSellerToken],
    handler: FeedbackController.getCustomerFeedbacks,
  },
  {
    method: "post",
    path: "/product-feedbacks",
    handler: FeedbackController.getProductFeedbacks,
  },
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
