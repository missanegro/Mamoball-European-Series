import {readFile,readdir} from 'node:fs/promises';
import {database} from '../server/database.mjs';
export async function migrate(){
 const {client}=database();
 try{
 await client.execute('CREATE TABLE IF NOT EXISTS nexus_migrations (name TEXT PRIMARY KEY, applied TEXT NOT NULL)');
 const tx=await client.transaction('write');
 try{
 for(const name of (await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort()){
 if((await tx.execute({sql:'SELECT name FROM nexus_migrations WHERE name=?',args:[name]})).rows.length)continue;
 for(const sql of (await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await tx.execute(sql);
 await tx.execute({sql:'INSERT INTO nexus_migrations VALUES (?,?)',args:[name,new Date().toISOString()]});
 console.log('Applied',name);
 }
 await tx.commit();
 }catch(error){await tx.rollback();throw error}finally{tx.close()}
 }finally{client.close()}
}
if(process.argv[1]?.endsWith('migrate.mjs'))await migrate();
