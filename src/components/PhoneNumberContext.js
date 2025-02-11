// hhNumberContext.js
import React, { createContext, useContext, useState } from 'react';

const hhNumberContext = createContext();

export const usehhNumber = () => useContext(hhNumberContext);

export const hhNumberProvider = ({ children }) => {
  const [hhNumber, sethhNumber] = useState('');

  return (
    <hhNumberContext.Provider value={{ hhNumber, sethhNumber }}>
      {children}
    </hhNumberContext.Provider>
  );
};