module.exports = {
  apps: [
    {
      name: 'horus-dashboard-prod',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 8082,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8082,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/pm2-prod-err.log',
      out_file: './logs/pm2-prod-out.log',
      log_file: './logs/pm2-prod-combined.log',
      time: true,
    },
    {
      name: 'horus-dashboard-dev',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development',
        PORT: 8083,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8083,
      },
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', 'logs', '.git'],
      max_memory_restart: '1G',
      error_file: './logs/pm2-dev-err.log',
      out_file: './logs/pm2-dev-out.log',
      log_file: './logs/pm2-dev-combined.log',
      time: true,
    },
  ],
};
