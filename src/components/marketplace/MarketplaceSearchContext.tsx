import React, { createContext, useContext, useState } from 'react';

export interface MarketplaceFilters {
  category?: string;
  tags?: string[];
  pricing?: string;
  [key: string]: any;
}

interface MarketplaceSearchContextType {
  filters: MarketplaceFilters;
  setFilters: (filters: MarketplaceFilters) => void;
  lastQuery: string;
  setLastQuery: (query: string) => void;
}

const MarketplaceSearchContext = createContext<MarketplaceSearchContextType | undefined>(undefined);

export const MarketplaceSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [lastQuery, setLastQuery] = useState('');
  return (
    <MarketplaceSearchContext.Provider value={{ filters, setFilters, lastQuery, setLastQuery }}>
      {children}
    </MarketplaceSearchContext.Provider>
  );
};

export function useMarketplaceSearch() {
  const ctx = useContext(MarketplaceSearchContext);
  if (!ctx) throw new Error('useMarketplaceSearch must be used within MarketplaceSearchProvider');
  return ctx;
} 