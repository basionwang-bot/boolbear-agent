// Polyfills for WeChat browser compatibility (must be first imports)
import 'core-js/stable/structured-clone';
import 'core-js/stable/object/has-own';
import 'core-js/stable/array/at';
import 'core-js/stable/array/find-last';
import 'core-js/stable/string/replace-all';

import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Wrap entire initialization in try-catch for WeChat browser debugging
try {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30000,
      },
    },
  });

  const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return;
    if (typeof window === "undefined") return;
    const isUnauthorized = error && error.message === UNAUTHED_ERR_MSG;
    if (!isUnauthorized) return;
    window.location.href = getLoginUrl();
  };

  queryClient.getQueryCache().subscribe(function(event) {
    if (event && event.type === "updated" && event.action && event.action.type === "error") {
      const error = event.query && event.query.state ? event.query.state.error : null;
      if (error) {
        redirectToLoginIfUnauthorized(error);
        console.error("[API Query Error]", error);
      }
    }
  });

  queryClient.getMutationCache().subscribe(function(event) {
    if (event && event.type === "updated" && event.action && event.action.type === "error") {
      const error = event.mutation && event.mutation.state ? event.mutation.state.error : null;
      if (error) {
        redirectToLoginIfUnauthorized(error);
        console.error("[API Mutation Error]", error);
      }
    }
  });

  // Use a safe fetch wrapper for WeChat compatibility
  const safeFetch = (typeof window !== "undefined" && typeof window.fetch === "function")
    ? window.fetch.bind(window)
    : fetch;

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch(input: RequestInfo | URL, init?: RequestInit) {
          return safeFetch(input, Object.assign({}, init || {}, {
            credentials: "include" as RequestCredentials,
          }));
        },
      }),
    ],
  });

  const rootEl = document.getElementById("root");
  if (rootEl) {
    createRoot(rootEl).render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    );
  }
} catch (e: unknown) {
  // If React fails to initialize, show a basic error page
  console.error("[Init Error]", e);
  const rootEl = document.getElementById("root");
  if (rootEl) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const errStack = e instanceof Error ? (e.stack || "") : String(e);
    rootEl.innerHTML =
      '<div style="padding:32px;font-family:system-ui;text-align:center;">' +
      '<h2 style="color:#e53e3e;">应用初始化失败</h2>' +
      '<p style="color:#666;font-size:14px;">' + errMsg + '</p>' +
      '<pre style="text-align:left;font-size:11px;background:#f0f0f0;padding:16px;border-radius:8px;overflow:auto;max-height:200px;">' +
      errStack + '</pre>' +
      '<p style="color:#999;font-size:11px;margin-top:8px;">UA: ' + navigator.userAgent + '</p>' +
      '<button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;border-radius:8px;background:#8B6914;color:white;border:none;">重新加载</button>' +
      '</div>';
  }
}
