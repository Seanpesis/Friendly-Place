module.exports = {
    apps: [{
      name: "friendly-place",
      script: "./server.js",
      watch: true,
      env: {
        NODE_ENV: "development",
        PORT: 5000,
        MONGODB_USER: process.env.MONGODB_USER,
        MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
        MONGODB_CLUSTER: process.env.MONGODB_CLUSTER,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      watch_delay: 1000,
      ignore_watch: ["node_modules", "build", ".git"]
    }]
  };