import './globals.css';

export const metadata = {
  title: 'Shamba Guardian',
  description: 'A practical farm plot checker for weather, tree cover, and field tasks.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
