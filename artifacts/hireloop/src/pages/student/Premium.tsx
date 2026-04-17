import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Lock, CheckCircle, Zap, Star, ArrowRight, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const plans = [
  {
    id: "premium_monthly",
    label: "Monthly",
    price: 299,
    duration: "month",
    badge: null,
    features: [
      "Unlimited AI mock interviews",
      "Priority job visibility",
      "Advanced resume analysis",
      "Interview tips & resources",
      "Direct recruiter connect",
    ],
  },
  {
    id: "premium_yearly",
    label: "Yearly",
    price: 2499,
    duration: "year",
    badge: "Best Value",
    features: [
      "Everything in Monthly",
      "Save ₹1,089 vs monthly",
      "AI career roadmap",
      "Exclusive webinars access",
      "1-on-1 mentor sessions (2/yr)",
    ],
  },
];

export default function StudentPremium() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState("premium_yearly");
  const [step, setStep] = useState<"plans" | "card" | "success">("plans");
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: selectedPlan }),
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
    <DashboardLayout requiredRole="student">
      <div className="max-w-xl mx-auto">
        {step === "plans" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
                <Crown size={12} /> Upgrade to Premium
              </div>
              <h1 className="text-2xl font-bold font-serif">Unlock Your Full Potential</h1>
              <p className="text-muted-foreground text-sm mt-2">Get unlimited AI tools and priority visibility to recruiters</p>
            </div>

            <div className="space-y-4">
              {plans.map(p => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedPlan(p.id)}
                  className={cn(
                    "relative p-5 rounded-2xl border-2 cursor-pointer transition-all",
                    selectedPlan === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                      {p.badge}
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold">{p.label} Plan</p>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-2xl font-bold">₹{p.price}</span>
                        <span className="text-muted-foreground text-sm mb-0.5">/ {p.duration}</span>
                      </div>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1", selectedPlan === p.id ? "border-primary bg-primary" : "border-border")}>
                      {selectedPlan === p.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={13} className="text-green-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm flex items-start gap-3">
              <Zap size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-300">This is a <strong>sandbox</strong> payment environment. No real charges. Use any 16-digit card number.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePay}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              <Star size={16} /> {loading ? "Redirecting..." : "Checkout securely with Stripe"} <ArrowRight size={16} />
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
              className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto"
            >
              <Crown size={40} className="text-amber-400" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold">You're Premium Now!</h2>
              <p className="text-muted-foreground mt-2">All premium features are unlocked for you</p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border text-left space-y-2 text-sm">
              {(() => {
                const plan = plans.find(p => p.id === selectedPlan);
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-semibold capitalize">{plan?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-semibold">₹{plan?.price}</span>
                    </div>
                  </>
                );
              })()}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs text-primary">{transactionId}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/student/ai-interview")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-cyan-500 text-white rounded-xl font-semibold"
            >
              <Zap size={16} /> Start AI Interview <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
