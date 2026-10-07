// On Vercel, apply pending database migrations before building. Elsewhere (PC, GitHub Actions) this does nothing.
// The migration ledger (nexus_migrations) skips files that were already applied, so every deploy is safe to rerun.
if(process.env.VERCEL&&process.env.TURSO_DATABASE_URL){
 const {migrate}=await import('./migrate.mjs');
 await migrate();
 console.log('Database migrations up to date.');
}else console.log('Skipping database migrations (not a Vercel build with TURSO_DATABASE_URL).');
