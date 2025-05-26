module.exports = {
  apps: [
    {
      name: "client",
      script: "node",
      args: "server.js",
      cwd: "apps/client",
      instances: "1",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "api",
      script: "node",
      args: "dist/main.js",
      cwd: "apps/api",
      instances: "1",
      autorestart: true,
      watch: false,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        secret: process.env.SECRET,
	DATABASE_URL: process.env.DATABASE_URL,
      },
    },
  ],
};
