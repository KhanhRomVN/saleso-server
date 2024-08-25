const express = require("express");
const { authToken } = require("../../../middleware/authToken");
const { ConservationController } = require("../../../controllers");
const router = express.Router();

module.exports = router;
