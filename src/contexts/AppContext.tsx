import React, { createContext, useContext, ReactNode } from 'react';
import { useMacros } from '../hooks/useMacros';
import { useLinks } from '../hooks/useLinks';
import { useTemplates } from '../hooks/useTemplates';
import { useUpdates } from '../hooks/useUpdates';
import { Macro, LinkItem, Template, UpdateItem, Severity } from '../types';

/**
 * AppContext provides global state management for the application.
 * It centralizes the data fetching and state for Macros, Links, Templates, and Updates,
 * preventing the need for prop drilling from App.tsx down to individual tabs.
 */
interface AppContextType {
  // Macros
  macros: Macro[];
  saveMacro: (summary: string, response: string) => Promise<void>;
  deleteMacro: (id: string) => Promise<void>;
  editMacro: (id: string, summary: string, response: string) => Promise<void>;
  toggleFavoriteMacro: (id: string, currentStatus: boolean) => Promise<void>;

  // Links
  links: LinkItem[];
  addLink: (url: string, description: string) => Promise<void>;
  editLink: (id: string, url: string, description: string) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  toggleFavoriteLink: (id: string, currentStatus: boolean) => Promise<void>;

  // Templates
  templates: Template[];
  addTemplate: (name: string, fields: Template['fields']) => Promise<void>;
  editTemplate: (id: string, name: string, fields: Template['fields']) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavoriteTemplate: (id: string, currentStatus: boolean) => Promise<void>;

  // Updates
  updates: UpdateItem[];
  saveUpdate: (title: string, content: string, severity?: Severity, link?: string, imageUrl?: string) => Promise<void>;
  deleteUpdate: (id: string) => Promise<void>;
  editUpdate: (id: string, title: string, content: string, severity?: Severity, link?: string, imageUrl?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const macrosState = useMacros();
  const linksState = useLinks();
  const templatesState = useTemplates();
  const updatesState = useUpdates();

  return (
    <AppContext.Provider
      value={{
        ...macrosState,
        toggleFavoriteMacro: macrosState.toggleFavorite,
        ...linksState,
        toggleFavoriteLink: linksState.toggleFavorite,
        ...templatesState,
        toggleFavoriteTemplate: templatesState.toggleFavorite,
        ...updatesState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to consume the AppContext.
 * Must be used within an AppContextProvider.
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
