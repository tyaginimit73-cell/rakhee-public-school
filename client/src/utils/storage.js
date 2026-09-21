// Web Storage can throw (sandboxed preview iframes, some private-browsing modes,
// disabled cookies). These helpers fail silently so a blocked Storage API
// never crashes the React render tree (which shows as a blank white page).
export function getStored(key, area = 'local') {
  try {
    const store = area === 'session' ? window.sessionStorage : window.localStorage;
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function setStored(key, value, area = 'local') {
  try {
    const store = area === 'session' ? window.sessionStorage : window.localStorage;
    store?.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function removeStored(key, area = 'local') {
  try {
    const store = area === 'session' ? window.sessionStorage : window.localStorage;
    store?.removeItem(key);
  } catch {
    /* storage unavailable — ignore */
  }
}
