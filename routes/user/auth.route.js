const express = require("express");
const { AuthController } = require("../../controller/index");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/email-verify",
    handler: AuthController.emailVerify,
  },
  {
    method: "post",
    path: "/register-otp",
    handler: AuthController.registerUserWithOTP,
  },
  {
    method: "post",
    path: "/login",
    handler: AuthController.loginUser,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
