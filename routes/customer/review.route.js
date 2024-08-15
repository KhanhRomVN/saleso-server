const express = require("express");
const { ReviewController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    middleware: [authCustomerToken],
    handler: ReviewController.createReview,
  },
  {
    method: "post",
    path: "/reply/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.replyReview,
  },
  {
    method: "get",
    path: "/:review_id",
    handler: ReviewController.getReviewById,
  },
  {
    method: "get",
    path: "/by-product/:product_id",
    handler: ReviewController.getReviewsByProductId,
  },
  {
    method: "get",
    path: "/by-customer/:customer_id",
    middleware: [authCustomerToken],
    handler: ReviewController.getReviewsByCustomerId,
  },
  {
    method: "delete",
    path: "/delete/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.deleteReview,
  },
  {
    method: "post",
    path: "/like/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.likeReview,
  },
  {
    method: "post",
    path: "/unlike/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.unlikeReview,
  },
  {
    method: "get",
    path: "/rating/:product_id",
    handler: ReviewController.getProductRating,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
