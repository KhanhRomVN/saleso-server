const { RefundModel } = require("../../../models");
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

const RefundController = {
  getListRefund: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      const { status } = req.params;
      return await RefundModel.getListRefund(seller_id, status);
    }),

  getRefund: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { refund_id } = req.params;
      return await RefundModel.getRefundById(refund_id);
    }),

  acceptRefund: (req, res) =>
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      const { refund_id } = req.params;
      const newLog = "You have agreed to a refund";
      return await RefundModel.acceptRefund(seller_id, refund_id);
    }),
};

module.exports = RefundController;
