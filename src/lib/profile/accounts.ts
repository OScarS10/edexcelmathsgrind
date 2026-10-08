import { useSyncExternalStore } from "react";

export const USERS = ["Oscar", "Jayden", "Aditya"] as const;
export type UserName = (typeof USERS)[number];

export const DEFAULT_USER: UserName = "Oscar";

const ACTIVE_USER_KEY = "edexcel-active-user";
export const LEGACY_PROFILE_KEY = "edexcel-student-profile";
export const ACCOUNT_SWITCH_EVENT = "account-switch";

function readRaw(): string {
  try {
    return window.localStorage.getItem(ACTIVE_USER_KEY) || "";
  } catch {
    return "";
  }
}

export function getActiveUser(): UserName {
  const raw = readRaw();
  return (USERS as readonly string[]).includes(raw)
    ? (raw as UserName)
    : DEFAULT_USER;
}

export function setActiveUser(user: UserName) {
  try {
    window.localStorage.setItem(ACTIVE_USER_KEY, user);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(ACCOUNT_SWITCH_EVENT));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("profile-update"));
}

export function profileKeyFor(user: UserName): string {
  return `edexcel-student-profile:${user}`;
}

export function inProgressSessionKey(): string {
  return `edexcel-practice-session:${getActiveUser()}`;
}

function subscribe(onChange: () => void) {
  window.addEventListener(ACCOUNT_SWITCH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ACCOUNT_SWITCH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readServer(): UserName {
  return DEFAULT_USER;
}

export function useActiveUserSnapshot(): UserName {
  return useSyncExternalStore(subscribe, getActiveUser, readServer);
}