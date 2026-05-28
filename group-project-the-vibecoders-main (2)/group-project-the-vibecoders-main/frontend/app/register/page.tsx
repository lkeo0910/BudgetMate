'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { RegisterForm } from '@/components/auth/register-form';
import { RegisterOtpForm } from '@/components/auth/register-otp-form';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [email, setEmail] = useState('');

  const handleRegisterSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setStep('otp');
  };

  const handleOtpSuccess = () => {
    // Redirection to login after successful OTP verification
    router.push('/auth');
  };

  return (
    <AuthLayout>
      {step === 'register' ? (
        <RegisterForm onSuccess={handleRegisterSuccess} />
      ) : (
        <RegisterOtpForm 
          email={email} 
          onSuccess={handleOtpSuccess} 
          onBack={() => setStep('register')} 
        />
      )}
    </AuthLayout>
  );
}

