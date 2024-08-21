// Customer
const CartController = require("./customer/cart.controller");
const CustomerController = require("./customer/customer.controller");
const FeedbackController = require("./customer/feedback.controller");
const OrderController = require("./customer/order.controller");
const ReturnController = require("./customer/return.controller");
const WishlistController = require("./customer/wishlist.controller");

// Seller
const CategoryController = require("./seller/category.controller");
const DiscountController = require("./seller/discount.controller");
const InvoiceController = require("./seller/invoice.controller");
const PaymentController = require("./seller/payment.controller");
const ProductController = require("./seller/product.controller");

// User
const AuthController = require("./user/auth.controller");
const ConservationController = require("./user/conservation.controller");
const NotificationController = require("./user/notification.controller");
const UserController = require("./user/user.controller");

// Employee
const EmployeeController = require("./employee/employee.controller");
const GalleryController = require("./employee/gallery.controller");

module.exports = {
  // customer
  CartController,
  CustomerController,
  FeedbackController,
  OrderController,
  ReturnController,
  WishlistController,
  // seller
  CategoryController,
  DiscountController,
  InvoiceController,
  PaymentController,
  ProductController,
  // user
  AuthController,
  ConservationController,
  NotificationController,
  UserController,
  // employee
  EmployeeController,
  GalleryController,
};
