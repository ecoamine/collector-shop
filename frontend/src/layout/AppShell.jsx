import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
