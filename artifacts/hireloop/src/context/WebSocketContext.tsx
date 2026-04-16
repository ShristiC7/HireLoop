import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsConnected(false);
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL ?? (
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    );

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let isComponentMounted = true;

    const connect = () => {
      ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        if (isComponentMounted) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "APPLICATION_STATUS_UPDATE") {
            const statusMap: Record<string, string> = {
              shortlisted: "Shortlisted 🎯",
              interview: "Interview Scheduled 📅",
              offer: "Offer Received 🤝",
              rejected: "Not Selected",
            };

            toast({
              title: "Application Update",
              description: `Your application at ${data.company} is now: ${statusMap[data.status] || data.status}`,
              variant: data.status === "rejected" ? "destructive" : "default",
            });

            // Invalidate applications to trigger refresh
            queryClient.invalidateQueries({ queryKey: ["applications"] });
          }
        } catch (error) {
          console.error("Failed to parse websocket message", error);
        }
      };

      ws.onclose = () => {
        if (isComponentMounted) {
          setIsConnected(false);
          // Try to reconnect in 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [isAuthenticated, token, toast, queryClient]);

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
