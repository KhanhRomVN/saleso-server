// Customer
const CartController = require("./customer/cart.controller");
const OrderController = require("./customer/order.controller");
const ReviewController = require("./customer/review.controller");

// Seller
const ProductController = require("./seller/product.controller");
const SellerController = require("./seller/seller.controller");
const InvoiceController = require("./seller/invoice.controller");

// User
const AuthController = require("./user/auth.controller");
const ConservationController = require("./user/conservation.controller");
const UserController = require("./user/user.controller");
const NotificationController = require("./user/notification.controller");

module.exports = {
  ProductController,
  SellerController,
  CartController,
  OrderController,
  ReviewController,
  AuthController,
  ConservationController,
  UserController,
  NotificationController,
  InvoiceController,
};
