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
import { Zap, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
            <h1 className="text-2xl font-bold font-serif mb-2">Sign in to HireLoop</h1>
            <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
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
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => window.location.href = "/api/auth/google"}
              className="w-full py-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm"
              data-testid="button-google-login"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </motion.button>

            <p className="text-center text-sm text-muted-foreground mt-5">
              No account?{" "}
              <Link href="/register">
                <span className="text-primary font-medium cursor-pointer hover:underline" data-testid="link-register">Create one</span>
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Placement Cell / Admin?{" "}
                <Link href="/login">
                  <span className="text-primary font-medium cursor-pointer hover:underline" data-testid="link-admin-login">Admin Login</span>
                </Link>
              </p>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Demo accounts:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Student: student@demo.com / demo123</p>
              <p>Recruiter: recruiter@demo.com / demo123</p>
              <p>Admin: admin@demo.com / demo123</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
