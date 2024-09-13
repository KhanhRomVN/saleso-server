// User Service
const auth = require("./modules/UserService/Auth/auth.route");
const user = require("./modules/UserService/User/user.route");
// Product Service
const category = require("./modules/ProductService/Category/category.route");
const discount = require("./modules/ProductService/Discount/discount.route");
const feedback = require("./modules/ProductService/Feedback/feedback.route");
const product = require("./modules/ProductService/Product/product.route");
const variant = require("./modules/ProductService/Variant/variant.route");
// Order Service
const cart = require("./modules/OrderService/Cart/cart.route");
const order = require("./modules/OrderService/Order/order.route");
const payment = require("./modules/OrderService/Payment/payment.route");
const reversal = require("./modules/OrderService/Reversal/reversal.route");
const wishlist = require("./modules/OrderService/Wishlist/wishlist.route");
// Other Service
const chat = require("./modules/OtherService/Chat/chat.route");
const gallery = require("./modules/OtherService/Gallery/gallery.route");
const notification = require("./modules/OtherService/Notification/notification.route");
const session = require("./modules/OtherService/Session/session.route");

module.exports = {
  auth,
  cart,
  category,
  chat,
  discount,
  feedback,
  gallery,
  notification,
  order,
  session,
  reversal,
  payment,
  product,
  user,
  wishlist,
  variant,
};
