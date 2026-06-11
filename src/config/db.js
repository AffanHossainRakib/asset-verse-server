const dns = require("node:dns");
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;
const fallbackUri = process.env.MONGODB_URI_FALLBACK;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

const buildClient = (mongoUri) =>
  new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

const configureDnsForAtlasSrv = () => {
  if (!uri.startsWith("mongodb+srv://")) {
    return;
  }

  const dnsServers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length === 0) {
    return;
  }

  dns.setServers(dnsServers);
  console.log(
    `Using DNS servers for MongoDB SRV lookup: ${dnsServers.join(", ")}`,
  );
};

let client;
let dbConnected = false;
let userCollection;
let assetCollection;
let requestCollection;
let assignedAssetCollection;
let packageCollection;
let subscriptionCollection;
let companyCollection;
let employeeAffiliationCollection;
let paymentCollection;
let contactCollection;
let initPromise = null;

const initCollections = async () => {
  if (dbConnected && userCollection) {
    return;
  }

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    configureDnsForAtlasSrv();

    client = buildClient(uri);

    try {
      await client.connect();
    } catch (error) {
      console.error("MongoDB connection failed:", {
        name: error?.name,
        code: error?.code,
        errno: error?.errno,
        syscall: error?.syscall,
        message: error?.message,
      });

      const isSrvRefused =
        error &&
        error.code === "ECONNREFUSED" &&
        error.syscall === "querySrv" &&
        uri.startsWith("mongodb+srv://");

      if (!isSrvRefused || !fallbackUri) {
        throw error;
      }

      console.warn(
        "SRV DNS lookup failed with ECONNREFUSED. Retrying with MONGODB_URI_FALLBACK.",
      );

      client = buildClient(fallbackUri);
      await client.connect();
    }

    const db = client.db("asset_verse_db");
    userCollection = db.collection("users");
    assetCollection = db.collection("assets");
    requestCollection = db.collection("requests");
    assignedAssetCollection = db.collection("assignedAssets");
    packageCollection = db.collection("packages");
    subscriptionCollection = db.collection("subscriptions");
    companyCollection = db.collection("companies");
    employeeAffiliationCollection = db.collection("employeeAffiliations");
    paymentCollection = db.collection("payments");
    contactCollection = db.collection("contacts");
    dbConnected = true;
  })();

  try {
    await initPromise;
  } catch (error) {
    dbConnected = false;
    userCollection = undefined;
    throw error;
  } finally {
    initPromise = null;
  }
};

const getUserCollection = async () => {
  await initCollections();
  return userCollection;
};

const getAssetCollection = async () => {
  await initCollections();
  return assetCollection;
};

const getRequestCollection = async () => {
  await initCollections();
  return requestCollection;
};

const getAssignedAssetCollection = async () => {
  await initCollections();
  return assignedAssetCollection;
};

const getPackageCollection = async () => {
  await initCollections();
  return packageCollection;
};

const getSubscriptionCollection = async () => {
  await initCollections();
  return subscriptionCollection;
};

const getCompanyCollection = async () => {
  await initCollections();
  return companyCollection;
};

const getEmployeeAffiliationCollection = async () => {
  await initCollections();
  return employeeAffiliationCollection;
};

const getPaymentCollection = async () => {
  await initCollections();
  return paymentCollection;
};

const getContactCollection = async () => {
  await initCollections();
  return contactCollection;
};

module.exports = {
  getContactCollection,
  getUserCollection,
  getAssetCollection,
  getRequestCollection,
  getAssignedAssetCollection,
  getPackageCollection,
  getSubscriptionCollection,
  getCompanyCollection,
  getEmployeeAffiliationCollection,
  getPaymentCollection,
};
