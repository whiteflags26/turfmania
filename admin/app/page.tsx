"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/authContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiUser,
  FiMail,
  FiLock,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message ?? "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@email.com");
    setPassword("Pass#_123");
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-gray-800 to-gray-700 rounded-b-full opacity-20 -z-10 transform -translate-y-1/2"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-8 pt-8 pb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="bg-gray-600 bg-opacity-30 backdrop-blur-sm p-4 rounded-full">
                <FiUser className="text-gray-200 text-3xl" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white text-center mt-4"
            >
              Admin Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-center text-sm mt-1"
            >
              Sign in to manage your turf business
            </motion.p>
          </div>

          {/* Login Form */}
          <div className="px-8 py-8 -mt-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-700 border border-gray-600 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-200 flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <span>Demo Access</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors flex items-center gap-1.5 shadow-md shadow-gray-800/50"
                >
                  <FiCheckCircle size={14} />
                  <span>Auto-fill</span>
                </motion.button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 p-2 rounded-md border border-gray-600">
                  <span className="block text-xs text-gray-300 mb-1">
                    Email:
                  </span>
                  <span className="font-mono text-gray-200">
                    admin@email.com
                  </span>
                </div>
                <div className="bg-gray-800 p-2 rounded-md border border-gray-600">
                  <span className="block text-xs text-gray-300 mb-1">
                    Password:
                  </span>
                  <span className="font-mono text-gray-200">Pass#_123</span>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 rounded-lg bg-red-900/20 px-4 py-3 text-sm text-red-200 border border-red-800/30 flex items-center"
                >
                  <FiAlertCircle
                    className="text-red-400 mr-2 flex-shrink-0"
                    size={18}
                  />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-200 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-200 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2.5 text-gray-200 shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 outline-none"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-gray-900/50 transition-all duration-200 flex items-center justify-center border border-gray-600"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Signing in</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Sign In</span>
                    <FiArrowRight className="ml-2" />
                  </div>
                )}
              </motion.button>
            </motion.form>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="px-8 py-4 bg-gray-900 text-center text-xs text-gray-400 border-t border-gray-700"
          >
            TurfMania Admin Portal &copy; {new Date().getFullYear()}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
