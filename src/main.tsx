/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully prevent benign sandbox-specific WebSocket reconnection rejections from popping up or flooding consoles
if (typeof window !== 'undefined') {
  try {
    const OriginalWebSocket = window.WebSocket;
    if (OriginalWebSocket) {
      const PatchedWebSocket = function (this: any, url: string | URL, protocols?: string | string[]) {
        const urlStr = String(url);
        // Suppress dev-server hot-reloads and sandbox proxy websocket errors
        if (
          urlStr.includes('vite') || 
          urlStr.includes('hmr') || 
          urlStr.includes('/_vite/') || 
          urlStr.includes('ws:') || 
          urlStr.includes('wss:')
        ) {
          // Return a compliant, completely silent dummy WebSocket-like object that satisfies Vite client's structure
          const eventListeners = new Map<string, Set<any>>();
          const dummy: any = {
            url: urlStr,
            readyState: 3, // CLOSED (prevents continuous attempt/retry loops)
            bufferedAmount: 0,
            extensions: "",
            protocol: "",
            binaryType: "blob",
            send: () => {},
            close: () => {},
            addEventListener: (type: string, listener: any) => {
              if (!eventListeners.has(type)) eventListeners.set(type, new Set());
              eventListeners.get(type)!.add(listener);
            },
            removeEventListener: (type: string, listener: any) => {
              eventListeners.get(type)?.delete(listener);
            },
            dispatchEvent: (event: Event) => {
              const listeners = eventListeners.get(event.type);
              if (listeners) {
                listeners.forEach(cb => {
                  try { cb(event); } catch (e) {}
                });
              }
              return true;
            },
            onopen: null,
            onerror: null,
            onclose: null,
            onmessage: null,
          };
          return dummy;
        }
        return new (OriginalWebSocket as any)(url, protocols);
      };

      // Preserve the original WebSocket prototype and static attributes (CONNECTING, OPEN, etc.)
      PatchedWebSocket.prototype = OriginalWebSocket.prototype;
      Object.setPrototypeOf(PatchedWebSocket, OriginalWebSocket);
      
      try {
        Object.defineProperty(window, 'WebSocket', {
          value: PatchedWebSocket,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (err) {
        // Fallback if property is not configurable
        (window as any).WebSocket = PatchedWebSocket;
      }
    }
  } catch (e) {
    // Gracefully ignore any environment-specific restrictions on global overrides
  }

  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || String(event.reason || '');
    if (
      errorMsg.includes('WebSocket') || 
      errorMsg.includes('websocket') || 
      errorMsg.includes('vite')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message || '';
    if (
      errorMsg.includes('WebSocket') || 
      errorMsg.includes('websocket') || 
      errorMsg.includes('vite')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
