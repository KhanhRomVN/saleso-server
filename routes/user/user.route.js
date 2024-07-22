const express = require("express");
const { authToken } = require("../../middleware/authToken");
const { UserController } = require("../../controller/index");
const router = express.Router();

//* Get User Data + User Detail Data
router.post("/get-user-data-by-username", UserController.getUserDataByUsername);

//* Update User Data [username]
router.post("/update-username", authToken, UserController.updateUsername);
//* Update User Detail Data [name, age. gender, about, address, avatar]
router.post(
  "/update-user-detail-field",
  authToken,
  UserController.updateUserDetailField
);

//* Update Email
router.post("/verify-email", authToken, UserController.verifyEmail);
router.post("/update-email", authToken, UserController.updateEmail);

//* Update Password
router.post("/update-password", authToken, UserController.updatePassword);
router.post("/forget-password", authToken, UserController.forgetPassword);
router.post(
  "/update-forget-password",
  authToken,
  UserController.updateForgetPassword
);

module.exports = router;
