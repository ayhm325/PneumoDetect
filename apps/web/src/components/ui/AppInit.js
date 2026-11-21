"use client";
import { useEffect } from "react";

// استيراد الدوال من نفس ملف layout.js
function applyThemeFromStorage() {
  try {
    const theme = ["light", "dark"].includes(localStorage.getItem("app-theme"))
      ? localStorage.getItem("app-theme")
      : "light";
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
  } catch (e) {
    console.warn("Theme initialization failed", e);
  }
}

function blockDevWebSocket() {
  const OriginalWS = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    try {
      if (
        typeof url === "string" &&
        (url.includes(":5500") || url.includes("127.0.0.1:5500") || url.includes("localhost:5500"))
      ) {
        console.info("Blocked LiveReload WebSocket:", url);
        return {
          addEventListener: () => {},
          removeEventListener: () => {},
          close: () => {},
          send: () => {},
          readyState: 3,
        };
      }
    } catch (e) {}
    return new OriginalWS(url, protocols);
  };
  try {
    window.WebSocket.prototype = OriginalWS.prototype;
    ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(
      (k) => (window.WebSocket[k] = OriginalWS[k])
    );
  } catch {}
}

function applyMetaThemeColors() {
  const root = document.documentElement;
  const readVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const resolveVar = (...names) => names.map(readVar).find(Boolean) || "";
  const ensureMeta = (media) => {
    let el = document.querySelector(`meta[name="theme-color"][media="${media}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "theme-color");
      el.setAttribute("media", media);
      document.head.appendChild(el);
    }
    return el;
  };
  const applyColors = () => {
    const light = resolveVar("--color-bright-500", "--color-bright", "--color-primary-500");
    const dark = resolveVar("--color-background-dark", "--color-neutral", "--color-background");
    if (light) ensureMeta("(prefers-color-scheme: light)").setAttribute("content", light);
    if (dark) ensureMeta("(prefers-color-scheme: dark)").setAttribute("content", dark);
  };
  applyColors();
  ["(prefers-color-scheme: light)", "(prefers-color-scheme: dark)"].forEach((media) => {
    const mql = window.matchMedia(media);
    if (mql.addEventListener) mql.addEventListener("change", applyColors);
    else if (mql.addListener) mql.addListener(applyColors);
  });
}

export default function AppInit() {
  useEffect(() => {
    applyThemeFromStorage();
    blockDevWebSocket();
    applyMetaThemeColors();
  }, []);
  return null;
}