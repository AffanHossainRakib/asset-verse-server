const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const verifyHR = require("../middlewares/verifyHR");
const {
  getAssets,
  createNewAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/asset.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getAssets);
router.post("/", verifyFirebaseToken, verifyHR, createNewAsset);
router.patch("/:id", verifyFirebaseToken, verifyHR, updateAsset);
router.delete("/:id", verifyFirebaseToken, verifyHR, deleteAsset);

module.exports = router;
