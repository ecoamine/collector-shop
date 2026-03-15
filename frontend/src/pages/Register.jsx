import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/apiClient.js';
import { saveAuth } from '../hooks/useAuth.js';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BUYER');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        username,
        password,
        role,
      });
      const token = response.data?.token;
      if (token) {
        saveAuth({ token, role });
        window.location.href = '/';
      } else {
        setError('Registration failed');
      }
    } catch {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-secondary/5 via-transparent to-transparent" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <Card className="relative w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Create account
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Join CollectorShop and start browsing or selling.
          </p>

          <form onSubmit={handleSubmit} data-testid="register-form">
            <div className="space-y-4">
              <Input
                label="Username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Choose a username"
                required
              />
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-white/10 bg-surface-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  <option value="BUYER">BUYER</option>
                  <option value="SELLER">SELLER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="mt-4 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
