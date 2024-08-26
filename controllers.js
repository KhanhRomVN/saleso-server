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
// Notification Service
const NotificationController = require("./modules/NotificationService/Notification/notification.controller");
// Analytic Service
const ProductAnalyticController = require("./modules/AnalyticsService/ProductAnalytic/product_analytic.controller");
const DiscountAnalyticController = require("./modules/AnalyticsService/DiscountAnalytic/discount_analytic.controller");
const CustomerAnalyticController = require("./modules/AnalyticsService/CustomerAnalytic/customer_analytic.controller");
const SellerAnalyticController = require("./modules/AnalyticsService/SellerAnalytic/seller_analytic.controller");
const GeneralAnalyticController = require("./modules/AnalyticsService/GeneralAnalytic/general_analytic.controller");
// Other Service
const ConservationController = require("./modules/OtherService/Chat/conservation.controller");
const GalleryController = require("./modules/OtherService/Gallery/gallery.controller");

module.exports = {
  CartController,
  FeedbackController,
  OrderController,
  WishlistController,
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
  DiscountAnalyticController,
  CustomerAnalyticController,
  SellerAnalyticController,
  GeneralAnalyticController,
};
