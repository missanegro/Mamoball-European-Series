import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function database(){
 const sqlite=new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
 for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8'));
 function prepare(sql){
  let args=[];
  return {
   bind(...a){args=a;return this},
   async first(){return sqlite.prepare(sql).get(...args)||null},
   async all(){return {results:sqlite.prepare(sql).all(...args)}},
   async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}
  };
 }
 return {sqlite,prepare,async batch(qs){sqlite.exec('BEGIN');try{const result=[];for(const q of qs)result.push(await q.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
}
