const SESSION='__Host-nexus_session';
const FLOW='__Host-nexus_oauth';
const API='https://discord.com/api/v10';
const encoder=new TextEncoder();
export class AuthError extends Error{constructor(code,status=401){super(code);this.status=status;this.code=code}}
const first=(db,sql,...params)=>db.prepare(sql).bind(...params).first();
const run=(db,sql,...params)=>db.prepare(sql).bind(...params).run();
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join('');
export const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('');
export function readCookie(req,name){const values=(req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));return values.length===1?values[0].slice(name.length+1):null}
const local=env=>env.NODE_ENV==='development'&&!env.VERCEL&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.NEXUS_SITE_URL||'');
const cookie=(name,value,age,env)=>`${local(env)?name.replace('__Host-',''):name}=${value}; Path=/; HttpOnly; ${local(env)?'':'Secure; '}SameSite=Lax; Max-Age=${age}`;
const sessionCookie=(req,name,env)=>readCookie(req,local(env)?name.replace('__Host-',''):name);
const configFields=['DISCORD_CLIENT_ID','DISCORD_CLIENT_SECRET','OAUTH_ENCRYPTION_KEY','NEXUS_SITE_URL'];
export function oauthStatus(env){const missing=configFields.filter(k=>!env[k]);if(env.DISCORD_CLIENT_ID&&!/^\d{16,22}$/.test(env.DISCORD_CLIENT_ID))missing.push('DISCORD_CLIENT_ID_INVALID');if(env.OAUTH_ENCRYPTION_KEY&&!/^[a-f0-9]{64}$/i.test(env.OAUTH_ENCRYPTION_KEY))missing.push('OAUTH_ENCRYPTION_KEY_INVALID');let origin;try{const u=new URL(env.NEXUS_SITE_URL);if(u.protocol!=='https:'&&!local(env))throw new Error();origin=u.origin}catch{if(!missing.includes('NEXUS_SITE_URL'))missing.push('NEXUS_SITE_URL_INVALID')}return {ready:missing.length===0,missing,redirectUri:origin?origin+'/api/auth/discord/callback':null,guildConfigured:Boolean(env.DISCORD_GUILD_ID),autoJoin:autoJoin(env),scopes:autoJoin(env)?['identify','guilds.join','guilds.members.read']:['identify','guilds.members.read']}}
// Auto-join the MES home server: needs the bot token (bot already in the server with Create Invite permission) and the server ID.
export const autoJoin=env=>Boolean(env.DISCORD_BOT_TOKEN&&/^\d{16,22}$/.test(env.DISCORD_GUILD_ID||''));
async function joinHomeServer(env,discordId,access,fetcher){if(!autoJoin(env))return;let res;try{res=await fetcher(`${API}/guilds/${env.DISCORD_GUILD_ID}/members/${discordId}`,{method:'PUT',headers:{Authorization:'Bot '+env.DISCORD_BOT_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({access_token:access}),signal:AbortSignal.timeout(12000),redirect:'error'})}catch{throw new AuthError('discord_unavailable',503)}if(res.status===201||res.status===204)return;if(res.status===403)throw new AuthError('join_blocked',403);throw new AuthError('join_failed',503)}
async function key(env){if(!/^[a-f0-9]{64}$/i.test(env.OAUTH_ENCRYPTION_KEY||''))throw new AuthError('not_configured',503);return crypto.subtle.importKey('raw',Uint8Array.from(env.OAUTH_ENCRYPTION_KEY.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function encrypt(value,env){const iv=crypto.getRandomValues(new Uint8Array(12));const result=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),encoder.encode(value)));return [...iv,...result].map(n=>n.toString(16).padStart(2,'0')).join('')}
export async function decrypt(value,env){const bytes=Uint8Array.from(value.match(/../g)||[],x=>parseInt(x,16));try{return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},await key(env),bytes.slice(12)))}catch{throw new AuthError('session_expired')}}
function redirect(location,cookies=[]){const headers=new Headers({Location:location,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});cookies.forEach(c=>headers.append('Set-Cookie',c));return new Response(null,{status:303,headers})}
async function discord(path,token,fetcher){let res;try{res=await fetcher(API+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000),redirect:'error'})}catch{throw new AuthError('discord_unavailable',503)}if(res.status===401)throw new AuthError('session_expired');if(res.status===404||res.status===403)throw new AuthError('not_member',403);if(!res.ok)throw new AuthError('discord_unavailable',503);return res.json()}
async function guildMember(env,access,fetcher){if(!env.DISCORD_GUILD_ID)return {roles:[],member:false};if(!/^\d{16,22}$/.test(env.DISCORD_GUILD_ID))throw new AuthError('not_configured',503);const m=await discord(`/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,access,fetcher);if(m.pending)throw new AuthError('membership_pending',403);return {roles:Array.isArray(m.roles)?m.roles.filter(x=>/^\d{16,22}$/.test(x)):[],member:true}}
async function throttle(env,key){const bucket=Math.floor(Date.now()/60000),id='oauth:'+key+':'+bucket;const r=await first(env.DB,'INSERT INTO rates (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count',id,Math.floor(Date.now()/1000)+120);if(r.count>20)throw new AuthError('too_many_attempts',429)}
export async function authRoutes(req,env,fetcher=fetch){const url=new URL(req.url),path=url.pathname;if(!path.startsWith('/api/auth/'))return null;const status=oauthStatus(env);
 if(path==='/api/auth/status'&&req.method==='GET')return Response.json(status,{headers:{'Cache-Control':'no-store'}});
 if(path==='/api/auth/logout'&&req.method==='POST'){if(req.headers.get('Origin')!==url.origin||req.headers.get('X-Nexus-Request')!=='1')return Response.json({error:'Origem inválida.'},{status:403});const session=sessionCookie(req,SESSION,env);if(session)await run(env.DB,'DELETE FROM web_sessions WHERE hash=?',await hash(session));const flow=sessionCookie(req,FLOW,env);if(flow)await run(env.DB,'DELETE FROM oauth_flows WHERE hash=?',await hash(flow));const headers=new Headers({'Cache-Control':'no-store'});headers.append('Set-Cookie',cookie(SESSION,'',0,env));headers.append('Set-Cookie',cookie(FLOW,'',0,env));return Response.json({message:'Sessão Discord terminada.'},{headers})}
 if(req.method!=='GET'||!['/api/auth/discord','/api/auth/discord/callback'].includes(path))return Response.json({error:'Rota não encontrada.'},{status:404});
 try{
  if(!status.ready)throw new AuthError('not_configured',503);
  if(url.origin!==new URL(status.redirectUri).origin)throw new AuthError('invalid_origin',400);
  if(path==='/api/auth/discord'){
   // No state-changing cross-site subresource request can initiate or bind an account.
   if(req.headers.get('Sec-Fetch-Site')==='cross-site')throw new AuthError('invalid_origin',403);
   const siteId=null;await throttle(env,siteId||req.headers.get('CF-Connecting-IP')||'anonymous');
   const user=siteId?await first(env.DB,'SELECT * FROM users WHERE site_id=?',siteId):null;
   const value=random(),hashed=await hash(value),old=sessionCookie(req,FLOW,env);
   const statements=[env.DB.prepare('DELETE FROM oauth_flows WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM web_sessions WHERE expires<?').bind(Date.now())];
   if(old)statements.push(env.DB.prepare('DELETE FROM oauth_flows WHERE hash=?').bind(await hash(old)));
   statements.push(env.DB.prepare('INSERT INTO oauth_flows (hash,site_id,user_id,expires) VALUES (?,?,?,?)').bind(hashed,siteId,user?.id||null,Date.now()+600000));await env.DB.batch(statements);
   const target=new URL('https://discord.com/oauth2/authorize');target.search=new URLSearchParams({client_id:env.DISCORD_CLIENT_ID,response_type:'code',redirect_uri:status.redirectUri,scope:status.scopes.join(' '),state:value,prompt:'consent'}).toString();return redirect(target.toString(),[cookie(FLOW,value,600,env)]);
  }
  const state=url.searchParams.get('state'),stored=sessionCookie(req,FLOW,env);if(!state||!stored||!/^\w{64}$/.test(state)||state!==stored)throw new AuthError('invalid_state',400);
  const flow=await first(env.DB,'DELETE FROM oauth_flows WHERE hash=? AND expires>? RETURNING *',await hash(state),Date.now());if(!flow)throw new AuthError('invalid_state',400);
  if(flow.site_id&&flow.site_id!==req.headers.get('oai-authenticated-user-id'))throw new AuthError('account_changed',403);
  if(url.searchParams.has('error'))throw new AuthError('cancelled',400);
  const code=url.searchParams.get('code');if(!code||code.length>2048)throw new AuthError('invalid_code',400);
  let res;try{res=await fetcher('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.DISCORD_CLIENT_ID,client_secret:env.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code,redirect_uri:status.redirectUri}),signal:AbortSignal.timeout(12000),redirect:'error'})}catch{throw new AuthError('discord_unavailable',503)}
  if(!res.ok)throw new AuthError('token_exchange_failed',400);const tokens=await res.json();const scopes=String(tokens.scope||'').split(' ');if(!tokens.access_token||tokens.token_type?.toLowerCase()!=='bearer'||!status.scopes.every(s=>scopes.includes(s)))throw new AuthError('missing_scope',403);
  const discordUser=await discord('/users/@me',tokens.access_token,fetcher);if(!/^\d{16,22}$/.test(discordUser.id)||discordUser.bot)throw new AuthError('invalid_user',403);
  await joinHomeServer(env,discordUser.id,tokens.access_token,fetcher);
  const membership=await guildMember(env,tokens.access_token,fetcher);
  let user=await first(env.DB,'SELECT * FROM users WHERE discord_id=?',discordUser.id);
  const siteUser=flow.user_id?await first(env.DB,'SELECT * FROM users WHERE id=? AND site_id=?',flow.user_id,flow.site_id):null;
  // Never merge competing accounts or move owner permissions based on matching names/emails.
  if(siteUser){if((siteUser.discord_id&&siteUser.discord_id!==discordUser.id)||(user&&user.id!==siteUser.id))throw new AuthError('account_conflict',409);user=siteUser}
  const username=String(discordUser.username||discordUser.global_name||'Discord').slice(0,80),nick=String(discordUser.global_name||discordUser.username||'Jogador').slice(0,24);
  if(!user){await run(env.DB,'INSERT OR IGNORE INTO users (id,discord_id,discord_name,nick,mamo,owner,created) VALUES (?,?,?,?,?,0,?)',crypto.randomUUID(),discordUser.id,username,nick,'',new Date().toISOString());user=await first(env.DB,'SELECT * FROM users WHERE discord_id=?',discordUser.id)}
  const hashOk=h=>typeof h==='string'&&/^(a_)?[a-f0-9]{32}$/.test(h)?h:null;
  const updated=await run(env.DB,"UPDATE users SET discord_id=?,discord_name=?,nick=CASE WHEN nick='' THEN ? ELSE nick END,discord_avatar=?,discord_banner=? WHERE id=? AND (discord_id IS NULL OR discord_id=?)",discordUser.id,username,nick,hashOk(discordUser.avatar),hashOk(discordUser.banner),user.id,discordUser.id);if(!updated.meta.changes)throw new AuthError('account_conflict',409);
  const seconds=Math.min(7*86400,Math.floor(Number(tokens.expires_in)));if(!Number.isFinite(seconds)||seconds<60)throw new AuthError('token_exchange_failed',400);
  const session=random(),expires=Date.now()+seconds*1000,old=sessionCookie(req,SESSION,env);const qs=[];if(old)qs.push(env.DB.prepare('DELETE FROM web_sessions WHERE hash=?').bind(await hash(old)));
  qs.push(env.DB.prepare('INSERT INTO web_sessions (hash,user_id,access_cipher,expires,verified_at,verified_guild,roles,created) VALUES (?,?,?,?,?,?,?,?)').bind(await hash(session),user.id,await encrypt(tokens.access_token,env),expires,Date.now(),env.DISCORD_GUILD_ID||'',JSON.stringify(membership.roles),new Date().toISOString()));await env.DB.batch(qs);
  return redirect('/?auth=discord#profile',[cookie(FLOW,'',0,env),cookie(SESSION,session,seconds,env)]);
 }catch(error){const code=error instanceof AuthError?error.code:'login_failed';return redirect('/?auth_error='+encodeURIComponent(code)+'#login',[cookie(FLOW,'',0,env)])}
}
export async function discordSession(req,env,fetcher=fetch){const value=sessionCookie(req,SESSION,env);if(!value)return null;if(!/^[a-f0-9]{64}$/.test(value))throw new AuthError('session_expired');const session=await first(env.DB,'SELECT * FROM web_sessions WHERE hash=? AND expires>?',await hash(value),Date.now());if(!session)throw new AuthError('session_expired');const user=await first(env.DB,'SELECT * FROM users WHERE id=?',session.user_id);if(!user?.discord_id)throw new AuthError('session_expired');let roles=JSON.parse(session.roles),verified=Boolean(env.DISCORD_GUILD_ID);
 if(req.method!=='GET'||session.verified_at<Date.now()-300000||session.verified_guild!==(env.DISCORD_GUILD_ID||'')){
  try{const result=await guildMember(env,await decrypt(session.access_cipher,env),fetcher);roles=result.roles;verified=result.member;await run(env.DB,'UPDATE web_sessions SET roles=?,verified_at=?,verified_guild=? WHERE hash=?',JSON.stringify(roles),Date.now(),env.DISCORD_GUILD_ID||'',session.hash)}catch(e){if(e instanceof AuthError&&['session_expired','not_member','membership_pending'].includes(e.code))await run(env.DB,'DELETE FROM web_sessions WHERE hash=?',session.hash);throw e}
 }
 const configuredRoles=(env.DISCORD_ADMIN_ROLE_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 return {user,admin:Boolean(env.DISCORD_OWNER_ID&&user.discord_id===env.DISCORD_OWNER_ID)||(verified&&roles.some(r=>configuredRoles.includes(r))),verifiedMember:verified,source:'website',authMethod:'discord',sessionExpires:session.expires};
}
