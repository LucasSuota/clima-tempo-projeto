import { request } from './client';
import type { Indicators } from './types';

export function getIndicators(): Promise<Indicators> {
  return request('/indicators');
}
