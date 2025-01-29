
import '../app/globals.css';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '../utils/supabase';

export default function Login({ setIsLoggedIn }) {
  const [form, setForm] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', form.username)
      .eq('password', form.password);

    if (data && data.length > 0) {
      localStorage.setItem('session', 'true');
      setIsLoggedIn(true);
    } else {
      alert('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="p-4 w-96 bg-white rounded-lg shadow-lg">
        <h1 className="text-xl font-bold mb-4">Inicio de Sesión</h1>
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="mb-2"
        />
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-4"
        />
        <Button onClick={handleLogin}>Iniciar Sesión</Button>
      </div>
    </div>
  );
}
