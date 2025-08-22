# react-eventsource-hook

> React hook for Server-Sent Events with custom headers support

[![npm version](https://img.shields.io/npm/v/react-eventsource-hook.svg)](https://www.npmjs.com/package/react-eventsource-hook)
[![Downloads/week](https://img.shields.io/npm/dw/react-eventsource-hook.svg)](https://www.npmjs.com/package/react-eventsource-hook)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A simple React hook for Server-Sent Events with the key feature that native EventSource lacks: **custom headers support**.

Perfect for authenticated Server-Sent Events, API keys, and any scenario where you need to send headers with your SSE connection.

## Installation

```bash
npm install react-eventsource-hook
```

## Quick Start

```tsx
import React from 'react'
import { useEventSource } from 'react-eventsource-hook'

function ServerUpdates() {
  const { readyState, close, reconnect } = useEventSource({
    url: '/api/events',
    headers: {
      'Authorization': 'Bearer your-token',
      'X-API-Key': 'your-api-key'
    },
    onmessage: (message) => {
      console.log('Received:', message.data)
    },
    onerror: (error) => {
      console.error('SSE Error:', error)
    }
  })

  const status = ['CONNECTING', 'OPEN', 'CLOSED'][readyState]

  return (
    <div>
      <p>Connection: {status}</p>
      <button onClick={close}>Close</button>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  )
}
```

## API Reference

### `useEventSource(options)`

#### Options

| Property    | Type                                      | Required | Description                           |
|-------------|-------------------------------------------|----------|---------------------------------------|
| `url`       | `string`                                  | Yes      | Server-Sent Events endpoint URL       |
| `headers`   | `Record<string, string>`                  | No       | Custom headers (auth, API keys, etc.) |
| `method`    | `string`                                  | No       | HTTP method (defaults to 'GET')       |
| `body`      | `string \| FormData`                      | No       | Request body (rarely needed for SSE)  |
| `onmessage` | `(message: EventSourceMessage) => void`  | No       | Message event handler                 |
| `onopen`    | `(response: Response) => void`            | No       | Connection open handler               |
| `onerror`   | `(error: unknown) => void`                | No       | Error handler                         |
| `fetch`     | `typeof window.fetch`                     | No       | Custom fetch implementation           |

#### Return Values

| Property     | Type         | Description                                            |
|--------------|--------------|--------------------------------------------------------|
| `readyState` | `number`     | Connection state: 0=CONNECTING, 1=OPEN, 2=CLOSED      |
| `close`      | `() => void` | Manually close the connection                          |
| `reconnect`  | `() => void` | Close current connection and immediately reconnect     |

## Examples

### Authenticated Events

```tsx
useEventSource({
  url: '/api/user-notifications',
  headers: {
    'Authorization': `Bearer ${userToken}`
  },
  onmessage: (msg) => {
    const notification = JSON.parse(msg.data)
    showNotification(notification)
  }
})
```

### POST with Body (Advanced)

```tsx
useEventSource({
  url: '/api/stream',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': userId
  },
  body: JSON.stringify({ 
    channels: ['updates', 'alerts'] 
  }),
  onmessage: handleStreamMessage
})
```

### Connection Management

```tsx
function ChatStream() {
  const { readyState, close, reconnect } = useEventSource({
    url: '/api/chat-stream',
    headers: { 'Authorization': `Bearer ${token}` },
    onmessage: (msg) => addMessage(JSON.parse(msg.data)),
    onerror: (err) => console.error('Chat stream error:', err)
  })

  const isConnected = readyState === 1

  return (
    <div>
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <button onClick={reconnect} disabled={readyState === 0}>
        Reconnect
      </button>
      
      <button onClick={close}>
        Disconnect
      </button>
    </div>
  )
}
```

## Why This Hook?

- **Native EventSource limitation**: Cannot send custom headers
- **This hook solves that**: Built on `@microsoft/fetch-event-source` which supports headers
- **React-friendly**: Manages connection lifecycle with useEffect
- **Simple API**: Familiar EventSource-like interface
- **TypeScript**: Full type safety out of the box

## License

MIT License. See [LICENSE](./LICENSE) for details.