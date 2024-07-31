// Customer
const CartController = require("./customer/cart.controller");
const OrderController = require("./customer/order.controller");
const ReviewController = require("./customer/review.controller");
const CustomerController = require("./customer/customer.controller");

// Seller
const ProductController = require("./seller/product.controller");
const InvoiceController = require("./seller/invoice.controller");
const CategoryController = require("./seller/category.controller");
const DiscountController = require("./seller/discount.controller");
const RedemptionController = require("./seller/redemption.controller");

// User
const AuthController = require("./user/auth.controller");
const ConservationController = require("./user/conservation.controller");
const UserController = require("./user/user.controller");
const NotificationController = require("./user/notification.controller");

// Developer
const ImageController = require("./developer/image.controller");

module.exports = {
  ProductController,
  CustomerController,
  CategoryController,
  CartController,
  OrderController,
  ReviewController,
  AuthController,
  ConservationController,
  UserController,
  NotificationController,
  InvoiceController,
  ImageController,
  DiscountController,
  RedemptionController,
};
