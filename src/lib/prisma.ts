import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import config from "../config";
// import { PrismaClient } from "../../generated/prisma/client";
import { PrismaClient } from "../generated/client";

const connectionString = config.app.databaseUrl;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
