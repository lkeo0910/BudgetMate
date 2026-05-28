'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReceiptUploaderProps {
  /**
   * Called when exactly 1 file is dropped/selected.
   * Parent uses this to immediately open the Verify OCR Modal.
   */
  onSingleFileDrop?: () => void;
}

/**
 * ReceiptUploader — Dashboard sidebar receipt widget.
 *
 * ROUTING LOGIC (mirrors /transactions):
 *  • 1 file  → calls onSingleFileDrop() so parent can open the modal immediately
 *  • >1 files → queues filenames into local state for batch processing
 *  • "Process All" → toast only (no modal ever opened here)
 */
export function ReceiptUploader({ onSingleFileDrop }: ReceiptUploaderProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag events ────────────────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const routeFiles = (files: File[]) => {
    if (files.length === 0) return;

    if (files.length === 1) {
      // Single file — notify parent to open modal immediately, keep dropzone clean
      onSingleFileDrop?.();
      toast({
        title: 'Receipt received',
        description: 'Opening verification form…',
      });
    } else {
      // Batch — queue filenames locally
      setUploadedFiles(prev => [...prev, ...files.map(f => f.name)]);
      toast({
        title: 'Receipts uploaded',
        description: `${files.length} file(s) added to the Needs Review queue.`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      routeFiles(Array.from(files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      routeFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
  };

  // "Process All" — toast ONLY, NO modal
  const handleProcessAll = () => {
    toast({
      title: 'Receipts queued for processing',
      description: `${uploadedFiles.length} receipt(s) sent for automatic categorisation.`,
    });
    setUploadedFiles([]);
  };

  return (
    <Card className="border-0 bg-white dark:bg-slate-800 shadow-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Receipt Processor</h3>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? 'border-teal-500 bg-teal-50'
            : 'border-border hover:border-teal-400/60 bg-muted/20'
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <p className="font-medium text-foreground">Drop receipts here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <Button
            size="sm"
            className="mt-2 bg-teal-500 hover:bg-teal-600 text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* Batch file queue */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
          </p>
          {uploadedFiles.map((fileName, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-foreground truncate">{fileName}</span>
              </div>
              <button
                onClick={() => removeFile(fileName)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Process All — toast ONLY */}
      {uploadedFiles.length > 0 && (
        <Button
          className="w-full mt-4 gap-2 bg-teal-500 hover:bg-teal-600 text-white"
          onClick={handleProcessAll}
        >
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
