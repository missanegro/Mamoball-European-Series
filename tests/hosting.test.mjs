import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './db.mjs';
import {handle,localMode} from '../server/api.mjs';
import {authRoutes,discordSession,hash,encrypt,oauthStatus} from '../server/oauth.mjs';
const origin='http://localhost:3000';
const req=(path='/api/state',options={})=>new Request(origin+path,options);
const env=()=>({DB:database(),NODE_ENV:'development',NEXUS_LOCAL_ADMIN:'true',NEXUS_SITE_URL:origin,OAUTH_ENCRYPTION_KEY:'a'.repeat(64),DISCORD_CLIENT_ID:'123456789012345678',DISCORD_CLIENT_SECRET:'test'});
test('local admin works only on loopback in development; forged hosting headers grant nothing',async()=>{
 const e=env();assert.equal((await (await handle(req(),e)).json()).permissions.admin,true);
 for(const extra of [{NODE_ENV:'production'},{VERCEL:'1'},{NEXUS_LOCAL_ADMIN:'false'}]){
 const res=await handle(req('/api/state',{headers:{'oai-authenticated-user-id':'attacker','oai-authenticated-user-email':'owner@example.com'}}),{...e,...extra});assert.equal((await res.json()).permissions.admin,false);
 }
 assert.equal(localMode(new Request('https://league.example/api/state'),e),false);
});
test('local admin can create a team; cross-site writes denied',async()=>{
 const e=env();const options={method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Nexus-Request':'1'},body:JSON.stringify({op:'team.create',data:{name:'Test Team',tag:'TST',region:'Portugal',color:'#c2f970'}})};
 const r=await handle(req('/api/action',options),e);assert.equal(r.status,200,await r.text());
 assert.equal((await (await handle(req(),e)).json()).teams.length,1);
 assert.equal((await handle(req('/api/action',{...options,headers:{...options.headers,Origin:'https://evil.example'}}),e)).status,403);
});
test('OAuth localhost cookies, callback, state replay and server-side owner permissions',async()=>{
 const e=env();e.NEXUS_LOCAL_ADMIN='false';e.DISCORD_OWNER_ID='222222222222222222';
 const start=await authRoutes(req('/api/auth/discord'),e);const cookie=start.headers.get('set-cookie').split(';')[0];assert.ok(cookie.startsWith('nexus_oauth='));assert.ok(!start.headers.get('set-cookie').includes('Secure'));
 const state=new URL(start.headers.get('location')).searchParams.get('state');
 const provider=async url=>Response.json(url.includes('/token')?{access_token:'secret-access',token_type:'Bearer',expires_in:3600,scope:'identify guilds.members.read'}:{id:e.DISCORD_OWNER_ID,username:'Diogo'});
 const callback=req('/api/auth/discord/callback?code=test&state='+state,{headers:{Cookie:cookie}});
 const done=await authRoutes(callback,e,provider);assert.equal(done.headers.get('location'),'/?auth=discord#profile');
 const session=done.headers.getSetCookie().find(x=>x.startsWith('nexus_session=')).split(';')[0];
 const actor=await discordSession(req('/api/state',{headers:{Cookie:session}}),e);assert.equal(actor.admin,true);
 const row=e.DB.sqlite.prepare('SELECT * FROM web_sessions').get();assert.ok(!row.access_cipher.includes('secret-access'));
 assert.ok((await authRoutes(callback,e,provider)).headers.get('location').includes('invalid_state'));
 assert.equal((await discordSession(req('/api/state',{headers:{Cookie:session}}),{...e,DISCORD_OWNER_ID:'333333333333333333'})).admin,false);
 assert.equal(oauthStatus({...e,NODE_ENV:'production'}).ready,false);
 const secure=await authRoutes(new Request('https://league.example/api/auth/discord'),{...e,NODE_ENV:'production',NEXUS_SITE_URL:'https://league.example'});assert.ok(secure.headers.get('set-cookie').includes('__Host-nexus_oauth='));assert.ok(secure.headers.get('set-cookie').includes('Secure'));
});

test('verified non-admin members cannot create teams or enroll them',async()=>{
 const e=env();e.NEXUS_LOCAL_ADMIN='false';e.DISCORD_GUILD_ID='444444444444444444';e.DISCORD_OWNER_ID='333333333333333333';
 e.DB.sqlite.prepare("INSERT INTO users(id,discord_id,nick,mamo,owner,created) VALUES('member','222222222222222222','Member','',0,'2026')").run();
 const token='b'.repeat(64);e.DB.sqlite.prepare('INSERT INTO web_sessions(hash,user_id,access_cipher,expires,verified_at,verified_guild,roles,created) VALUES(?,?,?,?,?,?,?,?)').run(await hash(token),'member',await encrypt('provider',e),Date.now()+3600000,Date.now(),e.DISCORD_GUILD_ID,'[]','2026');
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({roles:[]});
 try{for(const op of ['team.create','entry.create']){const response=await handle(req('/api/action',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Nexus-Request':'1',Cookie:'nexus_session='+token},body:JSON.stringify({op,data:{}})}),e);assert.equal(response.status,403,await response.text());}assert.equal(e.DB.sqlite.prepare('SELECT count(*) n FROM teams').get().n,0);}finally{globalThis.fetch=original}
});
test('unconfigured production permits only read-only browsing and reports unavailable storage',async()=>{
 const e={NODE_ENV:'production',NEXUS_SITE_URL:'https://mes.example'};
 const r=await handle(req(),e);assert.equal(r.status,200);const state=await r.json();assert.equal(state.config.storageReady,false);assert.equal(state.config.oauth.ready,false);assert.equal(state.permissions.admin,false);assert.deepEqual(state.teams,[]);
 assert.equal((await handle(req('/api/action',{method:'POST'}),e)).status,503);
 assert.equal((await handle(req('/api/health'),e)).status,503);
});
test('login with bot token auto-joins the MES home server, and a blocked join stops login',async()=>{
 const e=env();e.NEXUS_LOCAL_ADMIN='false';e.DISCORD_GUILD_ID='444444444444444444';e.DISCORD_BOT_TOKEN='bot-secret';
 assert.deepEqual(oauthStatus(e).scopes,['identify','guilds.join','guilds.members.read']);
 for(const [joinStatus,expected] of [[201,'/?auth=discord#profile'],[204,'/?auth=discord#profile'],[403,'auth_error=join_blocked']]){
  const start=await authRoutes(req('/api/auth/discord'),e);const cookie=start.headers.get('set-cookie').split(';')[0];const target=new URL(start.headers.get('location'));
  assert.ok(target.searchParams.get('scope').includes('guilds.join'));
  const calls=[];
  const provider=async(url,opts={})=>{calls.push([url,opts.method||'GET',opts.headers?.Authorization]);
   if(url.includes('/token'))return Response.json({access_token:'acc',token_type:'Bearer',expires_in:3600,scope:'identify guilds.join guilds.members.read'});
   if(opts.method==='PUT')return new Response(joinStatus===201?'{}':null,{status:joinStatus});
   if(url.endsWith('/member'))return Response.json({roles:[]});
   return Response.json({id:'555555555555555555',username:'Joiner'})};
  const done=await authRoutes(req('/api/auth/discord/callback?code=c&state='+target.searchParams.get('state'),{headers:{Cookie:cookie}}),e,provider);
  assert.ok(done.headers.get('location').includes(expected),done.headers.get('location'));
  const put=calls.find(c=>c[1]==='PUT');assert.ok(put[0].endsWith('/guilds/444444444444444444/members/555555555555555555'));assert.equal(put[2],'Bot bot-secret');
 }
 assert.deepEqual(oauthStatus({...e,DISCORD_BOT_TOKEN:''}).scopes,['identify','guilds.members.read']);
});
