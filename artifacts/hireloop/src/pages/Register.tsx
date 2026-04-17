import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Zap, ArrowLeft, GraduationCap, Building2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GoogleLogin } from "@react-oauth/google";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "recruiter"]),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const selectedRole = form.watch("role");

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user as Parameters<typeof login>[1]);
        if (res.user.role === "student") setLocation("/student/dashboard");
        else setLocation("/recruiter/dashboard");
        toast({ title: `Welcome to HireLoop, ${res.user.name}!` });
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { error?: string } } };
        toast({ title: "Registration failed", description: error?.response?.data?.error ?? "Please try again.", variant: "destructive" });
      },
    });
  };

  const onGoogleSuccess = async (response: any) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;
      const res = await fetch(`${apiBase}/oauth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential, role: selectedRole })
      });
      if (!res.ok) throw new Error("Google registration failed");
      const data = await res.json();
      
      const userPayload = JSON.parse(atob(data.token.split('.')[1]));
      login(data.token, { id: userPayload.userId, email: "", role: data.role, name: "Google User" } as any);
      
      if (data.role === "student") setLocation("/student/dashboard");
      else setLocation("/recruiter/dashboard");
      
      toast({ title: "Successfully registered with Google!" });
    } catch (err) {
      toast({ title: "Google Registration Failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6" data-testid="link-back-home">
              <ArrowLeft size={14} /> Back to home
            </button>
          </Link>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text font-serif">HireLoop</span>
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2">Create your account</h1>
          <p className="text-muted-foreground text-sm">Join the campus placement revolution</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-card-border">
          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">I am joining as a...</p>
            <div className="grid grid-cols-2 gap-3">
              {(["student", "recruiter"] as const).map((role) => (
                <motion.button
                  key={role}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => form.setValue("role", role)}
                  className={cn(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200",
                    selectedRole === role
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-secondary/40"
                  )}
                  data-testid={`button-role-${role}`}
                >
                  {role === "student" ? (
                    <GraduationCap size={20} className={selectedRole === role ? "text-primary" : "text-muted-foreground"} />
                  ) : (
                    <Building2 size={20} className={selectedRole === role ? "text-primary" : "text-muted-foreground"} />
                  )}
                  <span className={cn("text-sm font-semibold capitalize", selectedRole === role ? "text-primary" : "text-muted-foreground")}>
                    {role}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" data-testid="input-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          placeholder="Min 6 characters"
                          type={showPass ? "text" : "password"}
                          data-testid="input-password"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                disabled={registerMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold text-sm mt-2 disabled:opacity-60"
                data-testid="button-submit-register"
              >
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </motion.button>
            </form>
          </Form>

          <div className="my-5 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-3 text-xs text-muted-foreground uppercase">or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>
          
          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => toast({ title: "Google registration failed", variant: "destructive" })}
              theme="filled_black"
              shape="pill"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium cursor-pointer hover:underline" data-testid="link-login">Sign in</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
