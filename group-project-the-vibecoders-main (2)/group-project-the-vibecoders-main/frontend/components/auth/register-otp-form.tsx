'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import authService from '@/lib/services/auth.service';
import { toast } from 'sonner';

interface RegisterOtpFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function RegisterOtpForm({ email, onSuccess, onBack }: RegisterOtpFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    if (error) setError(null);

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = code.join('');
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyRegisterOtp({ email, code: otpCode });
      toast.success(response.message || 'Verification successful!');
      onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed. Please check the code.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -mx-2 -mt-2 px-2 py-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to registration
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Verify Your Email</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          We&apos;ve sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. 
          Please enter it below to complete your registration.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Verification Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}


      <div className="flex gap-2 justify-center">
        {code.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
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

      <Button
        type="submit"
        disabled={code.join('').length !== 6 || isLoading}
        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all"
      >
        {isLoading ? 'Verifying...' : 'Verify Account'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Didn&apos;t receive a code?{' '}
        <button type="button" className="text-primary hover:underline font-medium">
          Resend Code
        </button>
      </p>
    </form>
  );
}
