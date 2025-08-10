# react-eventsource-hook

> React hook for the EventSource interface (Server-Sent Events) with retry backoff, pause on hidden, and reconnect/close controls.

[![npm version](https://img.shields.io/npm/v/react-eventsource-hook.svg)](https://www.npmjs.com/package/react-eventsource-hook)
[![Downloads/week](https://img.shields.io/npm/dw/react-eventsource-hook.svg)](https://www.npmjs.com/package/react-eventsource-hook)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

<br />

## Installation

Install:

```bash
npm install react-eventsource-hook
```

<br />

## Quick Start

```tsx
import React from 'react'
import { useEventSource } from 'react-eventsource-hook'

function ServerTime() {
  const { readyState, events, error } = useEventSource({
    url: '/api/time-stream',
    onmessage: (msg) => console.log('Server time:', msg.data),
  })

  return (
    <div>
      <p>Status: {['CONNECTING', 'OPEN', 'CLOSED'][readyState]}</p>
      {error && <p>Error: {error.message}</p>}
      <ul>
        {events.map((msg, idx) => (
          <li key={idx}>{msg.data}</li>
        ))}
      </ul>
    </div>
  )
}
```

<br />

## API Reference

### `useEventSource(options)`

Connects to a Server-Sent Events endpoint using the Fetch API under the hood. Returns connection state, event history, and control functions.

#### Options (Type: `UseEventSourceOptions`)

| Property             | Type                                    | Default        | Description                                                |
| -------------------- | --------------------------------------- | -------------- | ---------------------------------------------------------- |
| `url`                | `string`                                | —              | SSE endpoint URL                                           |
| `withCredentials`    | `boolean`                               | `false`        | Send cookies/credentials if set                            |
| `init`               | `RequestInit`                           | —              | Fetch options: method, headers, body, etc.                 |
| `fetch`              | `typeof fetch`                          | `window.fetch` | Custom fetch implementation                                |
| `retryIntervalMs`    | `number`                                | —              | Initial retry delay in ms; exponential backoff if provided |
| `maxRetryIntervalMs` | `number`                                | —              | Maximum retry delay in ms                                  |
| `pauseOnHidden`      | `boolean`                               | `true`         | Abort and reconnect when page visibility changes           |
| `onopen`             | `(response: Response) => void`          | —              | Callback after connection opens                            |
| `onmessage`          | `(message: EventSourceMessage) => void` | —              | Callback on each SSE message                               |
| `onerror`            | `(error: unknown) => void`              | —              | Callback on error; hook will close connection              |
| `onclose`            | `() => void`                            | —              | Callback when connection closes                            |

#### Return Values (Type: `UseEventSourceResult`)

| Property      | Type                   | Description                                            |
| ------------- | ---------------------- | ------------------------------------------------------ |
| `readyState`  | `0 \| 1 \| 2`          | Connection state: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED |
| `lastEventId` | `string`               | `Last-Event-ID` header value from last message         |
| `error`       | `any \| undefined`     | Last error encountered (if any)                        |
| `events`      | `EventSourceMessage[]` | Array of all received messages                         |
| `close()`     | `() => void`           | Manually close the SSE connection                      |
| `reconnect()` | `() => void`           | Abort and immediately re-open the connection           |

<br />

## Advanced Usage

#### Custom Headers & POST Body

```tsx
useEventSource({
  url: '/api/stream',
  init: {
    method: 'POST',
    headers: { 'X-Auth-Token': 'abc123' },
    body: JSON.stringify({ channel: 'updates' }),
  }
})
```

#### Exponential Backoff

```tsx
useEventSource({
  url: '/api/updates',
  retryIntervalMs: 1000,      // start at 1s
  maxRetryIntervalMs: 30_000, // cap at 30s
})
```

#### Raw Event Handling

```tsx
useEventSource({
  url: '/api/binary-stream',
  onmessage: (msg) => {
    const blob = new Blob([msg.data]);
    // process binary data
  }
})
```

<br />

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
