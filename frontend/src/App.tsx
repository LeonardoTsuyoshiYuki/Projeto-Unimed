import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Admin } from './pages/Admin';
import { AuthProvider } from './contexts/AuthContext';
import { AppThemeProvider } from './contexts/ColorModeContext';

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="register" element={<Register />} />
              <Route path="admin/*" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
