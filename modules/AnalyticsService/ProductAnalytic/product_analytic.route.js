const express = require("express");
const { ProductAnalyticController } = require("../../../controllers");
const { authToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  // plus one view for each user who clicks on the product
  {
    method: "get",
    path: "/:product_id",
    handler: ProductAnalyticController.viewProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
