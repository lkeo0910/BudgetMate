'use client';

import React, { useState } from 'react';
import { LogOut, Download, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export function SecurityPrivacy() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeSessions = [
    {
      id: 1,
      device: 'MacBook Pro',
      browser: 'Chrome',
      location: 'San Francisco, CA',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: 2,
      device: 'iPhone 14',
      browser: 'Safari',
      location: 'San Francisco, CA',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: 3,
      device: 'Windows Desktop',
      browser: 'Firefox',
      location: 'Los Angeles, CA',
      lastActive: '3 days ago',
      current: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Security & Privacy</h1>
        <p className="text-muted-foreground">Manage your security settings and data control</p>
      </div>

      {/* Two-Factor Authentication */}
      <Card className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
            className="ml-4"
          />
        </div>

        {twoFactorEnabled && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              ✓ Two-Factor Authentication is <strong>enabled</strong>. You will be asked to verify your identity using an authentication app when logging in from a new device.
            </p>
          </div>
        )}

        {!twoFactorEnabled && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              Two-Factor Authentication is currently <strong>disabled</strong>. Enable it to add an extra security layer to protect your account.
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button className={twoFactorEnabled ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}>
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Active Sessions</h2>

        <div className="space-y-3">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="border border-border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {session.device}
                  </span>
                  {session.current && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.browser} • {session.location}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last active: {session.lastActive}
                </p>
              </div>

              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 gap-2 flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out All Other Sessions
          </Button>
        </div>
      </Card>

      {/* Data Privacy & Security Controls */}
      <Card className="p-8 border-destructive/20 bg-destructive/5">
        <h2 className="text-xl font-semibold text-foreground mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-6">
          These actions are permanent and cannot be undone. Please proceed with caution.
        </p>

        <div className="space-y-3">
          {/* Export Data */}
          <div className="border border-border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Export Your Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your financial data in a secure format
              </p>
            </div>
            <Button
              variant="outline"
              className="ml-4 gap-2 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Delete Account */}
          <div className="border border-destructive/30 rounded-lg p-4 flex items-start justify-between bg-destructive/5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Delete Account</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This cannot be reversed.
              </p>
            </div>
            <Button
              variant="destructive"
              className="ml-4 gap-2 flex-shrink-0"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="border-2 border-destructive rounded-lg p-4 bg-destructive/10">
              <h4 className="font-semibold text-destructive mb-2">Are you sure?</h4>
              <p className="text-sm text-foreground mb-4">
                This will permanently delete your account and all financial data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Yes, Delete My Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
