const express = require("express");
const { authToken } = require("../../middleware/authToken");
const { ConservationController } = require("../../controller/index");
const router = express.Router();

//! For User Conservation
router.post(
  "/get-all-user-message",
  authToken,
  ConservationController.getAllUserMessage
);
router.post(
  "/get-all-user-image",
  authToken,
  ConservationController.getAllUserImage
);

//! For Group Conservation
router.post("/create-group", authToken, ConservationController.createGroupChat);
router.post(
  "/get-list-group-chat",
  authToken,
  ConservationController.getListGroupChat
);
router.post(
  "/get-all-group-message",
  authToken,
  ConservationController.getAllGroupMessage
);
router.post(
  "/get-all-group-image",
  authToken,
  ConservationController.getAllGroupImage
);
router.post("/update-group", authToken, ConservationController.updateGroup);
router.post("/del-group", authToken, ConservationController.deleteGroupChat);
router.post("/add-user-group", authToken, ConservationController.addUserGroup);
router.post("/del-user-group", authToken, ConservationController.addUserGroup);

module.exports = router;
