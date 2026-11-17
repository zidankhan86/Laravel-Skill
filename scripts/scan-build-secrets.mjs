import fs from 'node:fs';import path from 'node:path';import dotenv from 'dotenv';
const secrets=fs.existsSync('.env')?dotenv.parse(fs.readFileSync('.env')):{};
const values=['DB_PASSWORD','SESSION_SECRET'].map(k=>secrets[k]).filter(v=>v&&v.length>=8);
function visit(dir){for(const file of fs.readdirSync(dir)){const name=path.join(dir,file);if(fs.statSync(name).isDirectory())visit(name);else{const text=fs.readFileSync(name,'utf8');if(values.some(secret=>text.includes(secret)))throw Error('Server secret found in browser build');}}}
visit('dist');console.log('Browser build contains none of the configured database password or session secret values.');
