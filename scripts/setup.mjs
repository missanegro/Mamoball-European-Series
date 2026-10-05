import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!existsSync('.env.local')){
 writeFileSync('.env.local',`NEXUS_SITE_URL=http://localhost:3000\nNEXUS_LOCAL_ADMIN=true\nTURSO_DATABASE_URL=file:nexus.db\nOAUTH_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\nDISCORD_CLIENT_ID=\nDISCORD_CLIENT_SECRET=\nDISCORD_OWNER_ID=\nDISCORD_GUILD_ID=\nDISCORD_ADMIN_ROLE_IDS=\n`,{mode:0o600});
 console.log('Created .env.local with a unique session encryption key.');
}
process.loadEnvFile('.env.local');
const {migrate}=await import('./migrate.mjs');await migrate();
console.log('Ready. Run npm run dev and open http://localhost:3000. Local admin is enabled only in development on loopback.');
