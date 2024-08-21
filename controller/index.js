// Customer
const CartController = require("./customer/cart.controller");
const OrderController = require("./customer/order.controller");
const FeedbackController = require("./customer/feedback.controller");
const CustomerController = require("./customer/customer.controller");
const WishlistController = require("./customer/wishlist.controller");

// Seller
const ProductController = require("./seller/product.controller");
const InvoiceController = require("./seller/invoice.controller");
const CategoryController = require("./seller/category.controller");
const DiscountController = require("./seller/discount.controller");
const RedemptionController = require("./seller/redemption.controller");
const PaymentController = require("./seller/payment.controller");

// User
const AuthController = require("./user/auth.controller");
const ConservationController = require("./user/conservation.controller");
const UserController = require("./user/user.controller");
const NotificationController = require("./user/notification.controller");

// Employee
const ImageController = require("./employee/image.controller");
const EmployeeController = require("./employee/employee.controller");

module.exports = {
  ProductController,
  CustomerController,
  CategoryController,
  CartController,
  OrderController,
  FeedbackController,
  AuthController,
  ConservationController,
  UserController,
  NotificationController,
  InvoiceController,
  ImageController,
  DiscountController,
  RedemptionController,
  EmployeeController,
  WishlistController,
  PaymentController,
};
