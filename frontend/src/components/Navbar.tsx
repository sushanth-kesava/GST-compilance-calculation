import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '../components/Toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NavbarProps {
  onToggleGuide: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleGuide }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res: any = await api.get('/notifications/unread');
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      toast('error', 'Failed to load notifications.');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast('error', 'Failed to mark notification as read.');
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md text-card-foreground flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h2 className="font-semibold text-lg text-foreground">Management Console</h2>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Help/Copilot Toggle Button */}
        <button
          onClick={onToggleGuide}
          className="px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
          title="Open SmartRetail Copilot"
          style={{backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: '1px solid rgba(0,0,0,0.04)'}}
        >
          <Sparkles size={14} style={{color: 'hsl(var(--primary-foreground))'}} />
          <span>Copilot</span>
        </button>

        {/* Notification Icon */}
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 rounded-xl border border-border hover:bg-muted relative transition-all"
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Dropdown Popover */}
        {showDropdown && (
          <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 p-2 text-sm max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="font-bold text-foreground">System Alerts</span>
              <span className="text-xs text-muted-foreground">{notifications.length} pending</span>
            </div>

            <div className="mt-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  All systems clear. No new notifications.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className="p-2.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border flex gap-3 items-start transition-all cursor-pointer"
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${
                      notif.type === 'LOW_STOCK' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                    }`}>
                      <AlertCircle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{notif.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => markAsRead(notif.id, e)}
                      className="p-1 rounded-md hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all self-center"
                      title="Clear Alert"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
