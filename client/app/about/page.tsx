"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/Button";
import {
  FiArrowRight,
  FiMapPin,
  FiStar,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import { Volleyball, Building2, Settings } from "lucide-react";
import ParticleBackground from "./ParticleBackground";

export default function AboutPage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <main className="min-h-screen relative">
      {/* Hero Section with Particle Background */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 z-10" />

        <motion.div
          ref={ref}
          style={{ opacity, scale }}
          className="relative z-20 h-full flex flex-col items-center justify-center text-center text-white px-4 sm:px-6 max-w-5xl mx-auto"
        >
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-300 via-blue-500 to-green-300 bg-clip-text text-transparent"
          >
            About TurfMania
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl sm:text-2xl max-w-3xl mx-auto text-gray-100"
          >
            Revolutionizing sports venue booking in Bangladesh
          </motion.p>
        </motion.div>
      </div>

      {/* Overview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At TurfMania, we are streamlining the turf industry in
                Bangladesh by connecting sports enthusiasts with quality venues.
                Our platform simplifies the booking process, empowers turf
                owners, and creates a vibrant sports community.
              </p>
              <p className="text-lg text-gray-600">
                Whether you are organizing a casual game with friends or
                managing multiple sports facilities, TurfMania provides the
                tools and technologies to make your experience seamless.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="/images/VenuesHeroSection-id1.avif"
                alt="TurfMania Platform Overview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-xl font-bold">
                    Your Game, Your Turf, Your Time
                  </h3>
                  <p className="text-sm opacity-90">
                    Experience sports booking reimagined
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              TurfMania offers a comprehensive suite of features designed for
              players, turf owners, and administrators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Features */}
            <FeatureCard
              title="For Players"
              description="Everything you need to find and book the perfect turf for your game."
              icon={<Volleyball className="h-8 w-8 text-green-600" />}
              features={[
                { name: "Explore Turfs", icon: <FiMapPin /> },
                { name: "Advanced Filtering", icon: <FiStar /> },
                { name: "Review System", icon: <FiStar /> },
                { name: "Seamless Booking", icon: <FiCalendar /> },
                { name: "Secure Payments", icon: <FiDollarSign /> },
              ]}
              delay={0}
            />

            {/* Organization Features */}
            <FeatureCard
              title="For Organizations"
              description="Powerful tools to manage your turf business efficiently."
              icon={<Building2 className="h-8 w-8 text-blue-600" />}
              features={[
                { name: "Simple Onboarding", icon: <FiUsers /> },
                { name: "Time Slot Management", icon: <FiCalendar /> },
                { name: "Team Management", icon: <FiUsers /> },
                { name: "Booking Oversight", icon: <FiShield /> },
                { name: "Revenue Analytics", icon: <FiDollarSign /> },
              ]}
              delay={0.2}
            />

            {/* Admin Features */}
            <FeatureCard
              title="For Administrators"
              description="Complete control over the TurfMania platform."
              icon={<Settings className="h-8 w-8 text-purple-600" />}
              features={[
                { name: "Request Processing", icon: <FiUsers /> },
                { name: "Role-Based Access", icon: <FiShield /> },
                { name: "Permission Management", icon: <FiShield /> },
                { name: "Platform Oversight", icon: <FiStar /> },
                { name: "Automated Tasks", icon: <FiCalendar /> },
              ]}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How TurfMania Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform connects players with turf owners through an
              intuitive, streamlined process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                title: "Search",
                description:
                  "Find turfs based on location, sport, price, and availability",
                icon: "/images/about-us-1.png",
                step: "01",
              },
              {
                title: "Book",
                description:
                  "Select your preferred time slot and complete payment",
                icon: "/images/about-us-2.png",
                step: "02",
              },
              {
                title: "Play",
                description:
                  "Show up and enjoy your game with friends or teammates",
                icon: "/images/about-us-3.png",
                step: "03",
              },
              {
                title: "Review",
                description: "Share your experience to help other players",
                icon: "/images/about-us-4.png",
                step: "04",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 w-full bg-slate-50">
                  <Image
                    src={item.icon}
                    alt={item.title}
                    fill
                    className="object-contain p-2"
                    priority
                  />
                  <div className="absolute top-4 right-4 bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-md">
                    <span className="text-sm font-semibold text-gray-800">
                      {item.step}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between"
          >
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg text-gray-600 max-w-lg">
                Join thousands of sports enthusiasts who have already discovered
                the easiest way to book sports venues.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/venues">
                <Button
                  variant="default"
                  className="flex items-center gap-2 font-semibold"
                >
                  Explore Venues <FiArrowRight />
                </Button>
              </Link>
              <Link href="/organization-request">
                <Button variant="outline" className="font-semibold">
                  Register Your Venue
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

// Feature Card Component
const FeatureCard = ({
  title,
  description,
  icon,
  features,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: { name: string; icon: React.ReactNode }[];
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    viewport={{ once: true }}
    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
  >
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="rounded-full bg-gray-50 p-3 mr-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <ul className="space-y-3">
        {features.map((feature) => (
          <li key={feature.name} className="flex items-center">
            <div className="mr-3 text-green-600">{feature.icon}</div>
            <span className="text-gray-700">{feature.name}</span>
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);
