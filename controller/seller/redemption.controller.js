const { DiscountModel, RedemptionModel } = require("../../models/index");
const logger = require("../../config/logger");

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

const RedemptionController = {
  createRedemption: (req, res) =>
    handleRequest(req, res, async (req) => {
      const redemptionData = req.body;
      const result = await RedemptionModel.createRedemption(redemptionData);

      // Update the discount's current uses
      const discount = await DiscountModel.getDiscountById(
        redemptionData.discount_id
      );
      await DiscountModel.updateDiscount(redemptionData.discount_id, {
        currentUses: discount.currentUses + 1,
      });

      return result;
    }),

  getRedemptionsByDiscountId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { discountId } = req.params;
      return await RedemptionModel.getRedemptionsByDiscountId(discountId);
    }),

  getRedemptionsByUserId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { userId } = req.params;
      return await RedemptionModel.getRedemptionsByUserId(userId);
    }),

  getRedemptionByOrderId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { orderId } = req.params;
      return await RedemptionModel.getRedemptionByOrderId(orderId);
    }),

  getTotalRedemptionsByDiscountId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { discountId } = req.params;
      return await RedemptionModel.getTotalRedemptionsByDiscountId(discountId);
    }),

  getTotalValueByDiscountId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { discountId } = req.params;
      return await RedemptionModel.getTotalValueByDiscountId(discountId);
    }),

  deleteRedemption: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      return await RedemptionModel.deleteRedemption(id);
    }),
};

module.exports = RedemptionController;
