import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Eye, 
  EyeOff
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
    } catch (error) {
      setError('Username ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background with CSS3 animations */}
      <div className="animated-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Welcome Header */}
        <div className="login-header">
          <h1 className="welcome-text">Bem-vindo ao SalaFácil</h1>
          <div className="logo-container">
            <div className="logo">SF</div>
          </div>
        </div>

        {/* Professional Subtitle */}
        <div className="subtitle-container">
          <p className="subtitle-text">Sistema Inteligente de Gestão de Salas</p>
          <p className="subtitle-description">Acesse sua conta para gerenciar reservas e otimizar o uso dos espaços</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Username Field */}
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="Username"
              required
            />
          </div>

          {/* Password Field */}
          <div className="input-group">
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              'LOGIN'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Don't have an account? <a href="#" className="signup-link">Sign up</a></p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .animated-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 120px;
          height: 120px;
          top: 20%;
          right: 15%;
          animation-delay: 1s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: 2s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          right: 10%;
          animation-delay: 3s;
        }

        .shape-5 {
          width: 140px;
          height: 140px;
          top: 50%;
          left: 5%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
          }
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .welcome-text {
          font-size: 2.5rem;
          font-weight: 300;
          color: #4a5568;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .logo-container {
          display: flex;
          justify-content: center;
        }

        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
        }

        .subtitle-container {
          text-align: center;
          margin-bottom: 32px;
          padding: 0 20px;
        }

        .subtitle-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
          letter-spacing: 0.2px;
        }

        .subtitle-description {
          font-size: 0.9rem;
          color: #718096;
          line-height: 1.5;
          margin: 0;
        }

        .error-message {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 24px;
          text-align: center;
        }

        .error-message p {
          color: #dc2626;
          font-size: 0.875rem;
          margin: 0;
        }

        .login-form {
          margin-bottom: 32px;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .form-input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(247, 250, 252, 0.8);
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 16px;
          font-size: 1rem;
          color: #2d3748;
          transition: all 0.3s ease;
          outline: none;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #a0aec0;
        }

        .form-input:focus {
          border-color: #667eea;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .password-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .password-toggle:hover {
          color: #667eea;
        }

        .login-button {
          width: 100%;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
          margin-top: 8px;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px -5px rgba(102, 126, 234, 0.6);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
        }

        .login-footer p {
          color: #718096;
          font-size: 0.875rem;
          margin: 0;
        }

        .signup-link {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .signup-link:hover {
          color: #5a67d8;
          text-decoration: underline;
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .login-card {
            margin: 20px;
            padding: 32px 24px;
          }
          
          .welcome-text {
            font-size: 2rem;
          }
          
          .logo {
            width: 50px;
            height: 50px;
            font-size: 1.25rem;
          }

          .subtitle-text {
            font-size: 1rem;
          }

          .subtitle-description {
            font-size: 0.85rem;
            padding: 0 10px;
          }
        }

        /* Additional animations */
        .login-card {
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-input {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .form-input:nth-child(1) { animation-delay: 0.2s; }
        .form-input:nth-child(2) { animation-delay: 0.3s; }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .login-button {
          animation: fadeIn 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Login;
