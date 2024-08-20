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
const PaymentModel = require("./seller/PaymentModel");

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
  // customer
  CartModel,
  OrderModel,
  ReviewModel,
  WishlistModel,
  // seller
  ProductModel,
  InvoiceModel,
  CategoryModel,
  DiscountModel,
  RedemptionModel,
  PaymentModel,
  // user
  ConversationModel,
  MessageModel,
  NotificationModel,
  OTPModel,
  UserDetailModel,
  UserModel,
  // Employee
  ImageModel,
  EmployeeModel,
};
