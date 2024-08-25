const { DiscountModel, ProductModel } = require("../../../models");
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

const DiscountController = {
  createDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const discountData = { ...req.body, seller_id: req.user._id.toString() };

      discountData.startDate = new Date(discountData.startDate);
      discountData.endDate = new Date(discountData.endDate);

      discountData.status = determineDiscountStatus(
        discountData.startDate,
        discountData.endDate
      );
      discountData.isActive = true;
      return await DiscountModel.createDiscount(discountData);
    }),

  getDiscountByProductId: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { product_id } = req.params;
      const product = await ProductModel.getProductByProdId(product_id);
      if (!product) {
        throw new Error("Product not found");
      }

      const ongoingDiscountIds = product.ongoing_discounts || [];

      const ongoingDiscounts = await Promise.all(
        ongoingDiscountIds.map(async (discountId) => {
          const discount = await DiscountModel.getDiscountById(discountId);
          return discount;
        })
      );

      return ongoingDiscounts.filter((discount) => discount !== null);
    }),

  getAllDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getAllDiscounts(req.user._id.toString());
    }),

  getActiveDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getActiveDiscounts(req.user._id.toString());
    }),

  getInactiveDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getInactiveDiscounts(req.user._id.toString());
    }),

  getUpcomingDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getUpcomingDiscounts(req.user._id.toString());
    }),

  getOngoingDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getOngoingDiscounts(req.user._id.toString());
    }),

  getExpiredDiscounts: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await DiscountModel.getExpiredDiscounts(req.user._id.toString());
    }),

  getDiscountById: (req, res) =>
    handleRequest(req, res, async (req) => {
      const discount = await DiscountModel.getDiscountById(req.params.id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
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
      if (discount.isActive === false || discount.status === "expired") {
        res.status(403).json({
          error:
            "Can not apply discount for this product because expired or do not active",
        });
      }
      const result = await DiscountModel.applyDiscountToProduct(
        discount.status,
        discountId,
        productId
      );
      if (result.error) {
        res.status(400).json({ error: result.error });
        return;
      }
      return { message: "Discount applied successfully" };
    }),

  cancelDiscountProduct: (req, res) =>
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
          .json({ error: "You are not authorized to cancel this discount" });
        return;
      }
      if (discount.status == "expired") {
        res
          .status(400)
          .json({ error: "Only upcoming/ongoing discounts can be canceled" });
        return;
      }
      const result = await DiscountModel.cancelDiscountForProduct(
        discount.status,
        discountId,
        productId
      );
      if (result.error) {
        res.status(400).json({ error: result.error });
        return;
      }
      return { message: "Discount canceled successfully" };
    }),

  toggleActiveDiscount: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const discount = await DiscountModel.getDiscountById(id);
      if (!discount) {
        res.status(404).json({ error: "Discount not found" });
        return;
      }
      if (discount.seller_id !== req.user._id.toString()) {
        res
          .status(403)
          .json({ error: "You are not authorized to update this discount" });
        return;
      }
      return await DiscountModel.toggleActiveDiscount(id);
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
};

const determineDiscountStatus = (startDate, endDate) => {
  const now = new Date();
  if (now < startDate) return "upcoming";
  if (now >= startDate && now <= endDate) return "ongoing";
  return "expired";
};

module.exports = DiscountController;
