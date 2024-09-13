const express = require("express");
const { authToken } = require("../../../middleware/authToken");
const { NotificationController } = require("../../../controllers");
const router = express.Router();

router.post(
  "/get-list-notification",
  authToken,
  NotificationController.getListNotification
);
router.post(
  "/delete-notify",
  authToken,
  NotificationController.deleteNotification
);
router.post("/mark-as-read", authToken, NotificationController.markAsRead);

module.exports = router;
