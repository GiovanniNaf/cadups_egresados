// pages/index.js
import { useState, useEffect } from 'react';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('session');
    setIsLoggedIn(false);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <Login setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <Dashboard handleLogout={handleLogout} />
      )}
    </div>
  );
}
