"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

/** Refresh the server-rendered menu when Django Channels reports a change. */
export default function LiveMenuSync({ branchId, socketBaseUrl }) {
  const router = useRouter();

  useEffect(() => {
    if (!branchId || !socketBaseUrl) return;

    let stopped = false;
    let socket = null;
    let reconnectTimer = null;
    let reconnectAttempt = 0;

    function connect() {
      if (stopped) return;
      const nextSocket = new WebSocket(
        `${socketBaseUrl}/ws/menu/?branch=${encodeURIComponent(branchId)}`
      );
      socket = nextSocket;

      nextSocket.onopen = () => {
        reconnectAttempt = 0;
        // Sync once after joining (and after reconnects) to cover changes made
        // between the server render and this WebSocket becoming active.
        router.refresh();
      };

      nextSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.name === "menu:updated") router.refresh();
        } catch {
          // Ignore messages that do not match the menu event format.
        }
      };

      nextSocket.onclose = () => {
        if (stopped || socket !== nextSocket) return;
        socket = null;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [branchId, router, socketBaseUrl]);

  return null;
}
