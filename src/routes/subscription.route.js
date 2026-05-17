const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  createCheckoutSession,
  verifyCheckoutSession,
} = require("../controllers/subscription.controller");

const router = express.Router();

router.post(
  "/create-checkout-session",
  verifyFirebaseToken,
  createCheckoutSession,
);

router.get("/verify-session", verifyFirebaseToken, verifyCheckoutSession);

module.exports = router;
