import {handle} from '../../../server/api.mjs';
import {runtime as environment} from '../../../server/database.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function route(request:Request){try{return await handle(request,environment())}catch(error){console.error('Database configuration error');return Response.json({error:'Database not configured. Follow SETUP.md.'},{status:503})}}
export const GET=route;
export const POST=route;
