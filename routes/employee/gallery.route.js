const express = require("express");
const { GalleryController } = require("../../controller/index");
// const { authEmployeeToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    handler: GalleryController.createImage,
  },
  {
    method: "delete",
    path: "/:image_id",
    handler: GalleryController.deleteImage,
  },
  {
    method: "get",
    path: "/:image_id",
    handler: GalleryController.getImage,
  },
  {
    method: "put",
    path: "/:image_id",
    handler: GalleryController.updatePath,
  },
  {
    method: "post",
    path: "/filter",
    handler: GalleryController.getFilteredAndSortedImages,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
