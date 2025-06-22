"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Vote, 
  Shield, 
  Link as LinkIcon, 
  Users, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight,
  Globe,
  Lock,
  Share2
} from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-600/10"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-blue-900/30 rounded-full px-6 py-3 text-sm font-medium text-blue-400">
                <Shield className="w-4 h-4" />
                Blockchain-Secured Voting
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent leading-tight">
                SecureVote
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                The future of democratic participation. Create, share, and participate in secure elections using blockchain technology and shareable links.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-center items-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Blockchain Verified
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                Anonymous Voting
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-500" />
                Link-Based Access
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-16"
          >
            <motion.div variants={itemVariants} className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Why Choose SecureVote?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the next generation of voting technology with unparalleled security and accessibility.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <LinkIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Shareable Links</h3>
                    <p className="text-gray-300 leading-relaxed">
                      No more QR codes. Share secure voting links via email, SMS, or social media. One click access for all voters.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Email integration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        SMS distribution
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Social media sharing
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Blockchain Security</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Every vote is recorded on the blockchain, ensuring immutable, transparent, and verifiable results.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Immutable records
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Real-time verification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Transparent auditing
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Anonymous Voting</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Advanced cryptographic techniques ensure voter privacy while maintaining election integrity.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Zero-knowledge proofs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Encrypted vote data
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        Privacy protection
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Real-Time Results</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Watch results update in real-time with beautiful visualizations and comprehensive analytics.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Global Access</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Participate from anywhere in the world with just an internet connection and a secure link.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-black/50 border-blue-900/50 h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Instant Setup</h3>
                    <p className="text-gray-300 leading-relaxed">
                      Create and deploy elections in minutes. Generate secure voting links instantly.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-500/5 to-blue-600/5">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-500">10K+</div>
              <div className="text-gray-300">Elections Created</div>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-500">250K+</div>
              <div className="text-gray-300">Votes Cast</div>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-500">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <div className="text-4xl font-bold text-blue-500">50+</div>
              <div className="text-gray-300">Countries</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Ready to Transform Democracy?
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join thousands of organizations already using SecureVote for transparent, secure, and accessible elections.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                <Link href="/register">
                  Start Your First Election
                  <Vote className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
