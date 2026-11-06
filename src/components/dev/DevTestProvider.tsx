'use client';

import { DevTestDock, type DevTestAction, type DevTestGroup } from '@/components/dev/DevTestDock';
import { ENABLE_DEV_TOOLS } from '@/lib/env.client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useLayoutEffect,
} from 'react';

type DevTestApi = {
  setGroup: (id: string, group: { title: string; actions: DevTestAction[] } | null) => void;
  setAdminAuthed: (authed: boolean | null) => void;
};

const DevTestContext = createContext<DevTestApi | null>(null);

export function DevTestProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Record<string, DevTestGroup>>({});
  const [adminAuthed, setAdminAuthed] = useState<boolean | null>(null);
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
  const api = useMemo(() => ({ setGroup, setAdminAuthed }), [setGroup]);
  const list = Object.values(groups);

  return (
    <DevTestContext.Provider value={api}>
      {children}
      {ENABLE_DEV_TOOLS ? <DevTestDock groups={list} adminAuthed={adminAuthed} /> : null}
    </DevTestContext.Provider>
  );
}

/** /admin 레이아웃이 서버에서 판정한 관리자 세션을 체험 도크에 넘긴다. */
export function useDevAdminSession(authed: boolean) {
  const ctx = useContext(DevTestContext);
  useLayoutEffect(() => {
    if (!ctx || !ENABLE_DEV_TOOLS) return;
    ctx.setAdminAuthed(authed);
    return () => ctx.setAdminAuthed(null);
  }, [ctx, authed]);
}

/** DEV 도구 설정이 켜진 경우에만 현재 페이지의 개발 버튼을 공통 패널에 붙인다. */
export function useDevTestActions(id: string, title: string, actions: DevTestAction[]) {
  const ctx = useContext(DevTestContext);
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });
  const signature = actions
    .map((action) => `${action.id}\0${action.label}\0${action.disabled ? 1 : 0}`)
    .join('\n');

  useEffect(() => {
    if (!ctx || !ENABLE_DEV_TOOLS) return;
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
