const { UserModel, UserDetailModel, OTPModel } = require("../../models/index");
const logger = require("../../config/logger");
const crypto = require("crypto");
const transporter = require("../../config/nodemailerConfig");
const generateOTP = () => crypto.randomBytes(3).toString("hex");

//* Get User Data & User Detail Data
const getUserDataByUsername = async (req, res) => {
  const { username, role } = req.body;
  try {
    const user = await UserModel.getUserByUsername(username, role);
    if (!user) {
      return res.status(404).json({ error: `User with <${email}> not found` });
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
    const userDataFinal = userDetail
      ? { ...userData, ...userDetail }
      : userData;

    res.status(200).json(userDataFinal);
  } catch (error) {
    logger.error("Error in getUserData:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
};

const getUserDataByIdServerSide = async (user_id, role) => {
  try {
    const user = await UserModel.getUserById(user_id, role);
    if (!user) {
      return json({ message: "Can not find user" });
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
    const userDataFinal = userDetail
      ? { ...userData, ...userDetail }
      : userData;

    return userDataFinal;
  } catch (error) {
    console.error("Error in getUserData:", error);
  }
};

//* Update User Data [username, email, role]
const updateUsername = async (req, res) => {
  const { username, role } = req.body;
  const user_id = req.user._id;
  try {
    await UserModel.updateUsername(user_id, username, role);
    res.status(200).json({ message: `${field} updated successfully!` });
  } catch (error) {
    res.status(500).json({ error: `Error updating username` });
  }
};

//* Update User Detail Data [name, age. gender, about, address, avatar]
const updateUserDetailField = async (req, res) => {
  const { field, value } = req.body;
  const user_id = req.user._id.toString();
  try {
    await UserDetailModel.updateUserDetailField(user_id, { [field]: value });
    res.status(200).json({ message: `${field} updated successfully!` });
  } catch (error) {
    logger.error(`Error updating ${field}:`, error);
    res.status(500).json({ error: `Error updating ${field}` });
  }
};

//* Update Email
const verifyEmail = async (req, res) => {
  const { newEmail, role } = req.body;
  try {
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
    res.status(200).json({ message: "Please check the OTP sent to gmail" });
  } catch (error) {
    res.status(500).json({ error: "Verify Email Error" });
  }
};

const updateEmail = async (req, res) => {
  const user_id = req.user._id;
  const { newEmail, otp } = req.body;
  try {
    const validOTP = await OTPModel.verifyOTP(newEmail, otp);
    if (!validOTP) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    await UserModel.updateUserField(user_id, { ["email"]: newEmail });
    res.status(201).json({ message: "Update Email SuccessFull!" });
  } catch (error) {
    logger.error("Register User with OTP Failed:", error);
    res.status(500).json({ error: "Register User with OTP Failed" });
  }
};

//* Update Password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user_id = req.user._id;
  const role = req.user.role;
  try {
    await UserModel.updatePassword(user_id, currentPassword, newPassword);
    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    logger.error("Error updating password:", error);
    res.status(500).json({ error: "Error updating password" });
  }
};

const forgetPassword = async (req, res) => {
  const user_id = req.user._id;
  const role = req.user.role;
  const { email } = req.body;
  try {
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
    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    logger.error("Forget Password Error:", error);
    res.status(500).json({ error: "Forget Password Error" });
  }
};

const updateForgetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const role = req.user.role;
  try {
    const validOTP = await OTPModel.verifyOTP(email, otp);
    if (!validOTP) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const user = await UserModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await UserModel.updateForgetPassword(user._id, newPassword);
    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    logger.error("Error resetting password:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
};

module.exports = {
  getUserDataByUsername,
  getUserDataByIdServerSide,
  updateUsername,
  updateUserDetailField,
  verifyEmail,
  updateEmail,
  updatePassword,
  forgetPassword,
  updateForgetPassword,
};
