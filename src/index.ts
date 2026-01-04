import express from "express";
import { Medusa } from "@medusajs/medusa";

const PORT = process.env.PORT || 9000;

async function bootstrap() {
  const app = express();
  const medusa = await Medusa({
    projectConfig: {
      database_url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/algedi_commerce",
      database_type: "postgres",
      redis_url: process.env.REDIS_URL || "redis://localhost:6379",
    },
  });

  app.use("/", medusa);

  app.listen(PORT, () => {
    console.log(`Commerce Core API running on port ${PORT}`);
  });
}

bootstrap();

