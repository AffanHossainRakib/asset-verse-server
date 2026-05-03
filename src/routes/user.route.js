const express = require("express");
const { createUser } = require("../controllers/user.controller");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

const router = express.Router();

router.post("/", verifyFirebaseToken, createUser);

module.exports = router;
