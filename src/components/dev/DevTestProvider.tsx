'use client';

import {
  DevTestDock,
  type DevTestAction,
  type DevTestGroup,
} from '@/components/dev/DevTestDock';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type DevTestApi = {
  setGroup: (id: string, group: { title: string; actions: DevTestAction[] } | null) => void;
};

const DevTestContext = createContext<DevTestApi | null>(null);

export function DevTestProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Record<string, DevTestGroup>>({});
  const setGroup = useCallback<DevTestApi['setGroup']>((id, group) => {
    setGroups((prev) => {
      if (!group) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { id, title: group.title, actions: group.actions } };
    });
  }, []);
  const api = useMemo(() => ({ setGroup }), [setGroup]);
  const list = Object.values(groups);

  return (
    <DevTestContext.Provider value={api}>
      {children}
      {process.env.NODE_ENV === 'development' ? <DevTestDock groups={list} /> : null}
    </DevTestContext.Provider>
  );
}

/** 현재 페이지의 개발 버튼을 공통 패널에 붙인다. production 에서는 아무것도 하지 않는다. */
export function useDevTestActions(id: string, title: string, actions: DevTestAction[]) {
  const ctx = useContext(DevTestContext);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const signature = actions
    .map((action) => `${action.id}\0${action.label}\0${action.disabled ? 1 : 0}`)
    .join('\n');

  useEffect(() => {
    if (!ctx || process.env.NODE_ENV !== 'development') return;
    ctx.setGroup(id, {
      title,
      actions: actionsRef.current.map((action) => ({
        ...action,
        onClick: () => {
          const latest = actionsRef.current.find((item) => item.id === action.id);
          return latest?.onClick();
        },
      })),
    });
    return () => ctx.setGroup(id, null);
  }, [ctx, id, title, signature]);
}
