import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Zap, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user as Parameters<typeof login>[1]);
        if (res.user.role === "student") setLocation("/student/dashboard");
        else if (res.user.role === "recruiter") setLocation("/recruiter/dashboard");
        else setLocation("/admin/dashboard");
        toast({ title: `Welcome back, ${res.user.name}` });
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Check your email and password.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <Link href="/">
            <div className="flex items-center gap-2.5 mb-16 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight gradient-text font-serif">HireLoop</span>
            </div>
          </Link>
          <h2 className="text-4xl font-bold mb-4 font-serif leading-tight">Your career journey<br /><span className="gradient-text">starts here</span></h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
            AI-powered tools to help you land your dream job. Resume analysis, mock interviews, and real-time tracking.
          </p>
          <div className="mt-12 space-y-4">
            {["AI Resume Score", "Mock Interviews", "Application Tracking", "Placement Analytics"].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" data-testid="link-back-home">
                <ArrowLeft size={14} /> Back to home
              </button>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold font-serif">Sign in to HireLoop</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-3">Enter your credentials to continue</p>
            {/* FR-108: Placement Cell / Admin login entry point */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-chart-3/10 border border-chart-3/20 w-fit"
              data-testid="admin-login-hint"
            >
              <ShieldCheck size={13} className="text-chart-3 shrink-0" />
              <span className="text-xs text-chart-3 font-medium">Placement Cell / Admin? Use your admin credentials below.</span>
            </motion.div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" type="email" data-testid="input-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter password"
                            type={showPass ? "text" : "password"}
                            data-testid="input-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  data-testid="button-submit-login"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </motion.button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => window.location.href = "/api/v1/auth/google"}
              className="w-full py-2.5 px-4 bg-secondary/50 border border-border rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 hover:bg-secondary transition-colors"
              data-testid="button-google-login"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V12.6505H13.8436C13.635 13.7755 13.0009 14.73 12.0477 15.3682V18.7909H14.9564C16.6582 17.2255 17.64 14.91 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.7909L12.0477 12.3682C11.2418 12.9082 10.2109 13.2273 9 13.2273C6.65591 13.2273 4.67182 11.6373 3.96409 9.50727H0.957273V11.8382C2.44091 14.7832 5.48182 16.8136 9 18Z" fill="#34A853"/>
                <path d="M3.96409 9.50727C3.78409 8.96727 3.68182 8.39045 3.68182 7.79545C3.68182 7.20045 3.78409 6.62364 3.96409 6.08364V3.75273H0.957273C0.347727 4.96636 0 6.34091 0 7.79545C0 9.25 0.347727 10.6245 0.957273 11.8382L3.96409 9.50727Z" fill="#FBBC05"/>
                <path d="M9 3.57273C10.3214 3.57273 11.5077 4.02545 12.4405 4.91727L15.0218 2.33591C13.4632 0.887727 11.4259 0 9 0C5.48182 0 2.44091 2.03045 0.957273 4.97545L3.96409 7.30636C4.67182 5.17636 6.65591 3.57273 9 3.57273Z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </motion.button>

            <p className="text-center text-sm text-muted-foreground mt-5">
              No account?{" "}
              <Link href="/register">
                <span className="text-primary font-medium cursor-pointer hover:underline" data-testid="link-register">Create one</span>
              </Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Demo accounts:</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>🎓 Student: student@demo.com / demo123</p>
              <p>🏢 Recruiter: recruiter@demo.com / demo123</p>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-chart-3/10 border border-chart-3/20 w-fit">
                <ShieldCheck size={11} className="text-chart-3" />
                <p className="text-chart-3 font-medium" data-testid="admin-demo-hint">Placement Cell: admin@demo.com / demo123</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
