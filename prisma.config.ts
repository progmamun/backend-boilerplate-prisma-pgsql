import "dotenv/config";
import { defineConfig } from "prisma/config";
import config from "./src/app/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: config.app.backendUrl,
  },
});
