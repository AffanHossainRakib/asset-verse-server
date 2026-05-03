const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { createUser } = require("../controllers/user.controller");

const router = express.Router();

router.post("/", verifyFirebaseToken, createUser);

module.exports = router;
