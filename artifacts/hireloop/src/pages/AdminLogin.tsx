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
import { Zap, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

export default function AdminLogin() {
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        if (res.user.role !== "admin") {
          toast({ title: "Access denied", description: "This login is for admins only.", variant: "destructive" });
          return;
        }
        login(res.token, res.user as Parameters<typeof login>[1]);
        setLocation("/admin/dashboard");
        toast({ title: `Welcome back, ${res.user.name}` });
      },
      onError: () => {
        toast({ title: "Invalid credentials", description: "Check your admin email and password.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Placement Cell & Administrative Access</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-card-border shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Admin Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@college.edu" type="email" {...field} />
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
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In as Admin"}
              </motion.button>
            </form>
          </Form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/login">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
              <ArrowLeft size={14} /> Back to regular login
            </button>
          </Link>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs font-semibold text-amber-600 mb-1">Demo Admin</p>
          <p className="text-xs text-muted-foreground">admin@demo.com / demo123</p>
        </div>
      </motion.div>
    </div>
  );
}
