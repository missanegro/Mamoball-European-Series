import type {Metadata} from 'next';
export const metadata:Metadata={title:'MES — Mamoball European Series',description:'MES — The Future of Mamoball. Uma plataforma para ligar as ligas europeias, os clubes e os jogadores e preservar a história das competições.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt"><head><link rel="stylesheet" href="/style.css?v=2"/></head><body>{children}</body></html>}
