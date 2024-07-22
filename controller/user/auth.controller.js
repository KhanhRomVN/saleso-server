const { UserModel, userDetailModel, OTPModel } = require("../../models/index");
const transporter = require("../../config/nodemailerConfig");
const { CustomError } = require("../../middleware/errorHandler");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateOTP = () => crypto.randomBytes(3).toString("hex");

const getEmailTemplate = (otp, role) => `
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
        <p>Dear ${role === "seller" ? "Seller" : "User"},</p>
        <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP):</p>
        <div class="otp-code">${otp}</div>
        <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>Best regards,<br>${role === "seller" ? "Saleso" : "Your Company Name"}</p>
    </div>
    <div class="footer">
        This is an automated message. Please do not reply to this email.
    </div>
</body>
</html>
`;

const emailVerify = async (req, res, next) => {
  const { email, role } = req.body;
  try {
    const existingUser = await UserModel.getUserByEmail(email, role);
    if (existingUser) {
      throw new CustomError(
        400,
        `This <${email}> is linked to another account`
      );
    }

    const otp = generateOTP();
    await OTPModel.storeOTP(email, otp, role);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Saleso - Email OTP Confirmation ${role === "seller" ? "Seller" : ""}`,
      html: getEmailTemplate(otp, role),
    });

    res.status(200).json({ message: "Please check the OTP sent to gmail" });
  } catch (error) {
    next(error);
  }
};

const registerUserWithOTP = async (req, res, next) => {
  const { email, otp, username, password, role } = req.body;
  try {
    const validOTP = await OTPModel.verifyOTP(email, otp, role);
    if (!validOTP) {
      throw new CustomError(400, "Invalid or expired OTP");
    }

    const existingEmail = await UserModel.getUserByEmail(email, role);
    const existingUsername = await UserModel.getUserByUsername(username, role);
    if (existingEmail) {
      throw new CustomError(
        400,
        `You cannot register because the email <${email}> already exists`
      );
    }
    if (existingUsername) {
      throw new CustomError(
        400,
        `You cannot register because the username <${username}> already exists`
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userData = {
      username,
      email,
      role,
      emailConfirmed: "true",
      password: hashedPassword,
      register_at: new Date(),
    };

    await UserModel.registerUser(email, role, userData);
    const user = await UserModel.getUserByEmail(email, role);
    await userDetailModel.createUserDetail(user._id);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
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

    const accessToken = jwt.sign(
      { user_id: existingUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );
    const refreshToken = jwt.sign(
      { user_id: existingUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );
    await UserModel.updateRefreshToken(existingUser._id, refreshToken, role);

    res.status(200).json({
      accessToken,
      refreshToken,
      currentUser: {
        user_id: existingUser._id,
        username: existingUser.username,
        role: role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  emailVerify,
  registerUserWithOTP,
  loginUser,
};
