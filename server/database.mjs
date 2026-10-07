import {createClient} from '@libsql/client';
export function database(env=process.env){
 const url=env.TURSO_DATABASE_URL||'file:nexus.db';
 if((env.VERCEL||env.NODE_ENV==='production')&&url.startsWith('file:'))throw new Error('Production requires a persistent TURSO_DATABASE_URL.');
 const client=createClient({url,authToken:env.TURSO_AUTH_TOKEN||env.TURSO_DATABASE_TURSO_AUTH_TOKEN||env.TURSO_DATABASE_AUTH_TOKEN});
 const convert=r=>({results:r.rows.map(row=>({...row})),meta:{changes:r.rowsAffected,last_row_id:Number(r.lastInsertRowid||0)}});
 function prepare(sql,args=[]){return {sql,args,bind(...values){return prepare(sql,values)},async first(){return (await client.execute({sql,args})).rows[0]||null},async all(){return convert(await client.execute({sql,args}))},async run(){return convert(await client.execute({sql,args}))}}}
 return {client,prepare,async batch(statements){return (await client.batch(statements.map(({sql,args})=>({sql,args})),'write')).map(convert)}};
}
let db;
// Vercel's Turso integration may name the token TURSO_DATABASE_TURSO_AUTH_TOKEN; the production origin falls back to Vercel's system variable.
function siteEnv(){const e={...process.env};if(!e.NEXUS_SITE_URL&&e.VERCEL_PROJECT_PRODUCTION_URL)e.NEXUS_SITE_URL='https://'+e.VERCEL_PROJECT_PRODUCTION_URL;return e}
export function runtime(){if((process.env.VERCEL||process.env.NODE_ENV==='production')&&!process.env.TURSO_DATABASE_URL)return {...siteEnv(),DB:undefined};db ||= database();return {...siteEnv(),DB:db};}
