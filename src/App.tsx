import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import LoginForm from './components/Auth/LoginForm';
import ResetPasswordForm from './components/Auth/ResetPasswordForm';
import Dashboard from './components/Dashboard/Dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🎯 AppContent render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aplicação...</p>
          <p className="text-xs text-gray-400 mt-2">Conectando com o banco de dados...</p>
          <p className="text-xs text-gray-500 mt-4">
            Se esta tela persistir por mais de 10 segundos, verifique as configurações do Supabase
          </p>
          
          {/* Show configuration error if env vars are missing */}
          {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY || 
            import.meta.env.VITE_SUPABASE_URL?.includes('your_supabase_project_url_here') || 
            import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('your_supabase_anon_key_here')) && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700 font-medium mb-2">⚠️ Erro de Configuração</p>
              <p className="text-red-600 text-sm">
                O arquivo .env precisa ser atualizado com suas credenciais reais do Supabase.
                Substitua os valores placeholder por suas credenciais reais do projeto Supabase.
              </p>
            </div>
          )}

          {/* Show current environment variables for debugging */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-blue-700 font-medium mb-2">🔧 Debug Info</p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>URL configurada: {
                !import.meta.env.VITE_SUPABASE_URL ? '❌ Não' :
                import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_project_url_here') ? '⚠️ Placeholder' :
                '✅ Sim'
              }</p>
              <p>Key configurada: {
                !import.meta.env.VITE_SUPABASE_ANON_KEY ? '❌ Não' :
                import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your_supabase_anon_key_here') ? '⚠️ Placeholder' :
                '✅ Sim'
              }</p>
              <p>Ambiente: {import.meta.env.MODE}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordForm />} />
      <Route 
        path="/" 
        element={
          !isAuthenticated ? (
            <LoginForm />
          ) : (
            <FinancialProvider>
              <Dashboard />
            </FinancialProvider>
          )
        } 
      />
    </Routes>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erro na Aplicação</h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Verifique sua conexão com a internet e as configurações do banco de dados.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;