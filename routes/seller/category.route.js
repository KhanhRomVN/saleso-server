const express = require("express");
const { CategoryController } = require("../../controller");
const router = express.Router();

const routes = [
  {
    method: "post",
    path: "/create",
    handler: CategoryController.createCategory,
  },
  {
    method: "get",
    path: "/get/:id",
    handler: CategoryController.getCategoryById,
  },
  {
    method: "get",
    path: "/get/children/:value",
    handler: CategoryController.getChildrenCategories,
  },
  {
    method: "get",
    path: "/root",
    handler: CategoryController.getRootCategories,
  },
  { method: "get", path: "/all", handler: CategoryController.getCategories },
  {
    method: "put",
    path: "/update/:id",
    handler: CategoryController.updateCategory,
  },
  {
    method: "delete",
    path: "/delete/:id",
    handler: CategoryController.deleteCategory,
  },
];

routes.forEach(({ method, path, handler }) => {
  router[method](path, handler);
});

module.exports = router;
