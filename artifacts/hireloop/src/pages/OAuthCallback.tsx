import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Decode JWT to get user roles and redirect accordingly
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        
        // Save token and user info
        login(token, {
          id: payload.userId,
          role: payload.role,
        } as any);

        toast({ title: "Successfully authenticated with Google" });

        // Redirect based on role
        if (payload.role === "student") setLocation("/student/dashboard");
        else if (payload.role === "recruiter") setLocation("/recruiter/dashboard");
        else if (payload.role === "admin") setLocation("/admin/dashboard");
      } catch (err) {
        console.error("Failed to parse token", err);
        toast({ title: "Authentication failed", variant: "destructive" });
        setLocation("/login");
      }
    } else {
      toast({ title: "Auth token not found", variant: "destructive" });
      setLocation("/login");
    }
  }, [login, setLocation, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-primary" size={24} />
          </div>
        </div>
        <h2 className="text-xl font-bold font-serif">Completing Sign-In...</h2>
        <p className="text-muted-foreground text-sm">Please wait while we finalize your account.</p>
      </motion.div>
    </div>
  );
}
