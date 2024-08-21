const { getDB } = require("../../config/mongoDB");
const Joi = require("joi");
const { ObjectId } = require("mongodb");

const COLLECTION_NAME = "gallery";
const COLLECTION_SCHEMA = Joi.object({
  image_uri: Joi.string().required(),
  // First, there will be 2 types of images: category and banner
  type: Joi.string().required(),
  // 16:9 | 19:6 | 1:2 | 4:12 | 8:1 | 1:1 | 16:5 | 4:3
  ratio: Joi.string().required(),
  // startDate will start at 12AM (ex: 00:00 21/08/2024)
  startDate: Joi.date().required(),
  // endDate will start at 12AM (ex: 00:00 22/08/2024)
  endDate: Joi.date().required(),
  status: Joi.string().valid("upcoming", "ongoing", "expired").required(),
  created_at: Joi.date().default(Date.now),
  updated_at: Joi.date().default(Date.now),
}).options({ abortEarly: false });

const validateData = (data) => {
  const { error } = COLLECTION_SCHEMA.validate(data);
  if (error) throw error;
};

const handleDBOperation = async (operation) => {
  const db = getDB();
  try {
    return await operation(db.collection(COLLECTION_NAME));
  } catch (error) {
    console.error(`Error in ${operation.name}: `, error);
    throw error;
  }
};

const GalleryModel = {
  createImage: async (imageData) => {
    return handleDBOperation(async (collection) => {
      validateData(imageData);
      await collection.insertOne(imageData);
    });
  },

  deleteImage: async (image_id) => {
    return handleDBOperation(async (collection) => {
      await collection.deleteOne({
        _id: ObjectId(image_id),
      });
    });
  },

  getOngoingImages: async () => {
    return handleDBOperation(async (collection) => {
      const ongoingImages = await collection
        .find({
          status: "ongoing",
        })
        .toArray();
      return ongoingImages;
    });
  },
};

module.exports = GalleryModel;
