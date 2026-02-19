import { Preferences } from "@capacitor/preferences";

function canUseLocalStorage() {
  try {
    if (typeof window === "undefined") return false;
    const k = "__snake_flow_ls_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function getLocalItem(key: string): string | null {
  if (!canUseLocalStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setLocalItem(key: string, value: string) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function removeLocalItem(key: string) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function getPreferenceItem(key: string): Promise<string | null> {
  try {
    const res = await Preferences.get({ key });
    return typeof res?.value === "string" ? res.value : null;
  } catch {
    return null;
  }
}

export async function setPreferenceItem(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value });
  } catch {
    // ignore
  }
}

export async function removePreferenceItem(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch {
    // ignore
  }
}

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  const local = getLocalItem(key);
  if (local) {
    try {
      return JSON.parse(local) as T;
    } catch {
      // fallthrough
    }
  }

  const pref = await getPreferenceItem(key);
  if (pref) {
    try {
      return JSON.parse(pref) as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

export function setJsonBoth(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  setLocalItem(key, raw);
  void setPreferenceItem(key, raw);
}

export function removeBoth(key: string) {
  removeLocalItem(key);
  void removePreferenceItem(key);
}

