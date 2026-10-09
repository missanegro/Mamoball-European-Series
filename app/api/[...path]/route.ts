import {handle} from '../../../server/api.mjs';
import {runtime as environment} from '../../../server/database.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function route(request:Request){try{return await handle(request,environment())}catch(error){console.error('[v0] API route failure',error);return Response.json({error:'Não foi possível concluir a operação. Tenta novamente.'},{status:500,headers:{'Cache-Control':'no-store'}})}}
export const GET=route;
export const POST=route;
