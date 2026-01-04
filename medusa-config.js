const plugins = [];

module.exports = {
  projectConfig: {
    database_url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/algedi_commerce",
    database_type: "postgres",
    redis_url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  plugins,
};

