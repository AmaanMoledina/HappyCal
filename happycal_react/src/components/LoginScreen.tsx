import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CalendarDays, Mail, Lock, User, Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const smoothTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1],
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const floatingElements = [
    { top: "10%", left: "10%", delay: 0, duration: 6, size: "w-32 h-32" },
    { top: "20%", right: "15%", delay: 1, duration: 7, size: "w-24 h-24" },
    { top: "60%", left: "5%", delay: 2, duration: 8, size: "w-28 h-28" },
    { top: "70%", right: "10%", delay: 0.5, duration: 6.5, size: "w-20 h-20" },
    { top: "40%", left: "85%", delay: 1.5, duration: 7.5, size: "w-36 h-36" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      {/* Animated floating elements */}
      {floatingElements.map((elem, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${elem.size} rounded-full backdrop-blur-xl bg-white/10 border border-white/20`}
          style={{
            top: elem.top,
            left: elem.left,
            right: elem.right,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: elem.duration,
            repeat: Infinity,
            delay: elem.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springTransition}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/15 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Logo and title */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/50 flex items-center justify-center mb-4"
            >
              <CalendarDays className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.2 }}
              className="text-gray-900 mb-2"
            >
              Welcome to HappyCal
            </motion.h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={isLogin ? "login-text" : "register-text"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={smoothTransition}
                className="text-gray-600 text-center"
              >
                {isLogin ? "Sign in to manage your university events" : "Create your account to get started"}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Toggle buttons */}
          <div className="flex gap-2 mb-6 backdrop-blur-xl bg-white/10 p-1 rounded-xl relative">
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg"
              initial={false}
              animate={{
                left: isLogin ? "4px" : "50%",
                right: isLogin ? "50%" : "4px",
              }}
              transition={springTransition}
            />
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg transition-colors relative z-10 ${
                isLogin ? "text-white" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg transition-colors relative z-10 ${
                !isLogin ? "text-white" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={smoothTransition}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 backdrop-blur-sm bg-white/30 border-white/40 focus:bg-white/50 text-gray-900 placeholder:text-gray-600 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.1 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@kellogg.northwestern.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/30 border-white/40 focus:bg-white/50 text-gray-900 placeholder:text-gray-600 transition-all"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/30 border-white/40 focus:bg-white/50 text-gray-900 placeholder:text-gray-600 transition-all"
                />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {isLogin && (
                <motion.div
                  key="remember-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={smoothTransition}
                  className="flex items-center justify-between text-sm overflow-hidden"
                >
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/40" />
                    Remember me
                  </label>
                  <button type="button" className="text-sky-700 hover:text-sky-800 transition-colors">
                    Forgot password?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smoothTransition, delay: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/30 border-0 group transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isLogin ? "signin" : "create"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>

          {/* Additional info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isLogin ? "no-account" : "have-account"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sky-700 hover:text-sky-800 transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </motion.div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/20 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-500/20 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 text-sm text-gray-600"
        >
          Made with ❤️ for Kellogg Students
        </motion.p>
      </motion.div>
    </div>
  );
}
