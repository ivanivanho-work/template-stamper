import React from 'react';
import { Header } from '../components/Header';
import { LeftSidebar } from './LeftSidebar';
import { MainContent, MainContentProps } from './MainContent';
import { RightSidebar } from './RightSidebar';

export interface AppLayoutProps extends MainContentProps {
  rightSidebar?: React.ReactNode;
  rightSidebarVisible?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  rightSidebar,
  rightSidebarVisible = false,
}) => {
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header - Full Width */}
      <Header />

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <LeftSidebar />

        {/* Main Content - Flexible */}
        <MainContent title={title} subtitle={subtitle} actions={actions}>
          {children}
        </MainContent>

        {/* Right Sidebar - Conditional */}
        <RightSidebar visible={rightSidebarVisible}>
          {rightSidebar}
        </RightSidebar>
      </div>
    </div>
  );
};
