import { useSyncExternalStore } from 'react';
import { parseRoute, type Route } from '../router';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const getHash = () => window.location.hash;

export function useHashRoute(): Route {
  // The snapshot is the raw string so React compares it by value; parsing happens in render.
  return parseRoute(useSyncExternalStore(subscribe, getHash));
}
