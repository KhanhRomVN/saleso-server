const express = require("express");
const { ProductAnalyticController } = require("../../../controllers");
const { authCustomerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/:product_id",
    middleware: [authCustomerToken],
    handler: ProductAnalyticController.updateViewProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
