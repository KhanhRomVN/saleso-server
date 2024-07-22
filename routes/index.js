// Customer
const review = require("./customer/review.route");
const cart = require("./customer/cart.route");
const order = require("./customer/order.route");

// Seller
const product = require("./seller/product.route");
const invoice = require("./seller/invoice.route");
const seller = require("./seller/seller.route");

// User
const auth = require("./user/auth.route");
const user = require("./user/user.route");
const chat = require("./user/chat.route");
const notification = require("./user/notification.route");

module.exports = {
  auth,
  user,
  product,
  review,
  chat,
  cart,
  seller,
  notification,
  order,
  invoice,
};
