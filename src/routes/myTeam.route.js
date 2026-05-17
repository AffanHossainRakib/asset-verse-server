const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { getMyTeam } = require("../controllers/myTeam.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getMyTeam);

module.exports = router;
