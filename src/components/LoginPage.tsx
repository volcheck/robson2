import React, { useState } from 'react';
import { login } from '../services/api';
import { demoLogin } from '../services/demoData';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const DEMO_MODE = true;

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (DEMO_MODE) {
        const result = demoLogin(form.username, form.password);
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      } else {
        await login(form.username, form.password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-baby text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Классификация Робсона</h1>
          <p className="text-gray-500 mt-2">Система учёта статистики родов</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fas fa-user"></i>
              </span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите логин"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите пароль"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-sign-in-alt mr-2"></i>
            )}
            Войти в систему
          </button>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 font-medium mb-1">
            <i className="fas fa-info-circle mr-1"></i> Демо-доступ:
          </p>
          <p className="text-xs text-blue-600">Логин: <code className="bg-blue-100 px-1 rounded">admin</code> Пароль: <code className="bg-blue-100 px-1 rounded">admin123</code></p>
          <p className="text-xs text-blue-600 mt-1">Логин: <code className="bg-blue-100 px-1 rounded">doctor</code> Пароль: <code className="bg-blue-100 px-1 rounded">doctor123</code></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
