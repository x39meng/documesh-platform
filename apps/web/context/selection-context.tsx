
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SelectionContextType {
  highlightedBbox: number[] | null;
  setHighlightedBbox: (bbox: number[] | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [highlightedBbox, setHighlightedBbox] = useState<number[] | null>(null);

  return (
    <SelectionContext.Provider value={{ highlightedBbox, setHighlightedBbox }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
