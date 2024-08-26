// User Service
const auth = require("./modules/UserService/Auth/auth.route");
const user = require("./modules/UserService/User/user.route");
// Product Service
const product = require("./modules/ProductService/Product/product.route");
const category = require("./modules/ProductService/Category/category.route");
const discount = require("./modules/ProductService/Discount/discount.route");
const feedback = require("./modules/ProductService/Feedback/feedback.route");
// Order Service
const wishlist = require("./modules/OrderService/Wishlist/wishlist.route");
const cart = require("./modules/OrderService/Cart/cart.route");
const order = require("./modules/OrderService/Order/order.route");
// Payment Service
const invoice = require("./modules/PaymentService/Invoice/invoice.route");
const payment = require("./modules/PaymentService/Payment/payment.route");
// Notification Service
const notification = require("./modules/NotificationService/Notification/notification.route");
// Search Service
const elastic = require("./modules/SearchService/Elastic/elasticsearch.route");
// Analytic Service
const product_analytic = require("./modules/AnalyticsService/ProductAnalytic/product_analytic.route");
const discount_analytic = require("./modules/AnalyticsService/DiscountAnalytic/discount_analytic.route");
const customer_analytic = require("./modules/AnalyticsService/CustomerAnalytic/customer_analytic.route");
const seller_analytic = require("./modules/AnalyticsService/SellerAnalytic/seller_analytic.route");
const general_analytic = require("./modules/AnalyticsService/GeneralAnalytic/general_analytic.route");
// Other Service
const chat = require("./modules/OtherService/Chat/chat.route");
const gallery = require("./modules/OtherService/Gallery/gallery.route");

module.exports = {
  auth,
  cart,
  category,
  chat,
  discount,
  elastic,
  feedback,
  gallery,
  invoice,
  notification,
  order,
  payment,
  product,
  user,
  wishlist,
  product_analytic,
  discount_analytic,
  customer_analytic,
  seller_analytic,
  general_analytic,
};
