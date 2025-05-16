"use client";

import * as React from 'react';
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
} from "@/components/ui/sheet";
import type { ChatSettings } from '@/types';
import { Palette, Image as ImageIcon, Link2, Check } from 'lucide-react';

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

  React.useEffect(() => {
    setCurrentBgColor(settings.bgColor);
    setCurrentBgImage(settings.bgImage);
    setCurrentApiUrl(settings.chatHistoryApiUrl);
  }, [settings]);

  const handleApplyChanges = () => {
    onSettingsChange({
      bgColor: currentBgColor,
      bgImage: currentBgImage,
      chatHistoryApiUrl: currentApiUrl,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-card">
        <SheetHeader>
          <SheetTitle>Chat Settings</SheetTitle>
          <SheetDescription>
            Customize your chat experience. Changes will be applied when you click "Apply".
            <br />For mock Python API history, use URL: <code>/api/python-chat-history</code>
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
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
            <Label htmlFor="bgImage" className="flex items-center">
              <ImageIcon className="mr-2 h-4 w-4" /> Background Image URL
            </Label>
            <Input
              id="bgImage"
              type="text"
              placeholder="https://example.com/image.png"
              value={currentBgImage}
              onChange={(e) => setCurrentBgImage(e.target.value)}
            />
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
        </div>
        <SheetFooter>
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
