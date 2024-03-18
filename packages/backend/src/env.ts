import fs from 'fs';
import path from 'path';

import { config as dotEnvConfig } from 'dotenv';

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, '../.env');
const isTest = env === 'test';

process.env.NODE_ENV = env;

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${envPath}.${env}.local`,
  `${envPath}.${env}`,
  !isTest && `${envPath}.local`,
  envPath,
].filter(Boolean) as string[];

dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    dotEnvConfig({
      path: dotenvFile,
    });
  }
});
