const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  getAssignedAssetsForCurrentUser,
  returnAssignedAsset,
} = require("../controllers/request.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getAssignedAssetsForCurrentUser);
router.patch("/:id/return", verifyFirebaseToken, returnAssignedAsset);

module.exports = router;
