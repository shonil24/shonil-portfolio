/**
 * Optional, privacy-friendly website analytics for static hosting.
 *
 * To activate it, create a free GoatCounter site and paste its count endpoint
 * below, for example: https://your-code.goatcounter.com/count
 *
 * The empty value is intentional: the portfolio never sends analytics data
 * until the owner chooses a GoatCounter endpoint.
 */
const GOATCOUNTER_ENDPOINT = "";

type GoatCounter = {
  count: (options: { path: string; title?: string; referrer?: string }) => void;
};

declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

let loaded = false;
let lastPath: string | undefined;

export function initAnalytics(): void {
  if (loaded || !GOATCOUNTER_ENDPOINT || typeof document === "undefined")
    return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = GOATCOUNTER_ENDPOINT;
  document.head.appendChild(script);
  loaded = true;
}

/**
 * GoatCounter automatically records the first page load. This function adds
 * pageviews for route changes made by the client-side router.
 */
export function trackRoute(path: string): void {
  if (!GOATCOUNTER_ENDPOINT || path === lastPath) return;

  const previousPath = lastPath;
  lastPath = path;
  if (!previousPath || typeof window === "undefined") return;

  const send = () => {
    window.goatcounter?.count({
      path,
      title: document.title,
      referrer: document.referrer,
    });
  };

  // The external script may still be loading when a route changes.
  if (window.goatcounter?.count) {
    send();
  } else {
    window.setTimeout(send, 1000);
  }
}
