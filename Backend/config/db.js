import dns from "node:dns";
import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/pulselife";
const PUBLIC_DNS_FALLBACK = ["8.8.8.8", "1.1.1.1"];

function isSrvConnectionString(uri) {
  return typeof uri === "string" && uri.startsWith("mongodb+srv://");
}

function isSrvDnsRefusal(error) {
  return error?.code === "ECONNREFUSED" && error?.syscall === "querySrv";
}

function parseDnsServers(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
}

async function retryWithDnsServers(uri, servers) {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }

  dns.setServers(servers);
  console.warn(
    `MongoDB SRV lookup failed with the current DNS resolver. Retrying with ${servers.join(", ")}.`,
  );

  return mongoose.connect(uri);
}

export function getMongoUri() {
  return process.env.MONGO_URI || DEFAULT_MONGO_URI;
}

export async function connectDB(uri = getMongoUri()) {
  const configuredDnsServers = parseDnsServers(process.env.MONGO_DNS_SERVERS);

  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }

  if (isSrvConnectionString(uri) && configuredDnsServers.length > 0) {
    dns.setServers(configuredDnsServers);
    console.log(`Using custom MongoDB DNS servers: ${configuredDnsServers.join(", ")}`);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
    return mongoose.connection;
  } catch (error) {
    if (
      isSrvConnectionString(uri) &&
      configuredDnsServers.length === 0 &&
      isSrvDnsRefusal(error)
    ) {
      await retryWithDnsServers(uri, PUBLIC_DNS_FALLBACK);
      console.log("MongoDB Connected");
      return mongoose.connection;
    }

    throw error;
  }
}

export default connectDB;
