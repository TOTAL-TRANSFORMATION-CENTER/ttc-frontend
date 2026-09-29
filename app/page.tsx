import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Heart,
  BookOpen,
  Users,
  Music,
  Handshake,
  Sun,
  ArrowRight,
  MapPin,
  Clock,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Total Transformation Center — Welcome",
  description:
    "A community rooted in faith, united by love, and committed to seeing every life reach its God-given potential.",
};

const activities = [
  {
    icon: Sun,
    title: "Sunday Worship",
    description:
      "Join us every Sunday for uplifting praise, worship, and a powerful message to start your week with renewed purpose.",
    time: "Sundays · 9:00 AM & 11:00 AM",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: BookOpen,
    title: "Bible Study",
    description:
      "Dive deeper into God's Word through our weekly study groups. Open to all ages and experience levels.",
    time: "Wednesdays · 7:00 PM",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Users,
    title: "Youth Ministry",
    description:
      "Empowering the next generation through fellowship, mentorship, and faith-building activities.",
    time: "Fridays · 6:00 PM",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Handshake,
    title: "Community Outreach",
    description:
      "Serving our community with love through food drives, charity events, and support programs.",
    time: "1st Saturday of every month",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Music,
    title: "Music Ministry",
    description:
      "Lifting hearts through music. Our choir and worship team lead us in songs of praise and devotion.",
    time: "Rehearsals · Thursdays 6:30 PM",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Heart,
    title: "Prayer Groups",
    description:
      "Gathering in prayer to intercede, encourage, and support one another through life's journey.",
    time: "Daily · 6:00 AM",
    color: "bg-sky-50 text-sky-600",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 border-b border-zinc-100/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/TTC Logo PNG.png"
              alt="TTC Logo"
              width={40}
              height={40}
              unoptimized
              className="h-9 w-auto object-contain"
            />
            <span className="font-serif font-bold text-lg text-indigo-950 hidden sm:inline">
              Total Transformation Center
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:inline"
            >
              Admin
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-900 text-white text-sm font-semibold rounded-full hover:bg-indigo-950 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-white to-white" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-amber-100/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100/80 text-indigo-700 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
            Welcome to Our Church Family
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-indigo-950 leading-[1.1] mb-6">
            Where Lives Are{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Transformed
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A community rooted in faith, united by love, and committed to seeing
            every life reach its God-given potential. Come as you are — leave
            transformed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-900 text-white font-semibold rounded-full hover:bg-indigo-950 transition-all duration-200 shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 hover:-translate-y-0.5"
            >
              Join Our Community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#activities"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-900 font-semibold rounded-full border border-indigo-200 hover:bg-indigo-50 transition-all duration-200"
            >
              Explore Activities
            </a>
          </div>
        </div>
      </section>

      {/* ─── Activities ─── */}
      <section id="activities" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Get Involved
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-indigo-950 mt-2">
              Our Church Activities
            </h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">
              There&apos;s a place for everyone at TTC. Discover the many ways
              you can connect, grow, and serve alongside our church family.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="group relative p-6 rounded-2xl border border-zinc-100 bg-white hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${activity.color} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <activity.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  {activity.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Clock className="h-3.5 w-3.5" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mission / Scripture CTA ─── */}
      <section className="py-24 px-4 bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6 leading-snug">
            &ldquo;For I know the plans I have for you,&rdquo; declares the Lord
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed mb-4">
            &ldquo;plans to prosper you and not to harm you, plans to give you
            hope and a future.&rdquo;
          </p>
          <p className="text-indigo-400 text-sm font-semibold mb-10">
            — Jeremiah 29:11
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-900 font-semibold rounded-full hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Become a Member
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-4 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/assets/TTC Logo PNG.png"
                  alt="TTC Logo"
                  width={36}
                  height={36}
                  unoptimized
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
                <span className="font-serif font-bold text-white">
                  Total Transformation Center
                </span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                A community of faith, hope, and love — transforming lives one
                soul at a time.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-sm text-zinc-500">
                <li>
                  <a
                    href="#activities"
                    className="hover:text-white transition-colors"
                  >
                    Activities
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Member Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="hover:text-white transition-colors"
                  >
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                Get In Touch
              </h4>
              <ul className="space-y-3 text-sm text-zinc-500">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-600 shrink-0" />
                  123 Faith Avenue, Grace City
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-600 shrink-0" />
                  Sun – Fri: 6:00 AM – 9:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-600 shrink-0" />
                  hello@ttc.org
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Total Transformation Center. All rights
            reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
