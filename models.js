// User Service
const UserModel = require("./modules/UserService/User/UserModel");
const UserDetailModel = require("./modules/UserService/User/UserDetailModel");
// Product Service
const ProductModel = require("./modules/ProductService/Product/ProductModel");
const CategoryModel = require("./modules/ProductService/Category/CategoryModel");
const FeedbackModel = require("./modules/ProductService/Feedback/FeedbackModel");
const DiscountModel = require("./modules/ProductService/Discount/DiscountModel");
const VariantModel = require("./modules/ProductService/Variant/VariantModel");
// Order Service
const CartModel = require("./modules/OrderService/Cart/CartModel");
const OrderModel = require("./modules/OrderService/Order/OrderModel");
const PaymentModel = require("./modules/OrderService/Payment/PaymentModel");
const ReversalModel = require("./modules/OrderService/Reversal/ReversalModel");
const WishlistModel = require("./modules/OrderService/Wishlist/WishlistModel");
// Analytic Service
const ProductAnalyticModel = require("./modules/AnalyticsService/ProductAnalytic/ProductAnalyticModel");
const CustomerAnalyticModel = require("./modules/AnalyticsService/CustomerAnalytic/CustomerAnalyticModel");
// Other Service
const GalleryModel = require("./modules/OtherService/Gallery/GalleryModel");
const NotificationModel = require("./modules/OtherService/Notification/NotificationModel");
const OTPModel = require("./modules/OtherService/OTP/OTPModel");
const SessionModel = require("./modules/OtherService/Session/SessionModel");
const MessageModel = require("./modules/OtherService/Chat/MessageModel");
const ConversationModel = require("./modules/OtherService/Chat/ConversationModel");

module.exports = {
  CartModel,
  OrderModel,
  ReversalModel,
  FeedbackModel,
  WishlistModel,
  ProductModel,
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
  CustomerAnalyticModel,
  SessionModel,
  VariantModel,
};
