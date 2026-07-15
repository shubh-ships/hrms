import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

type EventHandler = (...args: any[]) => void;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const joinedTaskRooms = useRef<Set<string>>(new Set());
  const joinedUserRooms = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const socketUrl =
      apiBase.replace(/\/api\/.*$/i, "") || window.location.origin;

    socketRef.current = io(socketUrl, {
      auth: {
        token: token || null,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current.on("connect", () => {
      joinedUserRooms.current.forEach((userRoom) => {
        socketRef.current?.emit("joinUserRoom", {
          userId: userRoom.replace(/^user_/, ""),
        });
      });
      joinedTaskRooms.current.forEach((taskRoom) => {
        socketRef.current?.emit("joinTaskRoom", {
          taskId: taskRoom.replace(/^task_/, ""),
        });
      });
    });

    socketRef.current.on("connect_error", (err) => {
      console.warn("Socket connect_error", err);
    });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      try {
        socketRef.current?.disconnect();
      } catch (e) {
        // ignore
      }
      socketRef.current = null;
    };
  }, [connect]);

  const joinUserRoom = useCallback((userId: string) => {
    const room = `user_${userId}`;
    joinedUserRooms.current.add(room);
    socketRef.current?.emit("joinUserRoom", { userId });
  }, []);

  const leaveUserRoom = useCallback((userId: string) => {
    const room = `user_${userId}`;
    joinedUserRooms.current.delete(room);
    socketRef.current?.emit("leaveUserRoom", { userId });
  }, []);

  const joinTaskRoom = useCallback((taskId: string) => {
    const room = `task_${taskId}`;
    joinedTaskRooms.current.add(room);
    socketRef.current?.emit("joinTaskRoom", { taskId });
  }, []);

  const leaveTaskRoom = useCallback((taskId: string) => {
    const room = `task_${taskId}`;
    joinedTaskRooms.current.delete(room);
    socketRef.current?.emit("leaveTaskRoom", { taskId });
  }, []);

  const on = useCallback((event: string, handler: EventHandler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: EventHandler) => {
    if (handler) socketRef.current?.off(event, handler);
    else socketRef.current?.off(event);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  return {
    socket: socketRef,
    joinUserRoom,
    leaveUserRoom,
    joinTaskRoom,
    leaveTaskRoom,
    on,
    off,
    disconnect,
  } as const;
}

export default useSocket;
