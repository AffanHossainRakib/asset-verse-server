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

module.exports = {
  getUserCollection,
};
