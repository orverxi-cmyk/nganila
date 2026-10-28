"use client";

import React from "react";
import { useStorage } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  accept?: string;
}

async function compressImageFile(file: File): Promise<{ blob: Blob; fileName: string; type: string }> {
  // If not an image or is GIF/SVG, do not convert via canvas
  if (!file.type.startsWith("image/") || file.type.includes("gif") || file.type.includes("svg")) {
    return { blob: file, fileName: file.name, type: file.type };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIMENSION = 1920;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ blob: file, fileName: file.name, type: file.type });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              resolve({
                blob,
                fileName: `${baseName}.webp`,
                type: "image/webp",
              });
            } else {
              resolve({ blob: file, fileName: file.name, type: file.type });
            }
          },
          "image/webp",
          0.82
        );
      };
      img.onerror = () => resolve({ blob: file, fileName: file.name, type: file.type });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ blob: file, fileName: file.name, type: file.type });
    reader.readAsDataURL(file);
  });
}

export function MediaPicker({ value, onChange, label, folder = "uploads", accept = "image/*,video/*" }: MediaPickerProps) {
  const storage = useStorage();
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const { blob: uploadBlob, fileName: targetName, type: mimeType } = await compressImageFile(file);

      const storageRef = ref(storage, `${folder}/${Date.now()}_${targetName}`);
      const metadata = {
        contentType: mimeType || file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable",
      };

      const uploadTask = uploadBytesResumable(storageRef, uploadBlob, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          setError(err.message);
          setIsUploading(false);
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsUploading(false);
          setUploadProgress(null);
        }
      );
    } catch (err: any) {
      setError(err?.message || "Failed to process and upload media.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>}
      <Tabs defaultValue={value?.includes("firebasestorage") ? "upload" : "url"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="url" className="gap-2 text-xs"><Link className="h-3 w-3" /> Online URL</TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 text-xs"><Upload className="h-3 w-3" /> Upload File</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-0">
          <Input 
            placeholder="https://..." 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-0 space-y-4">
          <div className="relative group cursor-pointer border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleUpload}
              disabled={isUploading}
              accept={accept}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : value?.includes("firebasestorage") ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <div className="text-sm font-medium">
                {isUploading ? "Uploading..." : value?.includes("firebasestorage") ? "File Uploaded" : "Click to select or drag & drop"}
              </div>
              {value && value.includes("firebasestorage") && !isUploading && (
                <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{value}</div>
              )}
            </div>
          </div>

          {uploadProgress !== null && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-1" />
              <div className="text-[10px] text-right text-muted-foreground">{Math.round(uploadProgress)}% complete</div>
            </div>
          )}

          {error && (
            <div className="text-xs text-white bg-primary px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-3 w-3 text-white shrink-0" /> {error}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
