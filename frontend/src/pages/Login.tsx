import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  KeyRound, Mail, User, ShieldAlert, Store, 
  Eye, EyeOff, ArrowRight, Loader2,
  CheckCircle
} from 'lucide-react';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');

  // UI Flow states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordReg, setShowPasswordReg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const payload = {
          username: regUser,
          email: regEmail,
          password: regPass,
          fullName: regName,
          roles: ['ROLE_CASHIER']
        };
        const res = await register(payload);
        if (res.success) {
          setSuccess('Account created successfully! You can now sign in.');
          toast('success', 'Account created successfully! Please sign in.');
          setUsername(regUser);
          setPassword(regPass);
          setIsRegister(false);
        }
      } else {
        const res = await login(username, password);
        if (res.success) {
          toast('success', 'Welcome back! Redirecting to dashboard...');
          navigate('/');
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Subtle accent decoration */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-5">
            <Store size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">SmartRetail 360</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {isRegister ? 'Create your enterprise account' : 'Enterprise Retail Management Platform'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-lg">
          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-7">
            <button
              onClick={() => !isRegister ? null : toggleMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isRegister 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => isRegister ? null : toggleMode()}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isRegister 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl flex gap-3 text-sm items-start">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success alert */}
          {success && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3.5 rounded-xl flex gap-3 text-sm items-start">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration fields */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-3.5 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email Address</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {isRegister ? 'Choose Username' : 'Username or Email'}
              </label>
              <div className="relative group">
                <User size={16} className="absolute left-3.5 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  required
                  value={isRegister ? regUser : username}
                  onChange={(e) => isRegister ? setRegUser(e.target.value) : setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
              <div className="relative group">
                <KeyRound size={16} className="absolute left-3.5 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword || (isRegister ? showPasswordReg : showPassword) ? "text" : "password"}
                  required
                  value={isRegister ? regPass : password}
                  onChange={(e) => isRegister ? setRegPass(e.target.value) : setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-input rounded-xl py-3 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => isRegister ? setShowPasswordReg(!showPasswordReg) : setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {(isRegister ? showPasswordReg : showPassword) ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl py-3 text-sm transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Toggle between login/register */}
          <div className="text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              {isRegister ? (
                <span>Already have an account? <span className="font-semibold text-primary group-hover:text-primary/80">Sign In</span></span>
              ) : (
                <span>New to SmartRetail? <span className="font-semibold text-primary group-hover:text-primary/80">Create Account</span></span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-6">
          Secure enterprise platform • Powered by SmartRetail 360 Engine
        </p>
      </div>
    </div>
  );
};

export default Login;
