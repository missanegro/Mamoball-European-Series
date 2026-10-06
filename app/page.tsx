'use client';
import {useEffect} from 'react';
export default function Home(){useEffect(()=>{if(document.getElementById('nexus-script'))return;const vision=document.createElement('script');vision.id='nexus-script';vision.src='/mes-vision.js?v=1';vision.onload=()=>{const script=document.createElement('script');script.src='/app.js?v=4';document.body.appendChild(script)};document.body.appendChild(vision);return()=>{}},[]);return <><div id="app"><div style={{padding:60,color:'#c2f970'}}>A carregar a MES…</div></div><div id="overlay"/><div id="toast" role="status"/></>}
