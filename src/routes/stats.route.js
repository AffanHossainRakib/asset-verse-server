const express = require("express");
const { getPublicStats } = require("../controllers/stats.controller");

const router = express.Router();

router.get("/public", getPublicStats);

module.exports = router;
