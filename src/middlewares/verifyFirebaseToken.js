const admin = require("../config/firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Missing or malformed Authorization header.",
    });
  }

  const idToken = authHeader.slice(7).trim();

  try {
    req.firebaseUser = await admin.auth().verifyIdToken(idToken);
    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Firebase token verification failed:",
        error.code,
        error.message,
      );
    }

    const message =
      error.code === "auth/id-token-expired"
        ? "Firebase auth token has expired."
        : "Invalid Firebase auth token.";

    return res.status(401).json({ success: false, message });
  }
};

module.exports = verifyFirebaseToken;
