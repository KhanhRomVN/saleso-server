const { UserModel, UserDetailModel, OTPModel } = require("../../models/index");
const logger = require("../../config/logger");
const transporter = require("../../config/nodemailerConfig");
const crypto = require("crypto");
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
  getUserDataByUsername: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { username, role } = req.body;
      const user = await UserModel.getUserByUsername(username, role);
      if (!user) {
        throw new Error(`User with username <${username}> not found`);
      }
      const userData = {
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };
      const userDetail = await UserDetailModel.getUserDetailByUserId(
        user._id.toString()
      );
      return userDetail ? { ...userData, ...userDetail } : userData;
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
      await UserDetailModel.updateUserDetailField(user_id, { [field]: value });
      return { message: `${field} updated successfully!` };
    });
  },

  verifyEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { newEmail, role } = req.body;
      const existingEmail = await UserModel.getUserByEmail(newEmail, role);
      if (existingEmail) {
        return res.status(400).json({
          error: "You cannot register because the email already exists",
        });
      }

      const otp = generateOTP();
      await OTPModel.storeOTP(newEmail, otp);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: newEmail,
        subject: "New email OTP Confirmation",
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email OTP Confirmation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .container {
                  background-color: #f9f9f9;
                  border-radius: 5px;
                  padding: 20px;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              }
              h1 {
                  color: #2c3e50;
              }
              .otp-code {
                  font-size: 32px;
                  font-weight: bold;
                  color: #3498db;
                  letter-spacing: 5px;
                  text-align: center;
                  margin: 20px 0;
              }
              .footer {
                  margin-top: 20px;
                  font-size: 12px;
                  color: #7f8c8d;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Email OTP Confirmation</h1>
              <p>Dear Seller,</p>
              <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP):</p>
              <div class="otp-code">${otp}</div>
              <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
              <p>Best regards,<br>Saleso</p>
          </div>
          <div class="footer">
              This is an automated message. Please do not reply to this email.
          </div>
      </body>
      </html>
        `,
      });
      return { message: "Please check the OTP sent to gmail" };
    });
  },

  updateEmail: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id;
      const { newEmail, otp } = req.body;
      const validOTP = await OTPModel.verifyOTP(newEmail, otp);
      if (!validOTP) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      await UserModel.updateUserField(user_id, { ["email"]: newEmail });
      return { message: "Update Email SuccessFull!" };
    });
  },

  updatePassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const { currentPassword, newPassword } = req.body;
      const user_id = req.user._id;
      const role = req.user.role;
      await UserModel.updatePassword(user_id, currentPassword, newPassword);
      return { message: "Password updated successfully!" };
    });
  },

  forgetPassword: async (req, res) => {
    handleRequest(req, res, async (req) => {
      const user_id = req.user._id;
      const role = req.user.role;
      const { email } = req.body;
      const user = await UserModel.getUserById(user_id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const otp = generateOTP();
      await OTPModel.storeOTP(email, otp);

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
      const { email, otp, newPassword } = req.body;
      const role = req.user.role;
      const validOTP = await OTPModel.verifyOTP(email, otp);
      if (!validOTP) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const user = await UserModel.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await UserModel.updateForgetPassword(user._id, newPassword);
      return { message: "Password reset successfully!" };
    });
  },
};

module.exports = UserController;
