import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/apiClient.js';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          api.get('/api/items'),
          api.get('/api/categories').catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          setItems(itemsRes.data || []);
          setCategories(categoriesRes.data || []);
        }
      } catch {
        if (!cancelled) setError('Failed to load items');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const filteredItems = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      list = list.filter(
        (i) => i.category && (i.category.id === selectedCategory || i.category.name === selectedCategory)
      );
    }
    return list;
  }, [items, search, selectedCategory]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-10 w-64 rounded-2xl bg-surface-600/60 animate-pulse mb-4" />
          <div className="h-12 w-full max-w-xl rounded-2xl bg-surface-600/60 animate-pulse" />
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          data-testid="catalog-list"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" data-testid="catalog-list">
        <p className="text-danger font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero + search */}
      <div className="mb-10">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">
          Collectibles <span className="text-primary">Marketplace</span>
        </h1>
        <p className="text-gray-400 mb-6 max-w-xl">
          Discover and collect unique items from our community.
        </p>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="search"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/10 bg-surface-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            aria-label="Search catalog"
          />
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-700/60 text-gray-400 border border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'bg-surface-700/60 text-gray-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-12 text-center"
          data-testid="catalog-list"
        >
          <p className="text-gray-400">
            {items.length === 0 ? 'No items available yet.' : 'No items match your filters.'}
          </p>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 list-none p-0 m-0"
          data-testid="catalog-list"
        >
          {filteredItems.map((item) => (
            <li key={item.id}>
              <Link to={`/items/${item.id}`} className="block h-full">
                <Card hover className="h-full flex flex-col" data-testid="item-card">
                  <div className="aspect-[4/3] bg-surface-600/60 relative overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        No image
                      </div>
                    )}
                    {item.category && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="primary">{item.category.name}</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h2
                      className="font-semibold text-white mb-1 line-clamp-2"
                      data-testid="item-title"
                    >
                      {item.title}
                    </h2>
                    <p
                      className="text-primary font-semibold mt-auto"
                      data-testid="item-price"
                    >
                      ${Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
