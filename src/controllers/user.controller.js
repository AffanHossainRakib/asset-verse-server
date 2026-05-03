const admin = require("../config/firebaseAdmin");
const {
  findUserByEmail,
  createANewUser,
  findUsers,
  updateUserById,
} = require("../models/user.model");

const allowedRoles = ["hr", "employee"];

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

const getCurrentUserRole = async (req, res) => {
  const decodedToken = req.firebaseUser;

  if (!decodedToken?.email) {
    return res.status(401).json({
      success: false,
      message: "Missing authenticated user information.",
    });
  }

  try {
    const user = await findUserByEmail(decodedToken.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      role: user.role || null,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch user role.",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await findUsers();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to fetch users.",
    });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${allowedRoles.join(", ")}.`,
    });
  }

  try {
    const result = await updateUserById(id, {
      role,
      updatedAt: new Date().toISOString(),
    });

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to update user role.",
    });
  }
};

module.exports = {
  createUser,
  getCurrentUserRole,
  getUsers,
  updateUserRole,
};
