import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Intern Skill Assessment',description:'Pre-internship AI Website Development baseline assessment'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
