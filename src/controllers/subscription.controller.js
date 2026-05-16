const stripe = require("../config/stripe");
const { findPackages } = require("../models/package.model");

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
      success_url: `${process.env.CLIENT_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/payment-cancelled`,
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

module.exports = {
  createCheckoutSession,
};
