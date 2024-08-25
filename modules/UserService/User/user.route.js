const express = require("express");
const {
  authToken,
  authCustomerToken,
  authSellerToken,
} = require("../../../middleware/authToken");
const { UserController } = require("../../../controllers");
const router = express.Router();

const routes = [
  // Only used when creating a new account
  {
    method: "post",
    path: "/create/customer-detail",
    handler: UserController.createCustomerDetail,
  },
  // Only used when creating a new account
  {
    method: "post",
    path: "/create/seller-detail",
    handler: UserController.createSellerDetail,
  },
  {
    method: "get",
    path: "/",
    middleware: [authToken],
    handler: UserController.getUser,
  },
  {
    method: "get",
    path: "/customer-detail",
    middleware: [authCustomerToken],
    handler: UserController.getCustomerDetail,
  },
  {
    method: "get",
    path: "/seller-detail",
    middleware: [authSellerToken],
    handler: UserController.getSellerDetail,
  },
  {
    method: "put",
    path: "/update/username",
    middleware: [authToken],
    handler: UserController.updateUsername,
  },
  {
    method: "put",
    path: "/update/customer-detail",
    middleware: [authCustomerToken],
    handler: UserController.updateCustomerDetail,
  },
  {
    method: "put",
    path: "/update/seller-detail",
    middleware: [authSellerToken],
    handler: UserController.updateSellerDetail,
  },
  {
    method: "put",
    path: "/update/new-email",
    middleware: [authToken],
    handler: UserController.updateEmail,
  },
  // update new password based on old password (user remembers old password)
  {
    method: "put",
    path: "/update/password",
    middleware: [authToken],
    handler: UserController.updatePassword,
  },
  // In case you forget your password, an OTP will be sent to your email
  {
    method: "post",
    path: "/forget/password",
    middleware: [authToken],
    handler: UserController.forgetPassword,
  },
  // Update forgotten password with OTP and new password
  {
    method: "post",
    path: "/update/forget-password",
    middleware: [authToken],
    handler: UserController.updateForgetPassword,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
