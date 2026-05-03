const { getUserCollection } = require("../config/db");

const findUserByEmail = async (email) => {
  const userCollection = await getUserCollection();
  return userCollection.findOne({ email: email.toLowerCase() });
};

const createANewUser = async (userDocument) => {
  const userCollection = await getUserCollection();
  return userCollection.insertOne(userDocument);
};

module.exports = {
  findUserByEmail,
  createANewUser,
};
