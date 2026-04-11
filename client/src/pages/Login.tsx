import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, RegisterData } from "../context/AuthContext";
import { GraduationCap, Briefcase, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Footer from "../components/Footer";

type BackendRole = "STUDENT" | "RECRUITER" | "ADMIN";
type Mode = "login" | "register";

const roles = [
  {
    value: "STUDENT" as BackendRole,
    label: "Student",
    icon: <GraduationCap size={24} />,
    desc: "Find jobs and track applications",
  },
  {
    value: "RECRUITER" as BackendRole,
    label: "Recruiter",
    icon: <Briefcase size={24} />,
    desc: "Post jobs and manage applicants",
  },
  {
    value: "ADMIN" as BackendRole,
    label: "Admin",
    icon: <Shield size={24} />,
    desc: "Manage the placement portal",
  },
];

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [selectedRole, setSelectedRole] = useState<BackendRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const user = await login(email, password);
        const routeRole = user.role.toLowerCase();
        navigate(`/${routeRole}`, { replace: true });
      } else {
        const data: RegisterData = {
          email,
          password,
          role: selectedRole,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        };
        const user = await register(data);
        const routeRole = user.role.toLowerCase();

        // Recruiters need admin approval — show message and don't redirect to dashboard
        if (user.role === "RECRUITER") {
          toast({
            title: "Registration successful!",
            description:
              "Your recruiter account is pending admin approval. You will be notified by email.",
          });
          setMode("login");
        } else {
          toast({
            title: "Welcome to HireLoop!",
            description: "Account created. Please verify your email when you get a chance.",
          });
          navigate(`/${routeRole}`, { replace: true });
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
import { useAuth } from "../context/AuthContext";
import { GraduationCap, Briefcase, Shield } from "lucide-react";
import Footer from "../components/Footer";

type Role = "student" | "recruiter" | "admin";

const roles = [
  { value: "student" as Role, label: "Student", icon: <GraduationCap size={24} />, desc: "Find jobs and track applications" },
  { value: "recruiter" as Role, label: "Recruiter", icon: <Briefcase size={24} />, desc: "Post jobs and manage applicants" },
  { value: "admin" as Role, label: "Admin", icon: <Shield size={24} />, desc: "Manage the placement portal" },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    login(selectedRole, name.trim());
    navigate(`/${selectedRole}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-10 transform rotate-45" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500 opacity-5 rounded-full" />
        </div>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700">
        {/* Diagonal Design Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 opacity-10 transform rotate-45"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500 opacity-5 rounded-full"></div>
        </div>

        {/* SVG Diagonal Lines for Professional Look */}
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="diagonal-lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
        </svg>

        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-center">
          {/* Left side — hero image */}
          <div
            className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden rounded-2xl min-h-96 shadow-2xl"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent" />
            <div className="relative z-10 p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Campus Recruitment</h2>
              <p className="text-white/80">AI-powered placements for the modern campus</p>
            </div>
          </div>

          {/* Right side — form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {/* Mode toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === "login"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === "register"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name fields — only for registration */}
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Priya"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min 8 chars, 1 uppercase, 1 number" : "Enter your password"}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {mode === "login" ? "Log in as" : "Register as"}
                </label>
                <div className="grid grid-cols-3 gap-2">
          {/* Left Side - Background Image */}
          <div 
            className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden rounded-2xl min-h-96 shadow-2xl"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark Overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20"></div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent"></div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Sign Into Your Account</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-4 text-gray-700">Select Your Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center font-medium ${
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center font-medium ${
                        selectedRole === r.value
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div>{r.icon}</div>
                      <div>
                        {r.icon}
                      </div>
                      <span className="text-xs">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:-translate-y-0.5 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {mode === "login"
                  ? `Sign in as ${roles.find((r) => r.value === selectedRole)?.label}`
                  : `Create ${roles.find((r) => r.value === selectedRole)?.label} Account`}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 p-4 bg-blue-50 rounded-lg border border-blue-200 text-xs text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">Demo Credentials</p>
              <p>Student: <span className="font-mono">student@demo.com</span> / <span className="font-mono">Student@123</span></p>
              <p>Recruiter: <span className="font-mono">recruiter@techcorp.com</span> / <span className="font-mono">Recruiter@123</span></p>
              <p>Admin: <span className="font-mono">admin@hireloop.com</span> / <span className="font-mono">Admin@123456</span></p>
            </div>
          </div>
        </div>
      </div>
              <div>
                <a href="#forgot" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-all transform hover:-translate-y-1 shadow-lg"
              >
                Login as {roles.find((r) => r.value === selectedRole)?.label}
              </button>
            </form>

            <p className="text-xs text-gray-600 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="font-semibold text-gray-800">Note:</span> This is a demo portal. Use any name to login.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
