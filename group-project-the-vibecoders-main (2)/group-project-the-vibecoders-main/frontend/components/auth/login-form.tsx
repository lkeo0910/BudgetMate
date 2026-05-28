'use client';

import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import authService from '@/lib/services/auth.service';
import { toast } from 'sonner';

interface LoginFormProps {
  onSubmit?: () => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.login({ username, password });
      toast.success('Login successful!');
      
      // If we need to do something else before redirecting
      onSubmit?.();
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome Back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your BudgetMate account</p>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Username Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Username</label>
        <div className="relative">
          <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError(null);
            }}
            placeholder="johndoe"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>


      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Password</label>
          <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Remember Session Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="remember-session"
          className="border border-input bg-background"
          checked={rememberSession}
          onCheckedChange={(checked) => setRememberSession(checked as boolean)}
        />
        <label
          htmlFor="remember-session"
          className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
        >
          Remember this session
        </label>
      </div>

      {/* Sign In Button */}
      <Button
        type="submit"
        disabled={!isFormValid || isLoading}
        className="w-full py-2.5 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </Button>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-card text-muted-foreground">New to BudgetMate?</span>
        </div>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground">
        Create an account{' '}
        <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
          here
        </Link>
      </p>
    </form>
  );
}

