const { OrderModel, ProductModel } = require("../../models/index");

const handleAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getListOrder = handleAsync(async (req, res) => {
  const customer_id = req.user._id.toString();
  const orders = await OrderModel.getListOrder(customer_id);
  res.status(200).json(orders);
});

const getListAcceptOrder = handleAsync(async (req, res) => {
  const customer_id = req.user._id.toString();
  const orders = await OrderModel.getListAcceptOrder(customer_id);
  res.status(200).json(orders);
});

const getListRefuseOrder = handleAsync(async (req, res) => {
  const customer_id = req.user._id.toString();
  const orders = await OrderModel.getListRefuseOrder(customer_id);
  res.status(200).json(orders);
});

const createOrder = handleAsync(async (req, res) => {
  const customer_id = req.user._id.toString();
  const { products, payment_method, payment_status, shipping_address } =
    req.body;

  if (
    !products ||
    !Array.isArray(products) ||
    products.length === 0 ||
    !payment_method ||
    !payment_status ||
    !shipping_address
  ) {
    return res
      .status(400)
      .json({ message: "Missing or invalid required fields" });
  }

  const groupedProducts = groupProductsBySeller(products);

  await Promise.all(
    Object.entries(groupedProducts).map(async ([seller_id, sellerProducts]) => {
      await Promise.all(
        sellerProducts.map(async (product) => {
          if (
            product.discount_type &&
            product.discount_type === "free shipping"
          ) {
            product.shipping_fee = 0;
          }

          product.total_amount = product.discount
            ? product.price * product.quantity * product.discount
            : product.price * product.quantity;

          product.customer_id = customer_id;
          product.payment_method = payment_method;
          product.payment_status = payment_status;
          product.shipping_address = shipping_address;
          product.order_status = "pending";
          await OrderModel.createOrder(product);
          await ProductModel.subtractStock(
            product.product_id,
            product.quantity
          );
        })
      );
    })
  );

  res.status(201).json({ message: "Orders created successfully" });
});

const groupProductsBySeller = (products) => {
  return products.reduce((acc, product) => {
    if (!acc[product.seller_id]) {
      acc[product.seller_id] = [];
    }
    acc[product.seller_id].push(product);
    return acc;
  }, {});
};

const cancelOrder = handleAsync(async (req, res) => {
  const customer_id = req.user._id.toString();
  const { order_id } = req.params;

  const order = await OrderModel.getOrderById(order_id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.customer_id !== customer_id) {
    return res
      .status(403)
      .json({ message: "Unauthorized to cancel this order" });
  }

  if (
    order.deliver_status === "delivered" ||
    order.deliver_status === "in transit"
  ) {
    return res.status(401).json({
      message:
        "You cannot cancel this order because it has been delivered successfully",
    });
  }

  await OrderModel.cancelOrder(order._id);
  res.status(200).json({ message: "Order cancel successfully" });
});

module.exports = {
  getListOrder,
  getListAcceptOrder,
  getListRefuseOrder,
  createOrder,
  cancelOrder,
};
