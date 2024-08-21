// const express = require("express");
// const {
//   authCustomerToken,
//   authSellerToken,
// } = require("../../middleware/authToken");
// const { ReturnController } = require("../../controller/index");
// const router = express.Router();

// const routes = [
//   {
//     method: "post",
//     path: "/",
//     middleware: [authCustomerToken],
//     handler: ReturnController.returnOrder,
//   },
//   {
//     method: "get",
//     path: "/get/list-return",
//     middleware: [authSellerToken],
//     handler: ReturnController.getListReturn,
//   },
//   {
//     method: "get",
//     path: "/get/return",
//     middleware: [authSellerToken],
//     handler: ReturnController.getReturn,
//   },
//   {
//     method: "get",
//     path: "/get/return",
//     middleware: [authSellerToken],
//     handler: ReturnController.getReturn,
//   },
// ];

// routes.forEach(({ method, path, middleware = [], handler }) => {
//   router[method](path, ...middleware, handler);
// });

// module.exports = router;
