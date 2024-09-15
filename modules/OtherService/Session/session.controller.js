const { param } = require("express-validator");
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
  createSessionData: (req, res) =>
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      const result = await SessionModel.createSessionData(
        req.body,
        customer_id
      );
      return result.toString();
    }),

  getSessionData: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { session_id } = req.params;
      const customer_id = req.user._id.toString();
      return await SessionModel.getSessionData(customer_id, session_id);
    }),

  cleanSession: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { session_id } = req.params;
      const customer_id = req.user._id.toString();
      return await SessionModel.cleanSession(customer_id, session_id);
    }),
};

const cleanExpiredSessions = async () => {
  await SessionModel.cleanExpiredSessions();
};

cron.schedule("* * * * *", cleanExpiredSessions);

module.exports = SessionController;
