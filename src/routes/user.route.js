const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const {
  createUser,
  getCurrentUserRole,
  getUsers,
  updateUserRole,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/", verifyFirebaseToken, createUser);
router.get("/me", verifyFirebaseToken, getCurrentUser);
router.get("/role", verifyFirebaseToken, getCurrentUserRole);
router.get("/", verifyFirebaseToken, getUsers);
router.patch("/me", verifyFirebaseToken, updateCurrentUser);
router.patch("/:id", verifyFirebaseToken, updateUserRole);

module.exports = router;
