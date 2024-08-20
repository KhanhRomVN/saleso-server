// Customer
const review = require("./customer/review.route");
const cart = require("./customer/cart.route");
const order = require("./customer/order.route");
const customer = require("./customer/customer.route");
const wishlist = require("./customer/wishlist.route");

// Seller
const product = require("./seller/product.route");
const invoice = require("./seller/invoice.route");
const category = require("./seller/category.route");
const discount = require("./seller/discount.route");
const redemption = require("./seller/redemption.route");
const payment = require("./seller/payment.route");

// User
const auth = require("./user/auth.route");
const user = require("./user/user.route");
const chat = require("./user/chat.route");
const notification = require("./user/notification.route");

// Developer
const image = require("./employee/image.route");
const elastic = require("./elasticsearch.route");

module.exports = {
  auth,
  user,
  product,
  review,
  chat,
  cart,
  category,
  notification,
  wishlist,
  order,
  customer,
  invoice,
  image,
  discount,
  redemption,
  elastic,
  payment,
};
