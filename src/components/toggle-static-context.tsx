'use client';

import * as React from 'react';

import { KEYS, type Value } from 'platejs';

const LIST_PLUGIN_KEY = 'listStyleType';

export const buildToggleIndex = (elements: Value): Map<string, string[]> => {
  const result = new Map<string, string[]>();
  let currentEnclosingToggles: [string, number][] = [];

  elements.forEach((element) => {
    const elementIndent = ((element as Record<string, unknown>)[KEYS.indent] as number) || 0;
    const elementIndentWithListCorrection =
      (element as Record<string, unknown>)[LIST_PLUGIN_KEY] && (element as Record<string, unknown>)[KEYS.indent]
        ? elementIndent - 1
        : elementIndent;

    currentEnclosingToggles = currentEnclosingToggles.filter(
      ([, indent]) => indent < elementIndentWithListCorrection
    );

    result.set(
      String(element.id),
      currentEnclosingToggles.map(([toggleId]) => toggleId)
    );

    if (element.type === KEYS.toggle) {
      currentEnclosingToggles.push([String(element.id), elementIndent]);
    }
  });

  return result;
};

interface IToggleStaticContext {
  openIds: Set<string>;
  toggle: (id: string) => void;
  isOpen: (id: string) => boolean;
}

const noop = () => undefined;

const ToggleStaticContext = React.createContext<IToggleStaticContext>({
  openIds: new Set(),
  toggle: noop,
  isOpen: () => false,
});

export const useToggleStatic = () => React.useContext(ToggleStaticContext);

export const ToggleStaticProvider: React.FC<{
  openIds: Set<string>;
  toggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ openIds, toggle, children }) => {
  const value = React.useMemo<IToggleStaticContext>(
    () => ({
      openIds,
      toggle,
      isOpen: (id: string) => openIds.has(id),
    }),
    [openIds, toggle]
  );

  return <ToggleStaticContext.Provider value={value}>{children}</ToggleStaticContext.Provider>;
};

export const filterClosedToggleChildren = (elements: Value, openIds: Set<string>): Value => {
  const index = buildToggleIndex(elements);
  return elements.filter((element) => {
    const enclosing = index.get(String(element.id)) || [];
    return enclosing.every((toggleId) => openIds.has(toggleId));
  });
};
