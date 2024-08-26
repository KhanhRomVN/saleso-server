const express = require("express");
const { CartController } = require("../../../controllers");
const { authToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/",
    handler: CartController.viewProduct,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
