// User Service
const AuthController = require("./modules/UserService/Auth/auth.controller");
const UserController = require("./modules/UserService/User/user.controller");
// Product Service
const ProductController = require("./modules/ProductService/Product/product.controller");
const CategoryController = require("./modules/ProductService/Category/category.controller");
const DiscountController = require("./modules/ProductService/Discount/discount.controller");
const FeedbackController = require("./modules/ProductService/Feedback/feedback.controller");
const VariantController = require("./modules/ProductService/Variant/variant.controller");
// Order Service
const CartController = require("./modules/OrderService/Cart/cart.controller");
const OrderController = require("./modules/OrderService/Order/order.controller");
const PaymentController = require("./modules/OrderService/Payment/payment.controller");
const WishlistController = require("./modules/OrderService/Wishlist/wishlist.controller");
const ReversalController = require("./modules/OrderService/Reversal/reversal.controller");
// Other Service
const ConservationController = require("./modules/OtherService/Chat/conservation.controller");
const GalleryController = require("./modules/OtherService/Gallery/gallery.controller");
const NotificationController = require("./modules/OtherService/Notification/notification.controller");
const SessionController = require("./modules/OtherService/Session/session.controller");

module.exports = {
  CartController,
  FeedbackController,
  OrderController,
  WishlistController,
  ReversalController,
  CategoryController,
  DiscountController,
  PaymentController,
  ProductController,
  AuthController,
  ConservationController,
  NotificationController,
  UserController,
  GalleryController,
  SessionController,
  VariantController,
};
