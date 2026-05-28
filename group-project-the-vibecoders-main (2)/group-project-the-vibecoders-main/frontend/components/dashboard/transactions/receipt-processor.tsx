'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReceiptProcessor() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingFile, setProcessingFile] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
  };

  const processReceipt = (fileName: string) => {
    setProcessingFile(fileName);
    setTimeout(() => setProcessingFile(null), 2000);
  };

  return (
    <Card className="border-0 bg-white dark:bg-slate-800 shadow-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Receipt Processor</h3>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 bg-muted/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="font-medium text-foreground">Drop receipts here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
          </p>
          {uploadedFiles.map((fileName, index) => {
            const isProcessing = processingFile === fileName;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  {isProcessing ? (
                    <div className="w-4 h-4 rounded border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm text-foreground truncate">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isProcessing && (
                    <button
                      onClick={() => processReceipt(fileName)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Process
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(fileName)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Process All Button */}
      {uploadedFiles.length > 0 && (
        <Button className="w-full mt-4 gap-2" variant="default">
          <CheckCircle2 className="w-4 h-4" />
          Process All Receipts
        </Button>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-secondary/10 border border-secondary/20 rounded-lg flex gap-2">
        <AlertCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          AI will automatically extract amount, category, and merchant details
        </p>
      </div>
    </Card>
  );
}
