import { createContext, useCallback, useContext, useState } from 'react';

interface SidebarContextType {
  /** Whether the mobile/tablet overlay sidebar is open */
  isOpen: boolean;
  /** Whether the desktop sidebar is collapsed to icon-only mode */
  collapsed: boolean;
  /** Toggle the mobile/tablet overlay sidebar */
  toggleOpen: () => void;
  /** Close the mobile/tablet overlay sidebar */
  close: () => void;
  /** Toggle the desktop collapsed/expanded state */
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const value: SidebarContextType = {
    isOpen,
    collapsed,
    toggleOpen,
    close,
    toggleCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
