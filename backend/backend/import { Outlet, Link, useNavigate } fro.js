import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Building, CalendarDays, LogOut } from 'lucide-react';

// Você deve substituir isso pelo seu hook de autenticação real.
// import { useAuth } from '../../contexts/AuthContext';

const MainLayout = () => {
  // const { user, logout } = useAuth(); // Descomente quando seu contexto estiver pronto
  const user = { name: 'Usuário Teste' }; // Dados de exemplo
  const navigate = useNavigate();

  const handleLogout = () => {
    // logout();
    console.log('Usuário deslogado');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <aside className="hidden w-64 flex-col border-r bg-white p-4 sm:flex">
        <div className="mb-8 text-center">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
            AgendaSalas
          </Link>
        </div>
        <nav className="flex flex-col space-y-2">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-600">
            <CalendarDays className="h-5 w-5" />
            Minhas Reservas
          </Link>
          <Link to="/salas" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-blue-600">
            <Building className="h-5 w-5" />
            Salas
          </Link>
        </nav>
        <div className="mt-auto">
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-all hover:bg-gray-100 hover:text-red-600">
              <LogOut className="h-5 w-5" />
              Sair
            </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;