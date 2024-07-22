const express = require("express");
const { AuthController } = require("../../controller/index");
const { authToken } = require("../../middleware/authToken");
const router = express.Router();

router.post("/email-verify", AuthController.emailVerify);
router.post("/register-otp", AuthController.registerUserWithOTP);
router.post("/login", AuthController.loginUser);

// Commented out routes can be uncommented when implemented
// router.post("/login/google", AuthController.loginGoogleUser);
// router.post("/logout", authToken, AuthController.logoutUser);

module.exports = router;
