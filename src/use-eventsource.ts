import { useState, useEffect, useRef, useCallback } from "react";
import { fetchEventSource, type EventSourceMessage } from "@microsoft/fetch-event-source";

// Options mirror native EventSource plus Fetch flexibility
export interface UseEventSourceOptions {
  url: string;
  withCredentials?: boolean;
  init?: RequestInit;
  fetch?: typeof window.fetch;
  retryIntervalMs?: number;
  maxRetryIntervalMs?: number;
  pauseOnHidden?: boolean;

  onopen?: (response: Response) => void;
  onmessage?: (message: EventSourceMessage) => void;
  onerror?: (error: unknown) => void;
  onclose?: () => void;
}

// Return values mirror EventSource state and give imperative controls
export interface UseEventSourceResult {
  readyState: 0 | 1 | 2;
  lastEventId: string;
  error?: any;
  events: EventSourceMessage[];
  close: () => void;
  reconnect: () => void;
}

export function useEventSource(
  options: UseEventSourceOptions
): UseEventSourceResult {
  const {
    url,
    withCredentials = false,
    init,
    fetch: customFetch,
    retryIntervalMs,
    maxRetryIntervalMs,
    pauseOnHidden = true,
    onopen: onOpen,
    onmessage: onMessage,
    onerror: onError,
    onclose: onClose,
  } = options;

  const [readyState, setReadyState] = useState<0 | 1 | 2>(0);
  const [lastEventId, setLastEventId] = useState<string>("");
  const [error, setError] = useState<any>();
  const [events, setEvents] = useState<EventSourceMessage[]>([]);

  const controllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef<number>(0);
  const onOpenRef = useRef<UseEventSourceOptions["onopen"]>(undefined);
  const onMessageRef = useRef<UseEventSourceOptions["onmessage"]>(undefined);
  const onErrorRef = useRef<UseEventSourceOptions["onerror"]>(undefined);
  const onCloseRef = useRef<UseEventSourceOptions["onclose"]>(undefined);

  // Keep latest handlers without changing the start() identity
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const start = useCallback(() => {
    // Abort existing connection if any
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setReadyState(0); // CONNECTING

    // Prepare RequestInit, honoring withCredentials via fetch credentials
    const requestInit: RequestInit = { ...init };
    if (withCredentials && !requestInit.credentials) {
      requestInit.credentials = "include";
    }

    // Normalize headers to plain object and include Last-Event-ID
    const headersRecord: Record<string, string> = {};
    const existing = new Headers(requestInit.headers ?? {});
    existing.forEach((value, key) => {
      headersRecord[key] = value;
    });
    if (lastEventId) {
      headersRecord["Last-Event-ID"] = lastEventId;
    }

    fetchEventSource(url, {
      ...requestInit,
      headers: headersRecord,
      signal: controller.signal,
      fetch: customFetch,
      async onopen(response) {
        setReadyState(1); // OPEN
        retryCountRef.current = 0;
        onOpenRef.current?.(response);
      },
      onmessage(message) {
        setLastEventId(message.id ?? "");
        setEvents((prev) => [...prev, message]);
        onMessageRef.current?.(message);
      },
      onerror(err) {
        setError(err);
        onErrorRef.current?.(err);
        setReadyState(2); // CLOSED
        // retry logic
        if (retryIntervalMs != null) {
          const delay = Math.min(
            retryIntervalMs * 2 ** retryCountRef.current,
            maxRetryIntervalMs ?? Infinity
          );
          retryCountRef.current += 1;
          setTimeout(() => {
            if (!controller.signal.aborted) start();
          }, delay);
        } else {
          throw err;
        }
      },
      onclose() {
        setReadyState(2); // CLOSED
        onCloseRef.current?.();
      },
    });
  }, [
    url,
    init,
    customFetch,
    withCredentials,
    retryIntervalMs,
    maxRetryIntervalMs,
  ]);

  // Auto-start on mount and options change
  useEffect(() => {
    start();
    return () => {
      controllerRef.current?.abort();
    };
  }, [start]);

  // Pause/resume on visibility
  useEffect(() => {
    if (!pauseOnHidden) return;
    const handler = () => {
      if (document.hidden) {
        controllerRef.current?.abort();
      } else {
        start();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
    };
  }, [pauseOnHidden, start]);

  const close = useCallback(() => {
    controllerRef.current?.abort();
    setReadyState(2); // CLOSED
  }, []);

  const reconnect = useCallback(() => {
    start();
  }, [start]);

  return { readyState, lastEventId, error, events, close, reconnect };
}
