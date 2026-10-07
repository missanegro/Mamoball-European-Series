import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './db.mjs';
import {handle,ID_COOLDOWN} from '../server/api.mjs';
import {hash,encrypt} from '../server/oauth.mjs';
const origin='http://localhost:3000';
const base=()=>({DB:database(),NODE_ENV:'development',NEXUS_LOCAL_ADMIN:'true',NEXUS_SITE_URL:origin,OAUTH_ENCRYPTION_KEY:'a'.repeat(64),DISCORD_CLIENT_ID:'123456789012345678',DISCORD_CLIENT_SECRET:'test'});
async function member(e,id='member',discord='222222222222222222'){
 e.DB.sqlite.prepare("INSERT INTO users(id,discord_id,nick,mamo,owner,created) VALUES(?,?,?,'',0,'2026')").run(id,discord,'Nick'+id);
 const token=(id==='member'?'b':'c').repeat(64);
 e.DB.sqlite.prepare('INSERT INTO web_sessions(hash,user_id,access_cipher,expires,verified_at,verified_guild,roles,created) VALUES(?,?,?,?,?,?,?,?)').run(await hash(token),id,await encrypt('x',e),Date.now()+3600000,Date.now(),'','[]','2026');
 return token;
}
const call=async(e,op,data,token)=>{const headers={Origin:origin,'Content-Type':'application/json','X-Nexus-Request':'1'};if(token)headers.Cookie='nexus_session='+token;const r=await handle(new Request(origin+'/api/action',{method:'POST',headers,body:JSON.stringify({op,data})}),token?{...e,NEXUS_LOCAL_ADMIN:'false'}:e);return {status:r.status,body:await r.json()}};
const state=async(e,token)=>(await handle(new Request(origin+'/api/state',{headers:token?{Cookie:'nexus_session='+token}:{}}),token?{...e,NEXUS_LOCAL_ADMIN:'false'}:e)).json();

test('Mamoball ID: 6 characters, set once, then 24h-limited change requests approved by admins',async()=>{
 const e=base(),t=await member(e),t2=await member(e,'other','333333333333333333');
 for(const bad of ['ABC12','ABC1234','AB-123','']) assert.equal((await call(e,'mamo.set',{mamo:bad},t)).status,400,bad);
 assert.equal((await call(e,'mamo.set',{mamo:'A1b2C3'},t)).status,200);
 assert.equal((await call(e,'mamo.set',{mamo:'ZZZ999'},t)).status,409,'cannot overwrite directly');
 assert.equal((await call(e,'mamo.set',{mamo:'a1B2c3'},t2)).status,409,'unique, case-insensitive');
 let me=(await state(e,t)).profile;assert.equal(me.mamo,'A1b2C3');assert.ok(Date.parse(me.nextIdChange)-Date.now()>ID_COOLDOWN-60000);
 const early=await call(e,'mamo.request',{mamo:'NEW001'},t);assert.equal(early.status,429);assert.match(early.body.error,/24h|23h/);
 e.DB.sqlite.prepare("UPDATE users SET mamo_set_at=? WHERE id='member'").run(new Date(Date.now()-ID_COOLDOWN-1000).toISOString());
 assert.equal((await call(e,'mamo.request',{mamo:'A1B2C3'},t)).status,400,'same ID');
 assert.equal((await call(e,'mamo.request',{mamo:'NEW001'},t)).status,200);
 assert.equal((await call(e,'mamo.request',{mamo:'NEW002'},t)).status,409,'one pending at a time');
 me=(await state(e,t)).profile;assert.equal(me.idRequests[0].status,'Pendente');assert.equal(me.idRequests[0].new_mamo,'NEW001');
 assert.equal((await call(e,'mamo.review',{id:1,status:'Aprovado'},t)).status,403,'players cannot approve');
 const admin=await state(e);assert.equal(admin.idRequests.length,1);
 assert.equal((await call(e,'mamo.review',{id:1,status:'Aprovado'})).status,200);
 assert.equal((await state(e,t)).profile.mamo,'NEW001');
 assert.equal((await call(e,'mamo.review',{id:1,status:'Recusado'})).status,400,'already handled');
 e.DB.sqlite.prepare("UPDATE id_requests SET status='Recusado'").run();
 assert.equal((await call(e,'mamo.request',{mamo:'NEW003'},t)).status,429,'24h after the last request too');
});

test('profile images: validated upload, public versioned URL, style choices, owner and admin removal',async()=>{
 const e=base(),t=await member(e);
 const png='data:image/png;base64,'+Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3]).toString('base64');
 assert.equal((await call(e,'media.upload',{kind:'avatar',image:'data:image/svg+xml;base64,PHN2Zz4='},t)).status,400,'svg rejected');
 assert.equal((await call(e,'media.upload',{kind:'avatar',image:'data:image/png;base64,'+Buffer.from('GIF89a').toString('base64')},t)).status,400,'magic bytes checked');
 assert.equal((await call(e,'profile.style',{avatar:'upload',banner:'preset',preset:'violet'},t)).status,400,'needs an upload first');
 assert.equal((await call(e,'media.upload',{kind:'avatar',image:png},t)).status,200);
 const big='data:image/png;base64,'+Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47]),Buffer.alloc(300000)]).toString('base64');
 assert.equal((await call(e,'media.upload',{kind:'avatar',image:big},t)).status,413);
 let me=(await state(e,t)).profile;assert.match(me.avatar,/^\/api\/media\/member\/avatar\?v=1$/);
 const img=await handle(new Request(origin+'/api/media/member/avatar'),e);assert.equal(img.status,200);assert.equal(img.headers.get('content-type'),'image/png');assert.match(img.headers.get('cache-control'),/immutable/);
 assert.equal((await handle(new Request(origin+'/api/media/member/banner'),e)).status,404);
 assert.equal((await call(e,'profile.style',{avatar:'initials',banner:'preset',preset:'violet'},t)).status,200);
 me=(await state(e,t)).profile;assert.equal(me.avatar,null);assert.deepEqual(me.banner,{preset:'violet'});
 assert.equal((await call(e,'profile.style',{avatar:'initials',banner:'preset',preset:'rainbow'},t)).status,400);
 const t2=await member(e,'other','333333333333333333');
 assert.equal((await call(e,'media.remove',{kind:'avatar',user:'member'},t2)).status,403,'players cannot remove others');
 assert.equal((await call(e,'media.remove',{kind:'avatar',user:'member'})).status,200,'admin moderation');
 assert.equal((await handle(new Request(origin+'/api/media/member/avatar'),e)).status,404);
});
