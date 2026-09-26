// @ts-ignore — the stylesheet is bundled by Next.js at runtime.
import "./globals.css";
import { Toaster } from "react-hot-toast";
export const metadata={title:"Mohonto Dental Care",description:"Dental clinic management system"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Toaster position="top-right" toastOptions={{duration:3500}}/></body></html>}
