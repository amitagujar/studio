
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { ChatSettings } from '@/types';
import { Palette, Image as ImageIcon, Link2, Check, XCircle, Upload, KeyRound, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: ChatSettings;
  onSettingsChange: (newSettings: Partial<ChatSettings>) => void;
  onLoadHistory: () => void;
}

export function SettingsPanel({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
  onLoadHistory,
}: SettingsPanelProps) {
  const [currentBgColor, setCurrentBgColor] = React.useState(settings.bgColor);
  const [currentBgImage, setCurrentBgImage] = React.useState(settings.bgImage);
  const [currentApiUrl, setCurrentApiUrl] = React.useState(settings.chatHistoryApiUrl);
  const [currentChatMessageApiUrl, setCurrentChatMessageApiUrl] = React.useState(settings.chatMessageApiUrl || '');
  const [currentChatMessageApiPassword, setCurrentChatMessageApiPassword] = React.useState(settings.chatMessageApiPassword || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setCurrentBgColor(settings.bgColor);
    setCurrentBgImage(settings.bgImage);
    setCurrentApiUrl(settings.chatHistoryApiUrl);
    setCurrentChatMessageApiUrl(settings.chatMessageApiUrl || '');
    setCurrentChatMessageApiPassword(settings.chatMessageApiPassword || '');
  }, [settings, isOpen]); // Also reset on open to reflect current live settings

  const handleApplyChanges = React.useCallback(() => {
    onSettingsChange({
      bgColor: currentBgColor,
      bgImage: currentBgImage,
      chatHistoryApiUrl: currentApiUrl,
      chatMessageApiUrl: currentChatMessageApiUrl,
      chatMessageApiPassword: currentChatMessageApiPassword,
    });
    onOpenChange(false);
    toast({
      title: "Settings Applied",
      description: "Your chat settings have been updated.",
    });
  }, [
        currentBgColor, 
        currentBgImage, 
        currentApiUrl, 
        currentChatMessageApiUrl, 
        currentChatMessageApiPassword, 
        onSettingsChange, 
        onOpenChange, 
        toast
    ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Image Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentBgImage(reader.result as string);
      };
      reader.onerror = () => {
        toast({
          title: "Error Reading File",
          description: "Could not read the selected image file.",
          variant: "destructive",
        });
      }
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setCurrentBgImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
          <SheetDescription>
            Customize your chat experience. Changes are saved locally.
            <br />Mock history URL: <code>/api/python-chat-history</code>
            <br />AI may use Custom Message API if configured.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6 flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar space */}
          <div className="grid gap-3">
            <Label htmlFor="bgColor" className="flex items-center">
              <Palette className="mr-2 h-4 w-4" /> Background Color
            </Label>
            <Input
              id="bgColor"
              type="color"
              value={currentBgColor}
              onChange={(e) => setCurrentBgColor(e.target.value)}
              className="w-full h-10 p-1"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="bgImageFile" className="flex items-center">
              <ImageIcon className="mr-2 h-4 w-4" /> Background Image
            </Label>
            <Input
              id="bgImageFile"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Choose Image
            </Button>
            {currentBgImage && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Preview:</p>
                <div className="relative w-full h-32 rounded-md border overflow-hidden">
                  <Image
                    src={currentBgImage}
                    alt="Background preview"
                    layout="fill"
                    objectFit="cover"
                    unoptimized={currentBgImage.startsWith('data:image')}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleClearImage} className="w-full">
                  <XCircle className="mr-2 h-4 w-4" /> Clear Image
                </Button>
              </div>
            )}
             {!currentBgImage && (
              <div className="mt-2 p-4 border border-dashed rounded-md text-center text-muted-foreground">
                <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                No image selected.
              </div>
            )}
          </div>
          
          <div className="grid gap-3">
            <Label htmlFor="apiUrl" className="flex items-center">
              <Link2 className="mr-2 h-4 w-4" /> Chat History API URL
            </Label>
            <Input
              id="apiUrl"
              type="text"
              placeholder="/api/python-chat-history"
              value={currentApiUrl}
              onChange={(e) => setCurrentApiUrl(e.target.value)}
            />
            <Button variant="outline" onClick={onLoadHistory} className="mt-2" disabled={!currentApiUrl}>
              Load History
            </Button>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="chatMessageApiUrl" className="flex items-center">
              <Send className="mr-2 h-4 w-4" /> Custom Message API URL (for AI Tool)
            </Label>
            <Input
              id="chatMessageApiUrl"
              type="text"
              placeholder="e.g., https://your-service.com/api/process"
              value={currentChatMessageApiUrl}
              onChange={(e) => setCurrentChatMessageApiUrl(e.target.value)}
            />
             <p className="text-xs text-muted-foreground">The AI will use this API via a tool if it deems it necessary and if a URL is provided.</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="chatMessageApiPassword" className="flex items-center">
              <KeyRound className="mr-2 h-4 w-4" /> Custom Message API Password
            </Label>
            <Input
              id="chatMessageApiPassword"
              type="password"
              placeholder="Enter API password if required"
              value={currentChatMessageApiPassword}
              onChange={(e) => setCurrentChatMessageApiPassword(e.target.value)}
            />
          </div>

        </div>
        <SheetFooter className="sticky bottom-0 bg-card py-4 border-t mt-auto">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleApplyChanges}>
            <Check className="mr-2 h-4 w-4" /> Apply Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
