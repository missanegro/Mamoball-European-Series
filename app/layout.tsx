import type {Metadata} from 'next';
export const metadata:Metadata={title:'NEXUS — Mamoball League',description:'A tua liga Mamoball. Competições, equipas, jogadores e Discord ligados.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt"><head><link rel="stylesheet" href="/style.css?v=2"/></head><body>{children}</body></html>}
