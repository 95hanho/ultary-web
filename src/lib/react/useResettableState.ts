'use client';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
/** Reset local edits when their source changes, before committing stale UI for an extra frame.
 * resetWhen=false preserves values during close animations but still observes dependency changes.
 */
export function useResettableState<T>(
  initial: T | (() => T),
  dependencies: readonly unknown[],
  resetWhen = true,
): [T, Dispatch<SetStateAction<T>>] {
  const readInitial = () => (typeof initial === 'function' ? (initial as () => T)() : initial);
  const [snapshot, setSnapshot] = useState(() => ({ dependencies, value: readInitial() }));
  let current = snapshot;
  if (
    snapshot.dependencies.length !== dependencies.length ||
    dependencies.some((value, i) => !Object.is(value, snapshot.dependencies[i]))
  ) {
    current = { dependencies, value: resetWhen ? readInitial() : snapshot.value };
    setSnapshot(current);
  }
  const setValue = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    setSnapshot((previous) => ({
      ...previous,
      value: typeof action === 'function' ? (action as (value: T) => T)(previous.value) : action,
    }));
  }, []);
  return [current.value, setValue];
}
