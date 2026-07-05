import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  Brain, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Store,
  Receipt
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Billing', icon: ShoppingCart },
    { to: '/inventory', label: 'Inventory & SKUs', icon: Package },
    { to: '/customers', label: 'Customers & Loyalty', icon: Users },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/ai-panel', label: 'AI Insights', icon: Brain },
    { to: '/invoices', label: 'Invoice History', icon: Receipt },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-card text-card-foreground border-r border-border flex flex-col justify-between p-4 sticky top-0">
      <div>
        {/* LOGO */}
        <div className="flex items-center gap-3 px-2 py-3 mb-8">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <Store size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">SmartRetail 360</h1>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Enterprise ERP</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="border-t border-border pt-4 space-y-4">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-primary/25 text-primary flex items-center justify-center font-bold text-sm">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold truncate">{user.username}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.roles[0].replace('ROLE_', '')}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
