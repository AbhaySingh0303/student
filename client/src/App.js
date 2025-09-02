import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';
import RegisterRequestPage from './RegisterRequestPage';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return <div>Loading...</div>;
  }

  const toggleView = () => setIsLoginView(!isLoginView);

  if (user) {
    return <Dashboard />;
  } else {
    return isLoginView ? <LoginPage toggleView={toggleView} /> : <RegisterRequestPage toggleView={toggleView} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;