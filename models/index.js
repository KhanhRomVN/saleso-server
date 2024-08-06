// Customer
const CartModel = require("./customer/CartModel");
const OrderModel = require("./customer/OrderModel");
const ReviewModel = require("./customer/ReviewModel");
const WishlistModel = require("./customer/WishlistModel");

// Seller
const ProductModel = require("./seller/ProductModel");
const InvoiceModel = require("./seller/InvoiceModel");
const CategoryModel = require("./seller/CategoryModel");
const DiscountModel = require("./seller/DiscountModel");
const RedemptionModel = require("./seller/RedemptionModel");

// User
const ConversationModel = require("./user/ConversationModel");
const MessageModel = require("./user/MessageModel");
const NotificationModel = require("./user/NotificationModel");
const OTPModel = require("./user/OTPModel");
const UserDetailModel = require("./user/UserDetailModel");
const UserModel = require("./user/UserModel");

// Employee
const ImageModel = require("./employee/ImageModel");
const EmployeeModel = require("./employee/EmployeeModel");

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
  DiscountModel,
  RedemptionModel,
  EmployeeModel,
  WishlistModel,
};
