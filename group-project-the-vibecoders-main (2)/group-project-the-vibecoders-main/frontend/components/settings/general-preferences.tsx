'use client';

import React, { useState } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function GeneralPreferences() {
  const [currency, setCurrency] = useState('VND');
  const [language, setLanguage] = useState('English');
  const [profileImage, setProfileImage] = useState('/api/placeholder?w=120&h=120');

  const currencies = ['USD', 'VND', 'EUR', 'GBP', 'JPY', 'AUD'];
  const languages = ['English', 'Vietnamese', 'Spanish', 'French', 'German', 'Chinese'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">General Preferences</h1>
        <p className="text-muted-foreground">Manage your profile and basic settings</p>
      </div>

      {/* Profile & General Preferences Section */}
      <Card className="p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Profile & General Settings</h2>

        <div className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex items-end gap-6">
            <div className="flex-shrink-0">
              <img
                src={profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="profile-upload" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </Button>
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground mt-2">
                PNG, JPG or GIF (Max. 5MB)
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            {/* Preferred Currency */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Currency
              </label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All amounts will be displayed in {currency}
              </p>
            </div>

            {/* Language Preferences */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Language Preferences
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Interface will be available in {language}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
