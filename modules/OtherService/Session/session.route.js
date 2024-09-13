const express = require("express");
const { SessionController } = require("../../../controllers");
const { authCustomerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/checkout",
    middleware: [authCustomerToken],
    handler: SessionController.createSessionCheckout,
  },
  {
    method: "post",
    path: "/cart",
    middleware: [authCustomerToken],
    handler: SessionController.createSessionCartID,
  },
  {
    method: "get",
    path: "/get-session/:type",
    middleware: [authCustomerToken],
    handler: SessionController.getSessionData,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
