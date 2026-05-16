const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  createCheckoutSession,
} = require("../controllers/subscription.controller");

const router = express.Router();

router.post(
  "/create-checkout-session",
  verifyFirebaseToken,
  createCheckoutSession,
);

module.exports = router;
