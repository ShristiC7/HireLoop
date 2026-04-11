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

  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePay = async () => {
    if (!card.number || !card.expiry || !card.cvv || !card.name) {
      toast({ title: "Please fill all card details", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/payments/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "listing_fee",
          cardNumber: card.number,
          cardExpiry: card.expiry,
          cardCvv: card.cvv,
          cardName: card.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      setTransactionId(data.transactionId);
      setStep("success");
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
              onClick={() => setStep("card")}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold"
            >
              Continue to Payment <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        )}

        {step === "card" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold font-serif">Card Details</h1>
              <p className="text-muted-foreground text-sm mt-1">Sandbox mode — test card accepted</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Lock size={12} /> Secure payment simulation
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Card Number</label>
                <div className="relative">
                  <input
                    value={card.number}
                    onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={19}
                  />
                  <CreditCard size={16} className="absolute right-3 top-3.5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Expiry</label>
                  <input
                    value={card.expiry}
                    onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">CVV</label>
                  <input
                    value={card.cvv}
                    onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                    placeholder="123"
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={3}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Cardholder Name</label>
                <input
                  value={card.name}
                  onChange={e => setCard({ ...card, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-xl font-bold">₹999</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("info")}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary/30 transition-colors"
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePay}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={14} /> Pay ₹999
                  </>
                )}
              </motion.button>
            </div>
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
