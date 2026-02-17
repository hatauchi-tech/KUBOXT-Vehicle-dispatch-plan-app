import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { cn } from '../utils/cn';
import {
  LayoutDashboard,
  CalendarCheck,
  Truck,
  ClipboardList,
  Building2,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BookOpen,
  X,
} from 'lucide-react';

const menuItems = [
  { path: '/dispatch-plan', label: '配車計画', icon: LayoutDashboard, roles: ['admin', 'dispatcher'] },
  { path: '/dispatch-status', label: '配車状況', icon: CalendarCheck, roles: ['admin', 'dispatcher'] },
  { path: '/driver', label: 'マイ配車', icon: MapPin, roles: ['driver'] },
  { path: '/daily-reports', label: '日報管理', icon: ClipboardList, roles: ['admin', 'dispatcher'] },
  { path: '/master/vehicles', label: '車両マスタ', icon: Truck, roles: ['admin'] },
  { path: '/master/customers', label: '荷主マスタ', icon: Building2, roles: ['admin'] },
  { path: '/users', label: 'ユーザー管理', icon: Users, roles: ['admin'] },
  { path: '/settings', label: '設定', icon: Settings, roles: ['admin'] },
  { path: '/manual', label: 'マニュアル', icon: BookOpen, roles: ['admin', 'dispatcher', 'driver'] },
];

export function Sidebar(): React.JSX.Element {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isOpen, collapsed, close, toggleCollapsed } = useSidebar();

  if (!currentUser) {
    return (
      <aside className={cn(
        'bg-[#0F172A] text-white flex flex-col transition-all duration-200',
        'hidden lg:flex',
        collapsed ? 'w-16' : 'w-56'
      )}>
        <div className="h-14 flex items-center justify-center border-b border-white/10">
          <div className="w-5 h-5 rounded bg-blue-500 animate-pulse" />
        </div>
      </aside>
    );
  }

  const isActive = (path: string): boolean => location.pathname === path;

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <Truck className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">配車計画</span>
        )}
        {/* Close button for tablet/mobile overlay */}
        <button
          onClick={close}
          className="ml-auto lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={close}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', active ? 'text-white' : 'text-slate-500')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle - desktop only */}
      <div className="hidden lg:block p-2 border-t border-white/10 shrink-0">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center min-h-[44px] rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Backdrop overlay for tablet/mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Desktop sidebar - always visible, supports collapse */}
      <aside className={cn(
        'bg-[#0F172A] text-white flex-col transition-all duration-200 shrink-0',
        'hidden lg:flex',
        collapsed ? 'w-16' : 'w-56'
      )}>
        {sidebarContent}
      </aside>

      {/* Tablet/mobile sidebar - overlay with slide-in animation */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-56',
        'bg-[#0F172A] text-white flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
