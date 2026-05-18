const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const verifyHR = require("../middlewares/verifyHR");
const {
  getAssignedAssetsForCurrentUser,
  returnAssignedAsset,
  assignAssetDirectly,
} = require("../controllers/request.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getAssignedAssetsForCurrentUser);
router.patch("/:id/return", verifyFirebaseToken, returnAssignedAsset);
router.post("/assign", verifyFirebaseToken, verifyHR, assignAssetDirectly);

module.exports = router;
