const { ImageModel } = require("../../models/index");

const handleRequest = async (req, res, operation) => {
  try {
    const result = await operation(req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ImageController = {
  addImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { image_url, type, path, image_ratio } = req.body;
      const result = await ImageModel.addImage({
        image_url,
        type,
        path: `${type}/${path}`,
        image_ratio,
      });
      return { message: `${type} added successfully`, data: result };
    }),

  getImages: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { type } = req.query;
      return await ImageModel.getImages(type);
    }),

  deleteImage: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      await ImageModel.deleteImage(id);
      return { message: "Image deleted successfully" };
    }),

  updateImagePath: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const { path } = req.body;
      await ImageModel.updateImagePath(id, path);
      return { message: "Image path updated successfully" };
    }),

  updateImageUrl: (req, res) =>
    handleRequest(req, res, async (req) => {
      const { id } = req.params;
      const { image_url } = req.body;
      await ImageModel.updateImageUrl(id, image_url);
      return { message: "Image URL updated successfully" };
    }),
};

module.exports = ImageController;
