// User Service
const AuthController = require("./modules/UserService/Auth/auth.controller");
const UserController = require("./modules/UserService/User/user.controller");
// Product Service
const ProductController = require("./modules/ProductService/Product/product.controller");
const CategoryController = require("./modules/ProductService/Category/category.controller");
const DiscountController = require("./modules/ProductService/Discount/discount.controller");
const FeedbackController = require("./modules/ProductService/Feedback/feedback.controller");
// Order Service
const OrderController = require("./modules/OrderService/Order/order.controller");
const CartController = require("./modules/OrderService/Cart/cart.controller");
const WishlistController = require("./modules/OrderService/Wishlist/wishlist.controller");
// Payment Service
const InvoiceController = require("./modules/PaymentService/Invoice/invoice.controller");
const PaymentController = require("./modules/PaymentService/Payment/payment.controller");
const ReversalController = require("./modules/PaymentService/Reversal/reversal.controller");
const RefundController = require("./modules/PaymentService/Refund/refund.controller");
// Notification Service
const NotificationController = require("./modules/NotificationService/Notification/notification.controller");
// Analytic Service
const ProductAnalyticController = require("./modules/AnalyticsService/ProductAnalytic/product_analytic.controller");
// Other Service
const ConservationController = require("./modules/OtherService/Chat/conservation.controller");
const GalleryController = require("./modules/OtherService/Gallery/gallery.controller");
const SessionController = require("./modules/OtherService/Session/session.controller");

module.exports = {
  CartController,
  FeedbackController,
  OrderController,
  WishlistController,
  ReversalController,
  RefundController,
  CategoryController,
  DiscountController,
  InvoiceController,
  PaymentController,
  ProductController,
  AuthController,
  ConservationController,
  NotificationController,
  UserController,
  GalleryController,
  ProductAnalyticController,
  SessionController,
};
