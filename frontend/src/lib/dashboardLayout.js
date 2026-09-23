"use client";

import { useState, useCallback, useMemo } from "react";

/** @typedef {{ id: string, label: string, visible?: boolean, order?: number, locked?: boolean }} WidgetDef */

/**
 * @param {string} storageKey
 * @param {WidgetDef[]} defaults
 */
export function useDashboardLayout(storageKey, defaults) {
  const normalizedDefaults = useMemo(
    () =>
      defaults.map((w, i) => ({
        id: w.id,
        label: w.label,
        visible: w.visible !== false,
        order: w.order ?? i,
        locked: w.locked === true,
      })),
    [defaults]
  );

  const [layout, setLayout] = useState(() => {
    if (typeof window === "undefined") return normalizedDefaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return normalizedDefaults;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return normalizedDefaults;
      const byId = Object.fromEntries(normalizedDefaults.map((w) => [w.id, w]));
      const merged = saved
        .filter((s) => byId[s.id])
        .map((s, i) => ({
          ...byId[s.id],
          visible: s.visible !== false,
          order: s.order ?? i,
        }));
      normalizedDefaults.forEach((w) => {
        if (!merged.find((m) => m.id === w.id)) merged.push({ ...w, order: merged.length });
      });
      return merged.sort((a, b) => a.order - b.order);
    } catch {
      return normalizedDefaults;
    }
  });

  const persist = useCallback(
    (next) => {
      setLayout(next);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(next.map(({ id, visible, order }) => ({ id, visible, order })))
        );
      } catch {
        /* ignore quota errors */
      }
    },
    [storageKey]
  );

  const toggleVisible = useCallback(
    (id) => {
      persist(
        layout.map((w) => (w.id === id && !w.locked ? { ...w, visible: !w.visible } : w))
      );
    },
    [layout, persist]
  );

  const moveWidget = useCallback(
    (id, direction) => {
      const idx = layout.findIndex((w) => w.id === id);
      if (idx < 0) return;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= layout.length) return;
      if (layout[target].locked || layout[idx].locked) return;
      const next = [...layout];
      [next[idx], next[target]] = [next[target], next[idx]];
      persist(next.map((w, i) => ({ ...w, order: i })));
    },
    [layout, persist]
  );

  const reorderWidget = useCallback(
    (fromId, toId) => {
      if (fromId === toId) return;
      const fromIdx = layout.findIndex((w) => w.id === fromId);
      const toIdx = layout.findIndex((w) => w.id === toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const next = [...layout];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      persist(next.map((w, i) => ({ ...w, order: i })));
    },
    [layout, persist]
  );

  const resetLayout = useCallback(() => {
    persist(normalizedDefaults);
  }, [normalizedDefaults, persist]);

  const visibleWidgets = useMemo(
    () => layout.filter((w) => w.visible).sort((a, b) => a.order - b.order),
    [layout]
  );

  return {
    layout,
    visibleWidgets,
    toggleVisible,
    moveWidget,
    reorderWidget,
    resetLayout,
  };
}
