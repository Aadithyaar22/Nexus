import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexus — AI Thinking Workspace',
  description:
    'An AI system that reads, connects, analyzes, and evolves knowledge across multiple documents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161a',
              color: '#fafafa',
              border: '1px solid #27272a',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0a0b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0b' } },
          }}
        />
      </body>
    </html>
  );
}
