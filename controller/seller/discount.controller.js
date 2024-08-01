const { DiscountModel } = require("../../models/index");
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

const DiscountController = {
  createDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const discountData = { ...req.body, seller_id: req.user._id.toString() };

      // Convert startDate and endDate strings to Date objects
      discountData.startDate = new Date(discountData.startDate);
      discountData.endDate = new Date(discountData.endDate);

      discountData.status = determineDiscountStatus(
        discountData.startDate,
        discountData.endDate
      );

      return await DiscountModel.createDiscount(discountData);
    }),

  getAllDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getAllDiscounts(req.user._id.toString());
    }),

  getActiveDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getActiveDiscounts(req.user._id);
    }),

  getInactiveDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getInactiveDiscounts(req.user._id);
    }),

  getUpcomingDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getUpcomingDiscounts(req.user._id);
    }),

  getOngoingDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getOngoingDiscounts(req.user._id);
    }),

  getExpiredDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getExpiredDiscounts(req.user._id);
    }),

  getTopUsedDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const limit = parseInt(req.query.limit) || 10;
      return await DiscountModel.getTopUsedDiscounts(req.user._id, limit);
    }),

  getDiscountById: (req, res) =>
    handleRequest(req, res, async (req) => {
      const discount = await DiscountModel.getDiscountById(req.params.id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to view this discount" });
        return;
      }
      return discount;
    }),

  updateDiscountName: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const { name } = req.body;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to update this discount" });
        return;
      }
      return await DiscountModel.updateDiscountName(id, name);
    }),

  updateDiscountDescription: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const { description } = req.body;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to update this discount" });
        return;
      }
      return await DiscountModel.updateDiscountDescription(id, description);
    }),

  applyDiscountProduct: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { discountId, productId } = req.body;
      const discount = await DiscountModel.getDiscountById(discountId);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id.toString()) {
        res
          .status(403)
          .json({ error: "You are not authorized to apply this discount" });
        return;
      }
      const result = await DiscountModel.applyDiscountToProduct(
        discountId,
        productId
      );
      if (result.error) {
        res.status(400).json({ error: result.error });
        return;
      }
      return { message: "Discount applied successfully" };
    }),

  changeActiveDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const { isActive } = req.body;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to update this discount" });
        return;
      }
      return await DiscountModel.changeActiveDiscount(id, isActive);
    }),

  deleteDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to delete this discount" });
        return;
      }
      return await DiscountModel.deleteDiscount(id);
    }),

  bulkCreateDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      const discountsData = req.body.map((discount) => ({
        ...discount,
        seller_id: req.user._id,
      }));
      return await DiscountModel.bulkCreateDiscounts(discountsData);
    }),

  cloneDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res
          .status(403)
          .json({ error: "You are not authorized to clone this discount" });
        return;
      }
      return await DiscountModel.cloneDiscount(id);
    }),

  getDiscountUsageStats: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id) {
        res.status(403).json({
          error: "You are not authorized to view this discount's stats",
        });
        return;
      }
      return await DiscountModel.getDiscountUsageStats(id);
    }),
};

function determineDiscountStatus(startDate, endDate) {
  const now = new Date();

  if (now < startDate) {
    return "upcoming";
  } else if (now >= startDate && now <= endDate) {
    return "ongoing";
  } else {
    return "expired";
  }
}

module.exports = DiscountController;
