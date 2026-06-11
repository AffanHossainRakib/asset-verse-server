const { getContactCollection } = require("../config/db");

const createContactMessage = async (contactDocument) => {
  const contactCollection = await getContactCollection();
  return contactCollection.insertOne(contactDocument);
};

module.exports = {
  createContactMessage,
};
