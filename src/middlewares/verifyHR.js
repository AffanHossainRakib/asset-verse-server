const { findUserByEmail } = require("../models/user.model");

const verifyHR = async (req, res, next) => {
  const email = req.firebaseUser?.email?.toLowerCase();

  if (!email) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user email is missing.",
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    if (user.role !== "hr") {
      return res.status(403).json({
        success: false,
        message: "HR access required.",
      });
    }

    req.userProfile = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to verify HR role.",
    });
  }
};

module.exports = verifyHR;
