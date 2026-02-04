import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from './ui';

export const Header: React.FC = () => {
  const openYTM = () => {
    window.open('https://ytm-creative-generator.example.com', '_blank');
  };

  return (
    <>
      {/* Corner Ribbon Banner */}
      <div className="fixed top-0 right-0 z-50 overflow-hidden pointer-events-none">
        <div className="relative">
          <div
            className="bg-accent-red text-white text-xs font-bold uppercase tracking-wide py-1 px-12 transform rotate-45 origin-top-right shadow-lg"
            style={{
              position: 'absolute',
              top: '20px',
              right: '-35px',
              width: '200px',
              textAlign: 'center',
            }}
          >
            Build in Progress
          </div>
        </div>
      </div>

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
    </>
  );
};
