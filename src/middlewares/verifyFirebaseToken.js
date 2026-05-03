const admin = require("../config/firebaseAdmin");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const bodyToken = req.body?.idToken;
  const idToken = bearerToken || bodyToken;

  if (!idToken) {
    return res.status(401).json({
      success: false,
      message: "Missing Firebase auth token.",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken;
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired Firebase auth token.",
    });
  }
};

module.exports = verifyFirebaseToken;
