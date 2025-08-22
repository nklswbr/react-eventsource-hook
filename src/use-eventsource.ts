import { useState, useEffect, useRef } from "react";
import { fetchEventSource, type EventSourceMessage } from "@microsoft/fetch-event-source";

export interface UseEventSourceOptions {
  url: string;
  headers?: Record<string, string>;
  method?: string;
  body?: string | FormData;
  onmessage?: (message: EventSourceMessage) => void;
  onopen?: (response: Response) => void;
  onerror?: (error: unknown) => void;
  fetch?: typeof window.fetch;
}

export interface UseEventSourceResult {
  readyState: number;
  close: () => void;
  reconnect: () => void;
}

export function useEventSource(options: UseEventSourceOptions): UseEventSourceResult {
  const { url, headers, method, body, onmessage, onopen, onerror, fetch: customFetch } = options;
  const [readyState, setReadyState] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const connect = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setReadyState(0);

    fetchEventSource(url, {
      method: method || 'GET',
      headers: headers,
      body: body,
      signal: controller.signal,
      fetch: customFetch,
      
      async onopen(response) {
        setReadyState(1);
        onopen?.(response);
      },
      
      onmessage(message) {
        onmessage?.(message);
      },
      
      onerror(err) {
        setReadyState(2);
        onerror?.(err);
      },
    });
  };

  const close = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setReadyState(2);
    }
  };

  const reconnect = () => {
    connect();
  };

  useEffect(() => {
    connect();
    return () => {
      close();
    };
  }, [url, headers, method, body]);

  return {
    readyState,
    close,
    reconnect,
  };
}
