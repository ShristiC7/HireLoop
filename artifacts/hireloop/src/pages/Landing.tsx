import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Briefcase, BarChart3, CheckCircle, Zap, Users, TrendingUp, Shield, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const features = [
  { icon: Brain, title: "AI Resume Analyzer", desc: "Get ATS score, keyword gaps and actionable suggestions powered by GPT." },
  { icon: Mic2, title: "AI Mock Interview", desc: "Practice with role-specific questions and get instant AI feedback." },
  { icon: Briefcase, title: "Job Board", desc: "Browse verified campus job postings filtered by branch and CGPA." },
  { icon: BarChart3, title: "Placement Analytics", desc: "Real-time dashboards for placement cells with downloadable reports." },
];

import { Mic2 } from "lucide-react";

const stats = [
  { label: "Students Placed", value: "12,000+", icon: Users },
  { label: "Partner Companies", value: "500+", icon: Building2 },
  { label: "Avg Processing Time", value: "↓ 40%", icon: TrendingUp },
  { label: "Placement Rate", value: "94%", icon: CheckCircle },
];

import { Building2 } from "lucide-react";

const roles = [
  {
    role: "Student",
    color: "from-primary/20 to-accent/20",
    border: "border-primary/20",
    badge: "text-primary",
    features: ["Build AI-optimized resume", "Practice mock interviews", "Track applications live", "Get placement-ready"],
    href: "/register",
  },
  {
    role: "Recruiter",
    color: "from-chart-2/20 to-primary/20",
    border: "border-chart-2/20",
    badge: "text-chart-2",
    features: ["Post campus jobs", "Filter by CGPA & branch", "Shortlist & schedule interviews", "Extend offers digitally"],
    href: "/register",
  },
  {
    role: "Placement Admin",
    color: "from-chart-3/20 to-chart-2/20",
    border: "border-chart-3/20",
    badge: "text-chart-3",
    features: ["Monitor all placements", "Approve companies", "Generate analytics reports", "Manage announcements"],
    href: "/login",
  },
];

export default function Landing() {
  const { user } = useAuth();

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "student") return "/student/dashboard";
    if (user.role === "recruiter") return "/recruiter/dashboard";
    return "/admin/dashboard";
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight gradient-text font-serif">HireLoop</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href={getDashboardHref()}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-login">
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
                    data-testid="link-register"
                  >
                    Get Started
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
              <Zap size={12} /> AI-Powered Campus Recruitment Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 font-serif">
              The Operating System<br />
              <span className="gradient-text">for Campus Hiring</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              HireLoop unifies students, recruiters, and placement cells into one intelligent ecosystem — with AI resume analysis, mock interviews, and real-time placement analytics.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href={user ? getDashboardHref() : "/register"}>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold text-sm shadow-lg"
                  data-testid="button-hero-cta"
                >
                  Start Your Journey <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-semibold text-sm hover:border-primary/50 transition-colors" data-testid="button-hero-login">
                  Sign In
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon size={20} className="text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold gradient-text font-serif">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Everything you need to <span className="gradient-text">get placed</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built for students who want to stand out, recruiters who want efficiency, and admins who want control.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2 }}
                className="p-6 rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-y border-border/50 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">How it <span className="gradient-text">works</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From sign-up to placement offer in four simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {[
              { step: "01", icon: User, title: "Create Profile", desc: "Sign up as student, recruiter, or admin. Fill your academic info and skills in minutes." },
              { step: "02", icon: Brain, title: "AI-Power Your Resume", desc: "Upload your resume. Get an ATS score, keyword gaps, and instant improvement suggestions." },
              { step: "03", icon: Briefcase, title: "Apply to Jobs", desc: "Browse verified campus listings filtered by your CGPA and branch. Apply with one click." },
              { step: "04", icon: TrendingUp, title: "Track & Get Placed", desc: "Follow your application status live. Accept offers and let the placement cell update your record." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mb-4 z-10">
                  <item.icon size={22} className="text-primary" />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Built for <span className="gradient-text">every stakeholder</span></h2>
            <p className="text-muted-foreground">Three powerful dashboards, one unified platform.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={role.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${role.color} border ${role.border} transition-all duration-300`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${role.badge}`}>{role.role}</p>
                <ul className="space-y-2.5 mb-6">
                  {role.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle size={14} className={role.badge} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={role.href}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 rounded-lg bg-background/30 border border-white/10 text-sm font-semibold hover:bg-background/50 transition-all"
                    data-testid={`button-role-${role.role.toLowerCase().replace(/\s+/, "-")}`}
                  >
                    Get Started as {role.role}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
          >
            <Shield size={32} className="text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4 font-serif">Ready to transform placement?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of students and recruiters already using HireLoop.</p>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 bg-gradient-to-r from-primary to-accent/80 text-white rounded-xl font-semibold text-sm"
                data-testid="button-final-cta"
              >
                Get Started Free
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>HireLoop — AI-Powered Campus Recruitment Platform &copy; 2025</p>
      </footer>
    </div>
  );
}
