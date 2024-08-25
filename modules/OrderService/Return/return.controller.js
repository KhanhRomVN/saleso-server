const { ReturnModel } = require("../../../models");
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

const ReturnController = {
  returnOrder: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await ReturnModel.returnOrder(customer_id);
    }),
};

module.exports = ReturnController;
