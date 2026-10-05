'use client';
import {useEffect} from 'react';
export default function Home(){useEffect(()=>{if(document.getElementById('nexus-script'))return;const script=document.createElement('script');script.id='nexus-script';script.src='/app.js?v=2';document.body.appendChild(script);return()=>{}},[]);return <><div id="app"><div style={{padding:60,color:'#c2f970'}}>A carregar a liga…</div></div><div id="overlay"/><div id="toast" role="status"/></>}
