import { useEffect, useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  
  const hasVerified = useRef(false);

  useEffect(() => {
    const fn = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      const params = new URLSearchParams(searchString);
      const sessionId = params.get("session_id");
      const type = params.get("type");

      if (!sessionId) {
        setError("Invalid payment session.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE}/api/payments/verify-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Verification failed");
        
        toast({ title: "Payment Successful!" });
        
        // Brief delay before redirecting
        setTimeout(() => {
          if (type === "listing_fee") {
            setLocation("/recruiter/jobs/new");
          } else {
            setLocation("/student/dashboard");
          }
        }, 3000);
      } catch (err: any) {
        setError(err.message || "Something went wrong tracking the payment");
        toast({ title: "Verification Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fn();
  }, [searchString, setLocation, toast]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-bold">Verifying payment...</h2>
            <p className="text-muted-foreground mt-2">Checking with secure gateway</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-destructive font-bold text-xl">!</span>
            </div>
            <h2 className="text-xl font-bold">Payment Verification Failed</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
            <button 
              onClick={() => setLocation("/")}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Return Home
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Payment Confirmed</h2>
            <p className="text-muted-foreground">Redirecting you back to your workspace...</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
