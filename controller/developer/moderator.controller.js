//* Controller
const notificationController = require("../notification.controller");
//* Model
const DeveloperModel = require("../../models/DeveloperModel");
const UserModel = require("../../models/user/UserModel");
const OTPModel = require("../../models/user/OTPModel");
const userDetailModel = require("../../models/user/UserDetailModel");
const ProductModel = require("../../models/seller/ProductModel");
const OrderModel = require("../../models/customer/OrderModel");
//* NPM Package
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
//* Function Package
const logger = require("../../config/logger");
const transporter = require("../../config/nodemailerConfig");
const generateOTP = () => crypto.randomBytes(3).toString("hex");

//* Register&Login
const emailModeratorVerify = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await UserModel.getUserByEmail(email);
    if (existingUser) {
      logger.warn(`User already exists with email: ${email}`);
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }
    const isModeratorUser = await DeveloperModel.getModeratorByEmail(email);
    if (!isModeratorUser) {
      return res.status(400).json({
        error: "Your account does not have the right to become a moderator",
      });
    }

    const otp = generateOTP();
    await OTPModel.storeOTP(email, otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email OTP Confirmation",
      html: `<p>Your OTP code is: ${otp}</p>`,
    });

    await logger.info(`OTP sent to email: ${email}`);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    logger.error("Verify Email Error:", error);
    res.status(500).json({ error: "Verify Email Error" });
  }
};

const registerModeratorWithOTP = async (req, res) => {
  const { email, otp, username, password } = req.body;
  try {
    //* Verify
    const validOTP = await OTPModel.verifyOTP(email, otp);
    if (!validOTP) {
      logger.warn(`Invalid OTP for email: ${email}`);
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const existingEmail = await UserModel.getUserByEmail(email);
    const existingUsername = await UserModel.getUserByUsername(username);
    if (existingEmail) {
      logger.warn(`Unable to register because email already exists: ${email}`);
      return res.status(400).json({
        error: "You cannot register because the email already exists",
      });
    }

    if (existingUsername) {
      logger.warn(
        `Unable to register because username already exists: ${username}`
      );
      return res.status(400).json({
        error: "You cannot register because the username already exists",
      });
    }

    //* User
    const hashedPassword = await bcryptjs.hash(password, 10);
    const userData = {
      username,
      email,
      emailConfirmed: "true",
      password: hashedPassword,
      role: "customer",
      register_at: new Date(),
    };
    await UserModel.registerUser(email, userData);
    const user = await UserModel.getUserByEmail(email);
    const user_id = user._id.toString();
    const userDetailData = {
      user_id,
      friends_request: [],
      friends: [],
      blocklist: [],
    };
    await userDetailModel.addUserDetail(userDetailData);

    //* Moderator
    const moderatorData = {
      username,
      email,
      emailConfirmed: "true",
      password: hashedPassword,
      role: "mod",
      register_at: new Date(),
    };
    await DeveloperModel.registerModerator(email, moderatorData);
    //* Notification
    await notificationController.createNotification(
      user_id,
      "Account registration successful",
      "personal"
    );
    logger.info(`User registered successfully: ${username}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    logger.error("Register User with OTP Failed:", error);
    res.status(500).json({ error: "Register User with OTP Failed" });
  }
};

const loginModerator = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await DeveloperModel.getUserByEmail(email);
    if (!user) {
      logger.warn(`Invalid email attempted: ${email}`);
      return res.status(401).json({ error: "Invalid email" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password attempted for email: ${email}`);
      return res.status(401).json({ error: "Invalid password" });
    }
    if (!user.role === "mod" || !user.role === "admin") {
      return res
        .status(401)
        .json({ error: "Your account does not have moderator rights" });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    logger.info(`Moderator logged in: ${email}`);
    res.status(200).json({
      accessToken,
      currentMod: {
        user_id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login User Error:", error);
    res.status(500).json({ error: "Login User Error" });
  }
};

//* Management
const getAllUser = async (req, res) => {
  try {
    const listAllUser = await UserModel.getAllUser();
    return res.status(200).json(listAllUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllProduct = async (req, res) => {
  try {
    const listAllProduct = await ProductModel.getAllProduct();
    return res.status(200).json(listAllProduct);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllPost = async (req, res) => {
  try {
    const listAllPost = await PostModel.getAllPost();
    return res.status(200).json(listAllPost);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllOrder = async (req, res) => {
  try {
    const listAcceptOrderHistory = await OrderModel.getAllAcceptOrder();
    return res.status(200).json(listAcceptOrderHistory);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  emailModeratorVerify,
  registerModeratorWithOTP,
  loginModerator,
  getAllUser,
  getAllProduct,
  getAllPost,
  getAllOrder,
};
