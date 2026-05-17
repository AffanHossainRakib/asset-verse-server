const { getPaymentCollection } = require("../config/db");

const createPayment = async (paymentDoc) => {
  const coll = await getPaymentCollection();
  // Avoid duplicate payments: check by sessionId or paymentIntent
  if (paymentDoc.sessionId) {
    const existing = await coll.findOne({ sessionId: paymentDoc.sessionId });
    if (existing) return existing;
  }

  if (paymentDoc.paymentIntent) {
    const existingByIntent = await coll.findOne({
      paymentIntent: paymentDoc.paymentIntent,
    });
    if (existingByIntent) return existingByIntent;
  }

  const result = await coll.insertOne(paymentDoc);
  return { insertedId: result.insertedId, ...paymentDoc };
};

const findPaymentsByEmail = async (email) => {
  const coll = await getPaymentCollection();
  return coll
    .find({ email: email.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();
};

module.exports = {
  createPayment,
  findPaymentsByEmail,
};
