"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import { LocationPing } from "../types/api";

export const useRealtimeLocation = (childId: string | null, onUpdate: (payload: LocationPing) => void) => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!childId) return;
    let socket: Socket | null = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket?.emit("parent:subscribe", { childId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("location:push", onUpdate);

    return () => {
      socket?.disconnect();
      socket = null;
      setConnected(false);
    };
  }, [childId, onUpdate]);

  return { connected };
};


