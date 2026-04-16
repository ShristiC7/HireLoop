import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Lock, CheckCircle, Zap, Building, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function RecruiterPayment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "card" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "listing_fee" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to initialize payment");
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Payment failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout requiredRole="recruiter">
      <div className="max-w-xl mx-auto">
        {step === "info" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-serif">Job Listing Fee</h1>
              <p className="text-muted-foreground text-sm mt-1">A one-time fee to post a campus job</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Building size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Campus Job Posting</p>
                  <p className="text-xs text-muted-foreground">Valid for 30 days · Unlimited applicants</p>
                </div>
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-bold">₹999</span>
                <span className="text-muted-foreground mb-1">/ listing</span>
              </div>
              <ul className="space-y-2 text-sm">
                {["Post to all eligible branches", "AI-powered candidate matching", "Interview scheduling tools", "Real-time applicant tracking", "Priority placement cell visibility"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm flex items-start gap-3">
              <Zap size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300">This is a <strong>sandbox</strong> payment environment. No real money will be charged. Use any 16-digit card number.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePay}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? "Redirecting..." : "Checkout securely with Stripe"} <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle size={40} className="text-green-400" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground mt-2">Your listing fee has been processed</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">₹999</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs text-primary">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid For</span>
                <span className="font-semibold">30 days</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/recruiter/jobs/new")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Post Your Job <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
