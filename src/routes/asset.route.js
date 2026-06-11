const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const verifyHR = require("../middlewares/verifyHR");
const {
  getPublicAssets,
  getPublicAssetTypes,
  getPublicAssetById,
  getAssets,
  createNewAsset,
  updateAsset,
  deleteAsset,
} = require("../controllers/asset.controller");

const router = express.Router();

// Public routes (no auth) — keep above parameterized/auth routes
router.get("/public", getPublicAssets);
router.get("/public/types", getPublicAssetTypes);
router.get("/public/:id", getPublicAssetById);

router.get("/", verifyFirebaseToken, getAssets);
router.post("/", verifyFirebaseToken, verifyHR, createNewAsset);
router.patch("/:id", verifyFirebaseToken, verifyHR, updateAsset);
router.delete("/:id", verifyFirebaseToken, verifyHR, deleteAsset);

module.exports = router;
