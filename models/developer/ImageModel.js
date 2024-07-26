const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "images";

const COLLECTION_SCHEMA = Joi.object({
  image_url: Joi.string().required(),
  type: Joi.string().valid("category", "banner").required(),
  path: Joi.string().required(),
  image_ratio: Joi.string().required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateImage = (data) => {
  const { error, value } = COLLECTION_SCHEMA.validate(data);
  if (error) throw new Error(error.details.map((d) => d.message).join(", "));
  return value;
};

const addImage = async (imageData) => {
  const db = await getDB();
  const validatedData = validateImage(imageData);
  const result = await db.collection(COLLECTION_NAME).insertOne(validatedData);
  return result.insertedId;
};

const getImages = async (type) => {
  const db = await getDB();
  return db.collection(COLLECTION_NAME).find({ type }).toArray();
};

const deleteImage = async (id, type) => {
  const db = await getDB();
  const result = await db
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id), type });
  if (result.deletedCount === 0) throw new Error(`${type} not found`);
};

module.exports = {
  addCategory: (data) => addImage({ ...data, type: "category" }),
  addBanner: (data) => addImage({ ...data, type: "banner" }),
  getCategories: () => getImages("category"),
  getBanners: () => getImages("banner"),
  deleteCategory: (id) => deleteImage(id, "category"),
  deleteBanner: (id) => deleteImage(id, "banner"),
};
