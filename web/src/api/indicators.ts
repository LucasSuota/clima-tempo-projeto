import { request } from './client';
import type { Indicators } from './types';

// The endpoint is not on main yet (open PR #34); until it is merged, this answers 404.
export function getIndicators(): Promise<Indicators> {
  return request('/indicators');
}
