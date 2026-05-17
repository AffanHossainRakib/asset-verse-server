const stripe = require("../config/stripe");
const { findPackages } = require("../models/package.model");
const { updateUserByEmail } = require("../models/user.model");

const createCheckoutSession = async (req, res) => {
  try {
    const { packageId } = req.body;
    const packages = await findPackages();
    const selectedPackage = packages.find(
      (packageItem) => packageItem._id.toString() === packageId,
    );

    if (!selectedPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found.",
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(501).json({
        success: false,
        message: "Stripe is not configured on the server.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedPackage.name} Package`,
            },
            unit_amount: Math.round(Number(selectedPackage.price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard/all-requests?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/payment-cancelled`,
      metadata: {
        hrEmail: req.firebaseUser?.email || "",
        packageId: selectedPackage._id.toString(),
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        url: session.url,
        id: session.id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to create checkout session.",
    });
  }
};

const verifyCheckoutSession = async (req, res) => {
  try {
    const sessionId =
      req.query.session_id || req.query.sessionId || req.body?.session_id;

    if (!sessionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing session_id." });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Checkout session not found." });
    }

    // Check payment status
    const paid =
      session.payment_status === "paid" || session.status === "complete";

    if (!paid) {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed yet." });
    }

    const hrEmail = session.metadata?.hrEmail;
    const packageId = session.metadata?.packageId;

    if (!hrEmail || !packageId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing session metadata." });
    }

    const packages = await findPackages();
    const selectedPackage = packages.find(
      (p) => p._id.toString() === packageId,
    );

    if (!selectedPackage) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Package not found for this session.",
        });
    }

    const now = new Date().toISOString();
    await updateUserByEmail(hrEmail, {
      packageLimit: selectedPackage.employeeLimit,
      subscription: selectedPackage.name.toLowerCase(),
      updatedAt: now,
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Subscription updated.",
        data: { package: selectedPackage.name },
      });
  } catch (error) {
    console.error("verifyCheckoutSession error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error?.message || "Unable to verify checkout session.",
      });
  }
};

module.exports = {
  createCheckoutSession,
  verifyCheckoutSession,
};
