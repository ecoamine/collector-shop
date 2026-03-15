import { useEffect, useState } from 'react';
import api from '../services/apiClient.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function SellerCreate() {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/api/categories').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/seller/items', {
        title,
        description,
        price: Number(price),
        imageUrl: imageUrl || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
      });
      toast.success('Item created');
      setTitle('');
      setPrice('');
      setCategoryId('');
      setDescription('');
      setImageUrl('');
    } catch {
      toast.error('Failed to create item');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl text-white mb-2">
        Create listing
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Add a new collectible to the marketplace.
      </p>

      <Card>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} data-testid="seller-create-form">
            <div className="space-y-4">
              <Input
                label="Title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item title"
                required
              />
              <Input
                label="Price"
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  id="categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-surface-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                label="Description"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item..."
              />
              <Input
                label="Image URL (optional)"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-6 w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create listing'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
