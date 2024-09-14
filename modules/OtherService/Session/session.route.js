const express = require("express");
const { SessionController } = require("../../../controllers");
const { authCustomerToken } = require("../../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authCustomerToken],
    handler: SessionController.createSessionData,
  },
  {
    method: "get",
    path: "/get/:session_id",
    middleware: [authCustomerToken],
    handler: SessionController.getSessionData,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
