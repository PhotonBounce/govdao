import { createContext, ReactNode, useContext, useState } from "react";
import { InfoModal } from "../components/InfoModal";

interface InfoModalContextValue {
  openInfo: (key: string) => void;
}

const InfoModalContext = createContext<InfoModalContextValue>({ openInfo: () => {} });

export function InfoModalProvider({ children }: { children: ReactNode }) {
  const [infoKey, setInfoKey] = useState<string | null>(null);
  return (
    <InfoModalContext.Provider value={{ openInfo: setInfoKey }}>
      {children}
      <InfoModal infoKey={infoKey} onClose={() => setInfoKey(null)} />
    </InfoModalContext.Provider>
  );
}

export function useInfoModal() {
  return useContext(InfoModalContext);
}
