// User Service
const UserModel = require("./modules/UserService/User/UserModel");
const CustomerDetailModel = require("./modules/UserService/User/CustomerDetailModel");
const SellerDetailModel = require("./modules/UserService/User/SellerDetailModel");
// Product Service
const ProductModel = require("./modules/ProductService/Product/ProductModel");
const CategoryModel = require("./modules/OrderService/Cart/CartModel");
const FeedbackModel = require("./modules/ProductService/Discount/DiscountModel");
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
  CustomerDetailModel,
  SellerDetailModel,
};
