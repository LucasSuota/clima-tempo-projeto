import type { ReactNode } from 'react';
import type { AsyncState } from '../hooks/useAsync';
import { ErrorMessage } from './ErrorMessage';
import { Spinner } from './Spinner';

interface AsyncViewProps<T> {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
}

// Covers loading and error in one place; the page decides what "empty" means for its data.
export function AsyncView<T>({ state, children }: AsyncViewProps<T>) {
  if (state.error) return <ErrorMessage error={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return <Spinner />;
  return <>{children(state.data)}</>;
}
