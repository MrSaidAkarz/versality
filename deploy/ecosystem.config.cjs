module.exports = {
  apps: [
    {
      name: "versality-api",
      script: "./artifacts/api-server/dist/index.mjs",
      cwd: "/opt/versality",
      interpreter: "node",
      env_production: {
        NODE_ENV: "production",
        PORT: "4000",
      },
    },
  ],
};
