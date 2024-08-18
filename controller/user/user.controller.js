const { UserModel, UserDetailModel, OTPModel } = require("../../models/index");
const logger = require("../../config/logger");
const transporter = require("../../config/nodemailerConfig");
const crypto = require("crypto");
const bcryptjs = require("bcryptjs");
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
  getUserDataById: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id.toString();
      const role = req.user.role;
      const user = await UserModel.getUserById(user_id, role);
      if (!user) {
        return { message: `User with username <${username}> not found` };
      }
      const userData = {
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };
      const userDetail = await UserDetailModel.getUserDetailByUserId(
        user._id.toString(),
        role
      );

      if (userDetail) {
        const { _id, seller_id, customer_id, ...filteredUserDetail } =
          userDetail;
        return { ...userData, ...filteredUserDetail };
      } else {
        return userData;
      }
    });
  },

  updateUsername: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { username, role } = req.body;
      const user_id = req.user._id;
      await UserModel.updateUsername(user_id, username, role);
      return { message: "Username updated successfully!" };
    });
  },

  updateUserDetailField: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { field, value } = req.body;
      const user_id = req.user._id.toString();
      const role = req.user.role;
      let updateObject = {};
      field.forEach((fieldName, index) => {
        if (value[index] !== null) {
          updateObject[fieldName] = value[index];
        }
      });
      if (Object.keys(updateObject).length > 0) {
        await UserDetailModel.updateUserDetailField(
          user_id,
          updateObject,
          role
        );
        return { message: "User details updated successfully!" };
      } else {
        return { message: "No fields to update." };
      }
    });
  },

  verifyAccount: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { email, password } = req.body;
      const role = req.user.role;
      const existingUser = await UserModel.getUserByEmail(email, role);
      if (!existingUser) {
        throw new CustomError(401, "This email has not been registered.");
      }
      const isPasswordValid = await bcryptjs.compare(
        password,
        existingUser.password
      );
      if (!isPasswordValid) {
        throw new CustomError(401, "This password is not valid");
      }
      return { message: "Verify account successfully" };
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

  // Update Password (Dont forget password)
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
