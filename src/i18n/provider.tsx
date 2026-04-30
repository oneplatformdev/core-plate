'use client';

import * as React from 'react';

import { defaultPlateMessages, type PlateMessageKey, type PlateMessages, ukPlateMessages } from '@/i18n/messages';

type PlateI18nContextValue = {
  t: (key: PlateMessageKey) => string;
};

const PlateI18nContext = React.createContext<PlateI18nContextValue>({
  t: (key) => defaultPlateMessages[key],
});

export function PlateI18nProvider({
  children,
  locale = 'uk',
  messages,
}: {
  children: React.ReactNode;
  locale?: 'en' | 'uk';
  messages?: PlateMessages;
}) {
  const baseMessages = locale === 'uk' ? ukPlateMessages : defaultPlateMessages;

  const merged = React.useMemo(
    () => ({ ...baseMessages, ...(messages ?? {}) }),
    [baseMessages, messages]
  );

  const value = React.useMemo<PlateI18nContextValue>(
    () => ({
      t: (key) => merged[key],
    }),
    [merged]
  );

  return (
    <PlateI18nContext.Provider value={value}>
      {children}
    </PlateI18nContext.Provider>
  );
}

export function usePlateI18n() {
  return React.useContext(PlateI18nContext);
}
