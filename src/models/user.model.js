const { ObjectId } = require("mongodb");
const { getUserCollection } = require("../config/db");

const findUserByEmail = async (email) => {
  const userCollection = await getUserCollection();
  return userCollection.findOne({ email: email.toLowerCase() });
};

const createANewUser = async (userDocument) => {
  const userCollection = await getUserCollection();
  return userCollection.insertOne(userDocument);
};

const findUsers = async () => {
  const userCollection = await getUserCollection();
  return userCollection.find({}).sort({ createdAt: -1 }).toArray();
};

const updateUserById = async (userId, updateDoc) => {
  const userCollection = await getUserCollection();
  return userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateDoc },
  );
};

module.exports = {
  findUserByEmail,
  createANewUser,
  findUsers,
  updateUserById,
};
