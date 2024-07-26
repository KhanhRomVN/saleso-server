// Customer
const CartModel = require("./customer/CartModel");
const OrderModel = require("./customer/OrderModel");
const ReviewModel = require("./customer/ReviewModel");

// Seller
const ProductModel = require("./seller/ProductModel");
const InvoiceModel = require("./seller/InvoiceModel");
const CategoryModel = require("./seller/CategoryModel");

// User
const ConversationModel = require("./user/ConversationModel");
const MessageModel = require("./user/MessageModel");
const NotificationModel = require("./user/NotificationModel");
const OTPModel = require("./user/OTPModel");
const UserDetailModel = require("./user/UserDetailModel");
const UserModel = require("./user/UserModel");

// Developer
const ImageModel = require("./developer/ImageModel");

module.exports = {
  CartModel,
  OrderModel,
  ReviewModel,
  InvoiceModel,
  ProductModel,
  CategoryModel,
  ProductModel,
  ConversationModel,
  MessageModel,
  NotificationModel,
  OTPModel,
  UserDetailModel,
  UserModel,
  ImageModel,
};
