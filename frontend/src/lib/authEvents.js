const UNAUTHORIZED = 'sphere:unauthorized';

export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED));
}

export function onUnauthorized(handler) {
  window.addEventListener(UNAUTHORIZED, handler);
  return () => window.removeEventListener(UNAUTHORIZED, handler);
}
