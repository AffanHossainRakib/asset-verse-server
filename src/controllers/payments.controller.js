const { findPaymentsByEmail } = require("../models/payment.model");

const getPayments = async (req, res) => {
  try {
    const email = req.query.email || req.firebaseUser?.email;

    if (!email) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }

    // Ensure the requesting user is the same as the target email
    const requester = req.firebaseUser?.email;
    if (!requester || requester.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const payments = await findPaymentsByEmail(email);

    // Map to frontend shape expected by PaymentHistory
    const mapped = (payments || []).map((p) => ({
      _id: p._id,
      parcelName: p.packageName || "Subscription",
      amount: p.amount,
      trackingId: p.sessionId,
      transactionId: p.paymentIntent,
      createdAt: p.createdAt,
    }));

    return res.status(200).json({ success: true, payments: mapped });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: err.message || "Unable to fetch payments",
      });
  }
};

module.exports = {
  getPayments,
};
