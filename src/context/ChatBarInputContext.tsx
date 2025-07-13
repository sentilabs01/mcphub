import React, { createContext, useContext, useState } from 'react';

const ChatBarInputContext = createContext<{
  input: string;
  setInput: (val: string) => void;
}>({ input: '', setInput: () => {} });

export const useChatBarInput = () => useContext(ChatBarInputContext);

export const ChatBarInputProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [input, setInput] = useState('');
  return (
    <ChatBarInputContext.Provider value={{ input, setInput }}>
      {children}
    </ChatBarInputContext.Provider>
  );
}; 