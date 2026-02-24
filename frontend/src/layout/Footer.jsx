import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} CollectorShop. Collectibles marketplace.
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Catalog
            </Link>
            <Link to="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
