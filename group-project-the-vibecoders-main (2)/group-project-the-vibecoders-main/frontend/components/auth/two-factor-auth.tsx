'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwoFactorAuthProps {
  onSubmit: () => void;
  onBack: () => void;
}

export function TwoFactorAuth({ onSubmit, onBack }: TwoFactorAuthProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only keep last digit
    setCode(newCode);

    // Auto-focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    onSubmit();
  };

  const codeString = code.join('');
  const isCodeComplete = codeString.length === 6;

  const copyToClipboard = () => {
    navigator.clipboard.writeText('123456');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -mx-2 -mt-2 px-2 py-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </button>

      {/* Heading */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary/50">
            <ShieldCheck className="w-5 h-5 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app or email
        </p>
      </div>

      {/* Code Input Fields */}
      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-semibold border-2 border-border rounded-lg bg-input text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="•"
            />
          ))}
        </div>

        {/* Demo Code Chip */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30 hover:bg-muted/50 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Demo code: 123456
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-muted/30 border border-border rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Didn&apos;t receive a code?</span> Check your email or authenticator app. Codes expire after 30 seconds.
        </p>
      </div>

      {/* Verify Button */}
      <Button
        type="submit"
        disabled={!isCodeComplete || isLoading}
        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Verifying...
          </div>
        ) : (
          'Verify & Sign In'
        )}
      </Button>

      {/* Support Link */}
      <p className="text-center text-xs text-muted-foreground">
        Having trouble?{' '}
        <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
          Contact support
        </a>
      </p>
    </form>
  );
}
