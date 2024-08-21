const { GalleryModel } = require("../../models/index");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const determineStatus = (startDate, endDate) => {
  const now = new Date();
  if (now < startDate) return "upcoming";
  if (now >= startDate && now <= endDate) return "ongoing";
  return "expired";
};

const GalleryController = {
  createImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_uri, type, ratio, startDate, endDate } = req.body;
      const status = determineStatus(startDate, endDate);
      const imageData = {
        image_uri,
        type,
        ratio,
        startDate,
        endDate,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await GalleryModel.createImage(imageData);
      return { success: "Create image/gallery success" };
    }),

  deleteImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_id } = req.params;
      await GalleryModel.deleteImage(image_id);
      return { success: "Delete image/gallery success" };
    }),

  getOngoingGallery: (req, res) =>
    handleRequest(req, res, async (req) => {
      return await GalleryModel.getOngoingImages();
    }),
};

module.exports = GalleryController;
