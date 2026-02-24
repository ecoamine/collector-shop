import { useEffect, useState } from 'react';
import api from '../services/apiClient.js';
import { useToast } from '../components/ui/Toast.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (e) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/admin/categories', { name: name.trim() });
      setName('');
      await load();
      toast.success('Category created');
    } catch (e) {
      toast.error('Failed to create category');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setDeleteConfirm(null);
    try {
      await api.delete(`/api/admin/categories/${id}`);
      await load();
      toast.success('Category deleted');
    } catch (e) {
      toast.error('Failed to delete category');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-categories">
      <h1 className="font-display font-bold text-2xl text-white mb-2">
        Admin categories
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Create and manage categories for the marketplace.
      </p>

      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Category name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cards"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary" disabled={creating || !name.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-2xl bg-surface-600/60 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-white/10 list-none p-0 m-0">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <span className="font-medium text-white">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(c)}
                    className="text-gray-400 hover:text-danger"
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete category?"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-400">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
