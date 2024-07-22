const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  register_at: Joi.date().required(),
  last_login: Joi.date().default(() => new Date()),
  update_at: Joi.date().default(() => new Date()),
  refreshToken: Joi.string().default(""),
  emailConfirmed: Joi.string().valid("true", "false").default("false"),
  oauth: Joi.object({
    google: Joi.object({
      google_id: Joi.string().optional(),
      google_email: Joi.string().email().optional(),
    }).optional(),
  }).optional(),
}).options({ abortEarly: false });

const validateUser = (userData) => {
  const validation = COLLECTION_SCHEMA.validate(userData);
  if (validation.error) {
    throw new Error(
      validation.error.details.map((detail) => detail.message).join(", ")
    );
  }
};

const registerUser = async (email, role, userData) => {
  const db = getDB();
  try {
    await db
      .collection(role)
      .updateOne({ email: email }, { $set: userData }, { upsert: true });
  } catch (error) {
    throw new Error("Failed to register user: " + error.message);
  }
};

const confirmEmail = async (email) => {
  const db = getDB();
  try {
    return db
      .collection(COLLECTION_NAME)
      .updateOne({ email }, { $set: { emailConfirmed: "true" } });
  } catch (error) {
    throw new Error("Failed to confirm email: " + error.message);
  }
};

const addGoogleUser = async (newUser) => {
  const db = getDB();
  try {
    return db.collection(COLLECTION_NAME).insertOne(newUser);
  } catch (error) {
    throw new Error("Failed to add Google user: " + error.message);
  }
};

const updateRefreshToken = async (user_id, refreshToken, role) => {
  const db = getDB();
  try {
    return db
      .collection(role)
      .updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { refreshToken }, $currentDate: { last_login: true } }
      );
  } catch (error) {
    throw new Error("Failed to update refresh token: " + error.message);
  }
};

const logoutUser = async (user_id, updateData) => {
  const db = getDB();
  try {
    return db
      .collection(COLLECTION_NAME)
      .updateOne({ _id: new ObjectId(user_id) }, { $set: updateData });
  } catch (error) {
    throw new Error("Failed to logout user: " + error.message);
  }
};

//* Get User Data
const getUserById = async (user_id, role) => {
  const db = getDB();
  try {
    return db.collection(role).findOne({ _id: new ObjectId(user_id) });
  } catch (error) {
    throw new Error("Failed to get user by ID: " + error.message);
  }
};

const getUserByUsername = async (username, role) => {
  const db = getDB();
  try {
    return db.collection(role).findOne({ username });
  } catch (error) {
    throw new Error(`Failed to get ${role} account by username <${username}>`);
  }
};

const getAllUser = async () => {
  const db = getDB();
  try {
    return db.collection(COLLECTION_NAME).find().toArray();
  } catch (error) {
    throw new Error("Failed to get all users: " + error.message);
  }
};

const getUserByEmail = async (email, role) => {
  const db = getDB();
  try {
    return db.collection(role).findOne({ email });
  } catch (error) {
    throw new Error(`Failed to get ${role} user by email <${email}`);
  }
};

const getUserByGoogleId = async (googleId) => {
  const db = getDB();
  try {
    return db
      .collection(COLLECTION_NAME)
      .findOne({ "oauth.google.gg_id": googleId });
  } catch (error) {
    throw new Error("Failed to get user by Google ID: " + error.message);
  }
};

//* Update Data User [username, email, role]
const updateUsername = async (user_id, username, role) => {
  const db = getDB();
  try {
    return db
      .collection(role)
      .updateOne(
        { _id: new ObjectId(user_id) },
        { $set: username, $currentDate: { update_at: true } }
      );
  } catch (error) {
    throw new Error("Failed to update username: " + error.message);
  }
};

//* Update Password
const updatePassword = async (user_id, currentPassword, newPassword) => {
  const db = getDB();
  try {
    const user = await db
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(user_id) });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new Error("Incorrect current password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { password: hashedNewPassword } }
      );
  } catch (error) {
    throw new Error("Failed to update password: " + error.message);
  }
};

const updateForgetPassword = async (user_id, newPassword) => {
  const db = getDB();
  try {
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await db
      .collection(COLLECTION_NAME)
      .updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { password: hashedNewPassword } }
      );
  } catch (error) {
    throw new Error("Failed to update forgotten password: " + error.message);
  }
};

module.exports = {
  registerUser,
  confirmEmail,
  addGoogleUser,
  updateRefreshToken,
  logoutUser,
  getUserById,
  getUserByUsername,
  getAllUser,
  updateUsername,
  getUserByEmail,
  updatePassword,
  updateForgetPassword,
};
