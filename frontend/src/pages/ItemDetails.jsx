import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/apiClient.js';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await api.get(`/api/items/${id}`);
        if (!cancelled) setItem(response.data);
      } catch {
        if (!cancelled) setError('Failed to load item');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 rounded-2xl bg-surface-600/60" />
          <div className="aspect-video rounded-2xl bg-surface-600/60" />
          <div className="h-8 w-3/4 rounded-2xl bg-surface-600/60" />
          <div className="h-4 w-full rounded-2xl bg-surface-600/60" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-danger font-medium mb-4">{error || 'Item not found.'}</p>
        <Link to="/">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to catalog
      </Link>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-square md:aspect-auto md:min-h-[320px] bg-surface-600/60 flex items-center justify-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500">No image</span>
            )}
          </div>
          <div className="p-6 md:p-8 flex flex-col">
            {item.category && (
              <Badge variant="primary" className="w-fit mb-3">
                {item.category.name}
              </Badge>
            )}
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-2">
              {item.title}
            </h1>
            <p
              className="text-2xl font-semibold text-primary mb-6"
              data-testid="item-price"
            >
              ${Number(item.price).toFixed(2)}
            </p>
            {item.description && (
              <p className="text-gray-400 mb-6 flex-1 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
            {item.sellerId && (
              <p className="text-sm text-gray-500 mb-4">
                Seller ID: {item.sellerId}
              </p>
            )}
            <div className="pt-4 border-t border-white/10">
              <Link to="/">
                <Button variant="primary" className="w-full sm:w-auto">
                  Back to catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
