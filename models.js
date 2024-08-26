// User Service
const UserModel = require("./modules/UserService/User/UserModel");
const UserDetailModel = require("./modules/UserService/User/UserDetailModel");
// Product Service
const ProductModel = require("./modules/ProductService/Product/ProductModel");
const CategoryModel = require("./modules/ProductService/Category/CategoryModel");
const FeedbackModel = require("./modules/ProductService/Feedback/FeedbackModel");
const DiscountModel = require("./modules/ProductService/Discount/DiscountModel");
// Order Service (customer)
const WishlistModel = require("./modules/OrderService/Wishlist/WishlistModel");
const CartModel = require("./modules/OrderService/Cart/CartModel");
const OrderModel = require("./modules/OrderService/Order/OrderModel");
// Payment Service
const InvoiceModel = require("./modules/PaymentService/Invoice/InvoiceModel");
const PaymentModel = require("./modules/PaymentService/Payment/PaymentModel");
// Notification Service
const NotificationModel = require("./modules/NotificationService/Notification/NotificationModel");
// Analytic Service
const ProductAnalyticModel = require("./modules/AnalyticsService/ProductAnalytic/ProductAnalyticModel");
const DiscountAnalyticModel = require("./modules/AnalyticsService/DiscountAnalytic/DiscountAnalyticModel");
const CustomerAnalyticModel = require("./modules/AnalyticsService/CustomerAnalytic/CustomerAnalyticModel");
const SellerAnalyticModel = require("./modules/AnalyticsService/SellerAnalytic/SellerAnalyticModel");
const GeneralAnalyticModel = require("./modules/AnalyticsService/GeneralAnalytic/GeneralAnalyticModel");
// Other Service
const MessageModel = require("./modules/OtherService/Chat/MessageModel");
const ConversationModel = require("./modules/OtherService/Chat/ConversationModel");
const GalleryModel = require("./modules/OtherService/Gallery/GalleryModel");
const OTPModel = require("./modules/OtherService/OTP/OTPModel");

module.exports = {
  CartModel,
  OrderModel,
  FeedbackModel,
  WishlistModel,
  ProductModel,
  InvoiceModel,
  CategoryModel,
  DiscountModel,
  PaymentModel,
  ConversationModel,
  MessageModel,
  NotificationModel,
  OTPModel,
  UserModel,
  GalleryModel,
  UserDetailModel,
  ProductAnalyticModel,
  DiscountAnalyticModel,
  CustomerAnalyticModel,
  SellerAnalyticModel,
  GeneralAnalyticModel,
};
