const express = require("express");
const { GalleryController } = require("../../controller/index");
const { authEmployeeToken } = require("../../middleware/authToken");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/",
    middleware: [authEmployeeToken],
    handler: GalleryController.createImage,
  },
  {
    method: "delete",
    path: "/:image_id",
    handler: GalleryController.deleteImage,
  },
  {
    method: "get",
    path: "/ongoing",
    handler: GalleryController.getOngoingGallery,
  },
];

routes.forEach(({ method, path, middleware = [], handler }) => {
  router[method](path, ...middleware, handler);
});

module.exports = router;
