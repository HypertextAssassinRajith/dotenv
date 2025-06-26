const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, '..', '.env_store');

if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir);

async function saveEnvFile(project, content) {
  const filePath = path.join(storeDir, `${project}.env`);
  fs.writeFileSync(filePath, content);
}

async function getEnvFile(project) {
  const filePath = path.join(storeDir, `${project}.env`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

module.exports = { saveEnvFile, getEnvFile };
