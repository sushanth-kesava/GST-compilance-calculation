import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, ShieldAlert, Check } from 'lucide-react';
import api from '../services/api';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  // Login Form States
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');

  // UI Flow states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isRegister) {
        const payload = {
          username: regUser,
          email: regEmail,
          password: regPass,
          fullName: regName,
          roles: ['ROLE_ADMIN'] // Set as admin for demo simplicity
        };
        const res = await register(payload);
        if (res.success) {
          setSuccess('Account created successfully! Enter the OTP code sent to your email.');
          setOtpEmail(regEmail);
          setShowOtpModal(true);
        }
      } else {
        const res = await login(username, password);
        if (res.success) {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      const res: any = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp: otpCode
      });
      if (res.success) {
        setSuccess('Account verified successfully! You can now log in.');
        setShowOtpModal(false);
        setIsRegister(false);
        setUsername(regUser);
        setPassword(regPass);
      } else {
        setError(res.message || 'OTP validation failed');
      }
    } catch (err: any) {
      setError(err.message || 'OTP validation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 relative shadow-2xl z-10 text-white">
        <div className="text-center mb-8">
          <div className="inline-block bg-purple-500/10 text-purple-400 p-3 rounded-2xl mb-4">
            <KeyRound size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">SmartRetail 360</h2>
          <p className="text-xs text-slate-400 mt-2">
            {isRegister ? 'Create an administrator account' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/15 border border-red-500/30 text-red-400 p-3 rounded-xl flex gap-3 text-xs items-center">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex gap-3 text-xs items-center">
            <Check size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              {isRegister ? 'Choose Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={isRegister ? regUser : username}
                onChange={(e) => isRegister ? setRegUser(e.target.value) : setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={isRegister ? regPass : password}
                onChange={(e) => isRegister ? setRegPass(e.target.value) : setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-purple-600/20 mt-6"
          >
            {isRegister ? 'Submit Registration' : 'Access Console'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-xs text-purple-400 hover:underline"
          >
            {isRegister ? 'Already have an ERP account? Sign In' : 'New Store Manager? Register Admin Account'}
          </button>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white">
            <h3 className="font-bold text-lg text-center mb-2">Verify Email OTP</h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              We simulated sending an email verification code to <span className="font-semibold text-white">{otpEmail}</span>. Check your terminal output.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP code"
              className="w-full text-center tracking-widest bg-slate-950 border border-slate-800 rounded-xl py-3 text-lg font-bold focus:border-purple-500 focus:outline-none mb-6"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-all"
            >
              Verify OTP Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
