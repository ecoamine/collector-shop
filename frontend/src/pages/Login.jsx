import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/apiClient.js';
import { saveAuth } from '../hooks/useAuth.js';
import { getRoleFromToken } from '../utils/jwt.js';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const token = response.data?.token;
      if (token) {
        const role = getRoleFromToken(token);
        saveAuth({ token, role });
        window.location.href = '/';
      } else {
        setError('Login failed');
      }
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <Card className="relative w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-2">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Sign in to your CollectorShop account.
          </p>

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="space-y-4">
              <Input
                label="Username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Your username"
                required
              />
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
