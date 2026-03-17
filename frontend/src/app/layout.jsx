import './globals.css';
import Navbar from './components/layout/Navbar';
import { Montserrat } from 'next/font/google';

export const metadata = {
  title: 'TRIPneO | Book Bus, Train, Flight & Taxi',
  description: 'A scalable microservices-based transport booking platform.',
};

const montserrat = Montserrat({ 
  weight: ['300', '400', '600','700', '900'],
  subsets: ['latin'],
  variable: '--font-montserrat'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={montserrat.variable}>
      <body className="font-['Montserrat'] antialiased min-h-screen">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}