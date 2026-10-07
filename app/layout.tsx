import type {Metadata} from 'next';
export const metadata:Metadata={title:'MES — Mamoball European Series',description:'MES — The Future of Mamoball. A platform connecting European Mamoball leagues, clubs and players, and preserving competition history.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="stylesheet" href="/style.css?v=4"/></head><body>{children}</body></html>}
