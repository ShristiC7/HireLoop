import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useGetRecruiterProfile, useUpdateRecruiterProfile, getGetRecruiterProfileQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Building, User, Phone, Globe, Save, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  company: z.string().min(2, "Company required"),
  designation: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RecruiterProfile() {
  const { data: profile, isLoading } = useGetRecruiterProfile();
  const updateProfile = useUpdateRecruiterProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: "", company: "", designation: "", phone: "", website: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        company: profile.company ?? "",
        designation: profile.designation ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: FormData) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecruiterProfileQueryKey() });
        toast({ title: "Profile updated!" });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <DashboardLayout requiredRole="recruiter">
      <div className="space-y-4 max-w-2xl mx-auto">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout requiredRole="recruiter">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Building size={20} className="text-primary" />
            <h1 className="text-2xl font-bold font-serif">Company Profile</h1>
          </div>
          <p className="text-muted-foreground text-sm">Update your recruiter and company information</p>
        </motion.div>

        {/* Approval Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
            profile?.isApproved
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          )}
        >
          {profile?.isApproved
            ? <><CheckCircle size={16} /> Your account is approved. You can post campus jobs.</>
            : <><Clock size={16} /> Your account is pending approval by the placement admin. You'll be notified once approved.</>
          }
        </motion.div>

        {/* Profile Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-card-border flex items-center gap-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/20 shrink-0">
            <span className="text-2xl font-bold text-primary">
              {profile?.company?.[0]?.toUpperCase() ?? "C"}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{profile?.name}</h3>
            <p className="text-muted-foreground text-sm">{profile?.designation ?? "Recruiter"} at {profile?.company}</p>
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                <Globe size={11} /> {profile.website}
              </a>
            )}
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-card border border-card-border"
        >
          <h2 className="font-semibold text-sm mb-5 flex items-center gap-2">
            <User size={14} className="text-primary" /> Profile Information
          </h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" data-testid="input-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" data-testid="input-company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HR Manager, Tech Recruiter" data-testid="input-designation" {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-2.5 text-muted-foreground" />
                        <Input className="pl-8" placeholder="+91 98765 43210" data-testid="input-phone" {...field} />
                      </div>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Company Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-2.5 text-muted-foreground" />
                      <Input className="pl-8" placeholder="https://yourcompany.com" data-testid="input-website" {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )} />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                data-testid="button-save-profile"
              >
                <Save size={14} />
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </motion.button>
            </form>
          </Form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
