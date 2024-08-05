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
    path: "/by-user/:user_id",
    middleware: [authCustomerToken],
    handler: ReviewController.getReviewsByUserId,
  },
  {
    method: "put",
    path: "/update/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.updateReview,
  },
  {
    method: "delete",
    path: "/delete/:review_id",
    middleware: [authCustomerToken],
    handler: ReviewController.deleteReview,
  },
  {
    method: "post",
    path: "/:review_id/like",
    middleware: [authCustomerToken],
    handler: ReviewController.likeReview,
  },
  {
    method: "post",
    path: "/:review_id/unlike",
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
