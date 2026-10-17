import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { drizzle as nodeDrizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.js";

const isProd = env.NODE_ENV === "production";
export const db = isProd
  ? neonDrizzle({ connection: env.DATABASE_URL })
  : nodeDrizzle({ connection: env.DATABASE_URL });