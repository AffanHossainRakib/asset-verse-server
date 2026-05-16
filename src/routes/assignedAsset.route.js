const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  getAssignedAssetsForCurrentUser,
} = require("../controllers/request.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getAssignedAssetsForCurrentUser);

module.exports = router;
