import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './db.mjs';
import {handle} from '../server/api.mjs';

const origin='http://localhost:3000';
const env=()=>({DB:database(),NODE_ENV:'development',NEXUS_LOCAL_ADMIN:'true',NEXUS_SITE_URL:origin,OAUTH_ENCRYPTION_KEY:'a'.repeat(64)});
const call=async(e,op,data)=>{const r=await handle(new Request(origin+'/api/action',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Nexus-Request':'1'},body:JSON.stringify({op,data})}),e);return {status:r.status,body:await r.json()}};
const png='data:image/png;base64,'+Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3]).toString('base64');
async function addPlayer(e,id,nick,mamo){
 const r=await e.DB.prepare('INSERT INTO players (nick,mamo,team_id,position,created) VALUES (?,?,?,?,?)').bind(nick,mamo,null,'Avançado','2026').run();
 await e.DB.prepare('INSERT INTO users (id,discord_id,discord_name,nick,mamo,player_id,owner,created) VALUES (?,?,?,?,?,?,0,?)').bind('u-'+id,String(100000000000000000+id),nick,nick,mamo,r.meta.last_row_id,'2026').run();
 return r.meta.last_row_id;
}
async function competition(e,name,minPlayers=2,maxPlayers=3){
 const r=await call(e,'competition.create',{name,format:'league',mode:'4v4',season:'2026',teams:8,minPlayers,maxPlayers});
 assert.equal(r.status,200,r.body.error);
 return e.DB.prepare('SELECT * FROM competitions WHERE name=?').bind(name).first();
}
async function createTeam(e,name,tag,comp,logo=png){
 const r=await call(e,'team.create',{name,tag,color:'#c2f970',secondaryColor:'#1b241b',competition:String(comp.id),logo});
 assert.equal(r.status,200,r.body.error);
 return e.DB.prepare('SELECT * FROM teams WHERE name=?').bind(name).first();
}

test('team registration persists logo, requires 3-letter abbreviation, and enforces open registration',async()=>{
 const e=env(),c=await competition(e,'MES Cup');
 let r=await call(e,'team.create',{name:'Invalid Tag Team',tag:'AB',color:'#c2f970',secondaryColor:'#1b241b',competition:String(c.id),logo:png});
 assert.equal(r.status,400);
 r=await call(e,'team.create',{name:'Missing Logo Team',tag:'MLT',color:'#c2f970',secondaryColor:'#1b241b',competition:String(c.id)});
 assert.equal(r.status,400);
 const t=await createTeam(e,'Persistent Logo FC','PLF',c);
 assert.equal(t.logo_mime,'image/png');
 const image=await handle(new Request(origin+'/api/team-media/'+t.id),e);
 assert.equal(image.status,200);
 assert.equal(image.headers.get('content-type'),'image/png');
 const closed=await call(e,'competition.create',{name:'Closed Cup',format:'league',mode:'4v4',season:'2026',teams:8,minPlayers:1,maxPlayers:5});
 assert.equal(closed.status,200);
 await e.DB.prepare("UPDATE competitions SET status='active' WHERE name='Closed Cup'").run();
 const closedComp=await e.DB.prepare("SELECT * FROM competitions WHERE name='Closed Cup'").first();
 r=await call(e,'team.create',{name:'Closed Entry FC',tag:'CEF',color:'#c2f970',secondaryColor:'#1b241b',competition:String(closedComp.id),logo:png});
 assert.equal(r.status,200,'administrator can create/register outside the open phase');
});

test('team editing and competition-specific invitations enforce maximum roster and allow players across teams',async()=>{
 const e=env(),c1=await competition(e,'Roster League A',2,3),c2=await competition(e,'Roster League B',1,2);
 const t1=await createTeam(e,'Roster Team A','RTA',c1),t2=await createTeam(e,'Roster Team B','RTB',c2);
 const p1=await addPlayer(e,1,'Player One','ply001'),p2=await addPlayer(e,2,'Player Two','ply002'),p3=await addPlayer(e,3,'Player Three','ply003'),p4=await addPlayer(e,4,'Player Four','ply004');
 let r=await call(e,'team.update',{id:t1.id,name:'Roster Team A Updated',tag:'RUA',color:'#123456',secondaryColor:'#abcdef'});
 assert.equal(r.status,200,r.body.error);
 const updated=await e.DB.prepare('SELECT * FROM teams WHERE id=?').bind(t1.id).first();
 assert.equal(updated.name,'Roster Team A Updated');
 assert.equal(updated.tag,'RUA');
 for(const player of [p1,p2]){
  r=await call(e,'team.invite',{team:t1.id,competition:c1.id,player});
  assert.equal(r.status,200,r.body.error);
  const invite=await e.DB.prepare("SELECT * FROM team_invites WHERE team_id=? AND competition_id=? AND player_id=?").bind(t1.id,c1.id,player).first();
  r=await call(e,'team.invite.respond',{id:invite.id,status:'Aceite'});
  assert.equal(r.status,200,r.body.error);
 }
 r=await call(e,'team.invite',{team:t1.id,competition:c1.id,player:p3});
 assert.equal(r.status,200,r.body.error);
 r=await call(e,'team.invite',{team:t1.id,competition:c1.id,player:p4});
 assert.equal(r.status,409,'active players plus pending invitations cannot exceed maximum');
 const invite3=await e.DB.prepare("SELECT * FROM team_invites WHERE team_id=? AND competition_id=? AND player_id=?").bind(t1.id,c1.id,p3).first();
 r=await call(e,'team.invite.respond',{id:invite3.id,status:'Aceite'});
 assert.equal(r.status,200,r.body.error);
 r=await call(e,'team.invite',{team:t2.id,competition:c2.id,player:p1});
 assert.equal(r.status,200,r.body.error,'same player can be invited to a different team in another competition');
 const rows=await e.DB.prepare('SELECT team_id,competition_id FROM player_teams WHERE player_id=? ORDER BY competition_id').bind(p1).all();
 assert.equal(rows.results.length,2);
 assert.deepEqual(rows.results.map(x=>x.team_id).sort((a,b)=>a-b),[t1.id,t2.id].sort((a,b)=>a-b));
 const s=await (await handle(new Request(origin+'/api/state'),e)).json();
 assert.ok(s.teamRosters.some(x=>x.team_id===t1.id&&x.competition_id===c1.id&&x.player_id===p1));
 assert.ok(s.teamInvites.some(x=>x.team_id===t1.id&&x.competition_id===c1.id&&x.status==='Aceite'));
});

test('team roster minimum is checked before starting a competition',async()=>{
 const e=env(),c=await competition(e,'Minimum Roster Cup',2,4),t=await createTeam(e,'Minimum FC','MIN',c);
 let r=await call(e,'competition.start',{id:c.id});
 assert.equal(r.status,400);
 assert.match(r.body.error,/pelo menos 2 jogadores/i);
 const p=await addPlayer(e,10,'Minimum Player','min010');
 r=await call(e,'team.invite',{team:t.id,competition:c.id,player:p});
 assert.equal(r.status,200,r.body.error);
 const inv=await e.DB.prepare("SELECT * FROM team_invites WHERE team_id=? AND player_id=?").bind(t.id,p).first();
 await call(e,'team.invite.respond',{id:inv.id,status:'Aceite'});
 const p2=await addPlayer(e,11,'Minimum Player Two','min011');
 r=await call(e,'team.invite',{team:t.id,competition:c.id,player:p2});
 assert.equal(r.status,200,r.body.error);
 const inv2=await e.DB.prepare("SELECT * FROM team_invites WHERE team_id=? AND player_id=?").bind(t.id,p2).first();
 await call(e,'team.invite.respond',{id:inv2.id,status:'Aceite'});
 r=await call(e,'competition.start',{id:c.id});
 assert.equal(r.status,200,r.body.error);
});

test('a player with no nation can set it even if stale cooldown metadata exists',async()=>{
 const e=env();
 await e.DB.prepare("UPDATE users SET ingame_flag='',flag_set_at=? WHERE id='local-admin'").bind(new Date(Date.now()+7*24*3600*1000).toISOString()).run();
 const r=await call(e,'flag.request',{flag:'PT'});
 assert.equal(r.status,200,r.body.error);
 const u=await e.DB.prepare("SELECT ingame_flag FROM users WHERE id='local-admin'").first();
 assert.equal(u.ingame_flag,'PT');
});
