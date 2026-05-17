const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { getPayments } = require("../controllers/payments.controller");

const router = express.Router();

router.get("/", verifyFirebaseToken, getPayments);

module.exports = router;
