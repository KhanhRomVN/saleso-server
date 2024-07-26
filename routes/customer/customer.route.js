const express = require("express");
const { CustomerController } = require("../../controller/index");
const { authCustomerToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/category/:category_name",
    handler: CustomerController.getProductCategory,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
