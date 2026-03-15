import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Home from './pages/Home.jsx';
import ItemDetails from './pages/ItemDetails.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import SellerCreate from './pages/SellerCreate.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { AppShell } from './layout/AppShell.jsx';

const pageVariants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

const pageTransition = { type: 'tween', duration: 0.2 };

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <Home />
              </AnimatedPage>
            }
          />
          <Route
            path="/items/:id"
            element={
              <AnimatedPage>
                <ItemDetails />
              </AnimatedPage>
            }
          />
          <Route
            path="/login"
            element={
              <AnimatedPage>
                <Login />
              </AnimatedPage>
            }
          />
          <Route
            path="/register"
            element={
              <AnimatedPage>
                <Register />
              </AnimatedPage>
            }
          />
          <Route
            path="/seller/items/new"
            element={
              <ProtectedRoute requiredRole="SELLER">
                <AnimatedPage>
                  <SellerCreate />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AnimatedPage>
                  <AdminCategories />
                </AnimatedPage>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
