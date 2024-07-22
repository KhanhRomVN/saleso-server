// Customer
const CartModel = require("./customer/CartModel");
const OrderModel = require("./customer/OrderModel");
const ReviewModel = require("./customer/ReviewModel");

// Seller
const ProductModel = require("./seller/ProductModel");
const InvoiceModel = require("./seller/InvoiceModel");

// User
const ConversationModel = require("./user/ConversationModel");
const MessageModel = require("./user/MessageModel");
const NotificationModel = require("./user/NotificationModel");
const OTPModel = require("./user/OTPModel");
const UserDetailModel = require("./user/UserDetailModel");
const UserModel = require("./user/UserModel");

module.exports = {
  CartModel,
  OrderModel,
  ReviewModel,
  InvoiceModel,
  ProductModel,
  ProductModel,
  ConversationModel,
  MessageModel,
  NotificationModel,
  OTPModel,
  UserDetailModel,
  UserModel,
};
