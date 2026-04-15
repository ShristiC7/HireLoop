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
    resolver: zodResolver(schema),
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">Or join with</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => window.location.href = "/api/v1/auth/google"}
            className="w-full py-2.5 px-4 bg-secondary/50 border border-border rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 hover:bg-secondary transition-colors"
            data-testid="button-google-register"
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
