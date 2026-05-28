'use client';

import React from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';

export default function AuthPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
