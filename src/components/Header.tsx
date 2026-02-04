import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui';

export const Header: React.FC = () => {
  const openYTM = () => {
    window.open('https://ytm-creative-generator.example.com', '_blank');
  };

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-subtle flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-red rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg">TS</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Template Stamper</h1>
            <p className="text-xs text-text-tertiary">Video Automation Platform</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Build in Progress Banner */}
          <div className="bg-accent-red px-4 py-1.5 rounded-md">
            <span className="text-white text-sm font-semibold">Build in Progress</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={openYTM}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open YTM
          </Button>
        </div>
      </div>
    </header>
  );
};
