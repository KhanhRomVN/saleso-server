const { SessionModel } = require("../../../models");
const cron = require("node-cron");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const SessionController = {
  createSessionCheckout: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      // req.body: product_id, quantity and ?selected_attributes_value
      await SessionModel.createSessionCheckout(req.body, customer_id);
      return { success: "Create session checkout successful" };
    }),
};

const cleanExpiredSessions = async () => {
  await SessionModel.cleanExpiredSessions();
};

cron.schedule("* * * * *", cleanExpiredSessions);

module.exports = SessionController;
