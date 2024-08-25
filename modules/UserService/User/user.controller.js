const {
  UserModel,
  CustomerDetailModel,
  OTPModel,
  SellerDetailModel,
} = require("../../../models");
const logger = require("../../../config/logger");
const transporter = require("../../../config/nodemailerConfig");
const crypto = require("crypto");
const bcryptjs = require("bcryptjs");
const { getSellerDetail } = require("./SellerDetailModel");
const generateOTP = () => crypto.randomBytes(3).toString("hex");

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

const UserController = {
  createCustomerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      await CustomerDetailModel.addCustomerDetail(req.body);
      return { success: "Create successful customer information" };
    });
  },

  createSellerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      await SellerDetailModel.addSellerDetail(req.body);
      return { success: "Create successful customer information" };
    });
  },

  getUser: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      return await UserModel.getUserById(user_id, role);
    });
  },

  getCustomerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      return await CustomerDetailModel.getCustomerDetail(customer_id);
    });
  },

  getSellerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      return await CustomerDetailModel.getCustomerDetail(seller_id);
    });
  },

  updateUsername: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { username, role } = req.body;
      const user_id = req.user._id.toString();
      await UserModel.updateUsername(user_id, username, role);
      return { message: "Username updated successfully" };
    });
  },

  updateCustomerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const customer_id = req.user._id.toString();
      await CustomerDetailModel.updateCustomerDetail(customer_id, req.body);
      return { message: "Updated customer information successfully" };
    });
  },

  updateSellerDetail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const seller_id = req.user._id.toString();
      await SellerDetailModel.updateCustomerDetail(seller_id, req.body);
      return { message: "Updated seller information successfully" };
    });
  },

  verifyNewEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const role = req.user.role;
      const { newEmail } = req.body;

      const otp = generateOTP();
      await OTPModel.storeOTP(newEmail, otp, role);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: newEmail,
        subject: "New Email OTP",
        html: `<p>Your OTP code is: ${otp}</p>`,
      });

      logger.info(`OTP sent to email: ${newEmail}`);
      return { message: "OTP sent to email" };
    });
  },

  updateEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { newEmail, otp } = req.body;
      const user_id = req.user._id;
      const role = req.user.role;

      const validOTP = await OTPModel.verifyOTP(newEmail, otp, role);
      if (!validOTP) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await UserModel.updateUserField(user_id, { ["email"]: newEmail }, role);
      return { message: "Update Email SuccessFull!" };
    });
  },

  updatePassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const role = req.user.role;
      const { newPassword } = req.body;
      const user_id = req.user._id.toString();
      await UserModel.updatePassword(user_id, newPassword, role);
      return { message: "Password updated successfully!" };
    });
  },

  forgetPassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const role = req.user.role;
      const { email } = req.body;

      const otp = generateOTP();
      await OTPModel.storeOTP(email, otp, role);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        html: `<p>Your OTP code is: ${otp}</p>`,
      });

      logger.info(`OTP sent to email: ${email}`);
      return { message: "OTP sent to email" };
    });
  },

  updateForgetPassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { otp, newPassword } = req.body;
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const email = req.user.email;
      const validOTP = await OTPModel.verifyOTP(email, otp, role);
      if (!validOTP) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      await UserModel.updateForgetPassword(user_id, newPassword, role);
      return { message: "Password reset successfully!" };
    });
  },
};

module.exports = UserController;
