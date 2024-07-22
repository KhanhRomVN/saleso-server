const { getDB } = require("../../config/mongoDB");
const { ObjectId } = require("mongodb");

const OTP_COLLECTION = "otps";

const storeOTP = async (email, otp, role) => {
  try {
    const db = getDB();
    await db.collection(OTP_COLLECTION).insertOne({
      email,
      otp,
      role,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // Expires in 15 minutes
    });
  } catch (error) {
    console.error("Error in storeOTP:", error);
    throw error;
  }
};

const verifyOTP = async (email, otp, role) => {
  try {
    const db = getDB();
    const otpRecord = await db
      .collection(OTP_COLLECTION)
      .findOne({ email, otp, role });
    if (!otpRecord) {
      return false;
    }

    if (new Date() > otpRecord.expiresAt) {
      await db
        .collection(OTP_COLLECTION)
        .deleteOne({ _id: new ObjectId(otpRecord._id) });
      return false;
    }

    await db
      .collection(OTP_COLLECTION)
      .deleteOne({ _id: new ObjectId(otpRecord._id) });

    return true;
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    throw error;
  }
};

module.exports = {
  storeOTP,
  verifyOTP,
};
