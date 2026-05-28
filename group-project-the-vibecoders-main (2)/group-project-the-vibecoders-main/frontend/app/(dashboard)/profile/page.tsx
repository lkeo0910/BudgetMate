'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Phone, Camera, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import authService from '@/lib/services/auth.service';
import { User } from '@/types/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error: any) {
        toast.error('Failed to load profile details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      router.push('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-foreground">User not found</h2>
        <p className="text-muted-foreground mt-2">Please try logging in again.</p>
        <Button onClick={() => router.push('/auth')} className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
            <AvatarImage src={user.profile_avatar || ''} alt={user.username} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-4xl font-bold">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-center md:text-left flex-1 space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{user.username}</h1>
          <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
            Joined March 2024 • Verified Account
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
              Premium Member
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/20">
              Active Session
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Profile Details
            </CardTitle>
            <CardDescription>View your account information and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.phone_number || 'Not provided'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Status</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Fully Secured</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identity Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Verified</p>
                  <p className="text-xs text-muted-foreground">Level 1 Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-primary">Budget Tip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "Users who check their dashboard daily save an average of 15% more each month. Keep up the good work!"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
