const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  createUser,
  getCurrentUserRole,
  getUsers,
  updateUserRole,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/", verifyFirebaseToken, createUser);
router.get("/role", verifyFirebaseToken, getCurrentUserRole);
router.get("/", verifyFirebaseToken, getUsers);
router.patch("/:id", verifyFirebaseToken, updateUserRole);

module.exports = router;
