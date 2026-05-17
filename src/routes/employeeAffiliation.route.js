const express = require("express");
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const verifyHR = require("../middlewares/verifyHR");
const {
  getCompanyEmployees,
  removeEmployeeFromCompany,
} = require("../controllers/employeeAffiliation.controller");

const router = express.Router();

router.get("/company", verifyFirebaseToken, verifyHR, getCompanyEmployees);
router.patch(
  "/:id/remove",
  verifyFirebaseToken,
  verifyHR,
  removeEmployeeFromCompany,
);

module.exports = router;
