import {createClient} from '@libsql/client';
export function database(env=process.env){
 const url=env.TURSO_DATABASE_URL||'file:nexus.db';
 if((env.VERCEL||env.NODE_ENV==='production')&&url.startsWith('file:'))throw new Error('Production requires a persistent TURSO_DATABASE_URL.');
 const client=createClient({url,authToken:env.TURSO_AUTH_TOKEN});
 const convert=r=>({results:r.rows.map(row=>({...row})),meta:{changes:r.rowsAffected,last_row_id:Number(r.lastInsertRowid||0)}});
 function prepare(sql,args=[]){return {sql,args,bind(...values){return prepare(sql,values)},async first(){return (await client.execute({sql,args})).rows[0]||null},async all(){return convert(await client.execute({sql,args}))},async run(){return convert(await client.execute({sql,args}))}}}
 return {client,prepare,async batch(statements){return (await client.batch(statements.map(({sql,args})=>({sql,args})),'write')).map(convert)}};
}
let db;
export function runtime(){if((process.env.VERCEL||process.env.NODE_ENV==='production')&&!process.env.TURSO_DATABASE_URL)return {...process.env,DB:undefined};db ||= database();return {...process.env,DB:db};}
