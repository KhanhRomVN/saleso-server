const express = require("express");
const { authToken } = require("../../middleware/authToken");
const { UserController } = require("../../controller/index");
const router = express.Router();

const routes = [
  {
    method: "get",
    path: "/user-data",
    middleware: [authToken],
    handler: UserController.getUserDataById,
  },
  {
    method: "post",
    path: "/update/username",
    middleware: [authToken],
    handler: UserController.updateUsername,
  },
  {
    method: "post",
    path: "/update/detail",
    middleware: [authToken],
    handler: UserController.updateUserDetailField,
  },
  {
    method: "post",
    path: "/verify",
    middleware: [authToken],
    handler: UserController.verifyAccount,
  },
  {
    method: "post",
    path: "/update-email",
    middleware: [authToken],
    handler: UserController.updateEmail,
  },
  {
    method: "post",
    path: "/update-password",
    middleware: [authToken],
    handler: UserController.updatePassword,
  },
  {
    method: "post",
    path: "/forget-password",
    middleware: [authToken],
    handler: UserController.forgetPassword,
  },
  {
    method: "post",
    path: "/update-forget-password",
    middleware: [authToken],
    handler: UserController.updateForgetPassword,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
