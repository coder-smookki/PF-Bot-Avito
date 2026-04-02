const path = require('path');

const root = __dirname;
const envFile = path.join(root, '.env');

const apps = [
  {
    name: 'pfavito-server',
    cwd: path.join(root, 'server'),
    script: 'dist/main.js',
    interpreter: 'node',
    env_file: envFile,
    instances: 1,
    autorestart: true,
    max_restarts: 15,
    min_uptime: '10s',
  },
  {
    name: 'pfavito-client',
    cwd: path.join(root, 'client'),
    script: 'node_modules/next/dist/bin/next',
    args: 'start -H 0.0.0.0',
    env_file: envFile,
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    instances: 1,
    autorestart: true,
    max_restarts: 15,
    min_uptime: '10s',
  },
  {
    name: 'pfavito-admin',
    cwd: path.join(root, 'admin'),
    script: 'node_modules/vite/bin/vite.js',
    args: 'preview --host 0.0.0.0 --port 3002',
    env_file: envFile,
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    max_restarts: 15,
    min_uptime: '10s',
  },
];

module.exports = { apps };
