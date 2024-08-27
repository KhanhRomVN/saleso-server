const {
  ReturnModel,
  OrderModel,
  UserModel,
  ReversalModel,
  ProductModel,
  RefundModel,
} = require("../../../models");
const logger = require("../../../config/logger");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in ${operation.name}: ${error}`);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const ReversalController = {
  reversalOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const customer = await UserModel.getUserById(customer_id, "customer");
      const { order_id, reason, images = [] } = req.body;
      const order = await OrderModel.getOrderById(order_id);
      if (order.customer_id !== customer_id) {
        return { error: "You do not have authority to return this order" };
      }
      const reversalData = {
        order_id,
        customer_id,
        seller_id: order.seller_id,
        reason,
        images,
        logs: [
          `The account has the nickname [${customer.username}] have returned the order to you and request processing as soon as possible`,
        ],
        reversal_status: "pending",
      };
      await ReversalModel.reversalOrder(reversalData);
      return { success: "Your return request has been successful" };
    }),

  getListReversal: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      const { status } = req.params;
      return await ReversalModel.getListReversal(seller_id, status);
    }),

  getReversal: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { reversal_id } = req.params;
      return await ReversalModel.getReversalById(reversal_id);
    }),

  reversalAsProductReplacement: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { reversal_id } = req.params;
      const reversal = await ReversalModel.getReversalById(reversal_id);
      const order = await OrderModel.getOrderById(reversal.order_id);
      // Update (reduce) product quantity
      await ProductModel.updateStock(
        order.product_id,
        order.quantity,
        order.selected_attributes_value
      );
      // Accept returns - update status and update method
      return await ReversalModel.acceptReversal("replace-product", reversal_id);
    }),

  reversalAsRefund: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { reversal_id } = req.params;
      const reversal = await ReversalModel.getReversalById(reversal_id);
      const order = await OrderModel.getOrderById(reversal.order_id);
      const refundData = {
        order_id: reversal.order_id,
        customer_id: order.customer_id,
        seller_id: order.seller_id,
        refund_type: "reversal_order",
        refund_status: "processing",
        logs: ["You want to process your returned order with a refund"],
      };
      await RefundModel.acceptReversalAsRefund(refundData);
      // Accept returns - update status and update method
      return await ReversalModel.acceptReversal("refund", reversal_id);
    }),
};

module.exports = ReversalController;
