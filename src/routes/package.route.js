const express = require("express");
const { getPackages } = require("../controllers/package.controller");

const router = express.Router();

router.get("/", getPackages);

module.exports = router;
