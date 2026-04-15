import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to the API server's WebSocket
    const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
      transports: ["websocket"],
      // You could add auth token here in the future
    });

    socketInstance.on("connect", () => {
      setConnected(true);
      console.log("Socket connected:", socketInstance.id);
      
      // If user is logged in, join their private room
      if (user?.id) {
        socketInstance.emit("join-room", user.id);
      }
    });

    socketInstance.on("notification", (data: { title: string; message: string; type?: string }) => {
      toast({
        title: data.title,
        description: data.message,
        variant: data.type === "urgent" ? "destructive" : "default",
      });
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id, toast]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
