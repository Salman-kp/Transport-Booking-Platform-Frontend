import './globals.css';
import NavigationWrapper from '@/app/components/layout/NavigationWrapper';

export const metadata = {
  title: 'Tripneo | Digital Concierge Flight Booking',
  description: 'A scalable microservices-based transport booking platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-body antialiased min-h-screen bg-surface text-on-surface selection:bg-secondary-container">
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}
