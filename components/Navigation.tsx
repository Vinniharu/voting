"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  BarChart3,
  Shield,
  User,
  Menu,
  X,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Vote },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/elections", label: "Elections", icon: Vote },
    { href: "/create", label: "Create Election", icon: Shield },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/activity", label: "Activity", icon: Activity },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-full w-64 glass-dark border-r border-vote-primary/20 z-40">
        <div className="flex flex-col w-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-vote-primary rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SecureVote</h1>
              <p className="text-xs text-gray-400">Blockchain Voting</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-link",
                    isActive(item.href) && "active"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-vote-primary/20 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-vote-primary/10">
              <div className="w-8 h-8 bg-vote-primary rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-gray-400">john@example.com</p>
              </div>
            </div>
            <button className="nav-link w-full mt-2 text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 glass-dark border-b border-vote-primary/20 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-vote-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SecureVote</h1>
                <p className="text-xs text-gray-400">Blockchain Voting</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg glass-blue hover:bg-vote-primary/20 transition-colors"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.nav
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-80 glass-dark border-r border-vote-primary/20 z-50"
              >
                <div className="flex flex-col h-full p-6 pt-20">
                  {/* Navigation Items */}
                  <div className="flex-1 space-y-2">
                    {navItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "nav-link",
                              isActive(item.href) && "active"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* User Section */}
                  <div className="border-t border-vote-primary/20 pt-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-vote-primary/10">
                      <div className="w-8 h-8 bg-vote-primary rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">John Doe</p>
                        <p className="text-xs text-gray-400">john@example.com</p>
                      </div>
                    </div>
                    <button className="nav-link w-full mt-2 text-gray-400 hover:text-white">
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Content Spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
      <div className="lg:hidden h-16 flex-shrink-0" />
    </>
  );
};

export default Navigation; 