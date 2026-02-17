import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Menu } from 'lucide-react';

function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case 'admin':
      return '管理者';
    case 'dispatcher':
      return '配車担当';
    default:
      return 'ドライバー';
  }
}

export function Header(): React.JSX.Element {
  const { currentUser, logout } = useAuth();
  const { toggleOpen } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const roleLabel = getRoleLabel(currentUser?.role);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - tablet/mobile only */}
        <button
          onClick={toggleOpen}
          className="lg:hidden flex items-center justify-center w-11 h-11 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-gray-800">
          {currentUser?.displayName || currentUser?.email}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {roleLabel}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="relative flex items-center justify-center w-11 h-11 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-3 min-h-[44px] text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  );
}
