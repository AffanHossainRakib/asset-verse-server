const admin = require("../config/firebaseAdmin");
const { findUserByEmail, createANewUser } = require("../models/user.model");

const createUser = async (req, res) => {
  const { name, email, dateOfBirth, role, companyName, companyLogo } = req.body;
  const decodedToken = req.firebaseUser;

  // Validate common fields
  if (!decodedToken || !name || !email || !dateOfBirth || !role) {
    return res.status(400).json({
      success: false,
      message:
        "Missing required registration fields (auth token, name, email, dateOfBirth, role).",
    });
  }

  // Validate HR-specific fields
  if (role === "hr" && (!companyName || !companyLogo)) {
    return res.status(400).json({
      success: false,
      message: "HR registration requires companyName and companyLogo.",
    });
  }

  // Validate role
  if (!["hr", "employee"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be either 'hr' or 'employee'.",
    });
  }

  try {
    if (decodedToken.email !== email) {
      return res.status(403).json({
        success: false,
        message: "Firebase account email does not match the submitted email.",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const now = new Date().toISOString();
    let userDocument = {
      name,
      email: normalizedEmail,
      role,
      dateOfBirth,
      createdAt: now,
      updatedAt: now,
      firebaseUid: decodedToken.uid,
    };

    // Add HR-specific fields
    if (role === "hr") {
      userDocument = {
        ...userDocument,
        companyName,
        companyLogo,
        packageLimit: 5,
        currentEmployees: 0,
        subscription: "basic",
      };
    }

    const result = await createANewUser(userDocument);

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      data: {
        ...userDocument,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    if (decodedToken?.uid) {
      try {
        await admin.auth().deleteUser(decodedToken.uid);
      } catch (cleanupError) {
        console.warn(
          "Failed to clean up Firebase user after registration error.",
          cleanupError,
        );
      }
    }

    const statusCode = error?.status || 500;
    const message =
      error?.message || "Unable to complete registration at this time.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = { createUser };
