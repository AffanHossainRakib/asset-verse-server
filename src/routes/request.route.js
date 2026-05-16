const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const verifyHR = require("../middlewares/verifyHR");
const {
  getRequestsForCurrentUser,
  createAssetRequest,
  approveRequest,
  rejectRequest,
} = require("../controllers/request.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getRequestsForCurrentUser);
router.post("/", verifyFirebaseToken, createAssetRequest);
router.patch("/:id/approve", verifyFirebaseToken, verifyHR, approveRequest);
router.patch("/:id/reject", verifyFirebaseToken, verifyHR, rejectRequest);

module.exports = router;
