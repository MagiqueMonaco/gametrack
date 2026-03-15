import Link from 'next/link';
import { ArrowUpRight, Gamepad2, Library, Search, Sparkles } from 'lucide-react';
import packageJson from '../../package.json';

const currentYear = new Date().getFullYear();

const appLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/library', label: 'Library' },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.16),transparent_22%),linear-gradient(180deg,#0d0d0d_0%,#050505_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative mx-auto px-4 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_0_25px_rgba(124,58,237,0.35)]">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary/80">GameTrack</p>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your next obsession, tracked.</h2>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-foreground/70 md:text-base">
              Discover standout releases, keep a tight personal backlog, and move between hype, history, and your own library without losing the thread.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                v{packageJson.version}
              </div>
              <a
                href="https://www.igdb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
              >
                Powered by IGDB
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-black/20 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-foreground/45">Explore</p>
            <div className="space-y-3">
              {appLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-2xl border border-transparent bg-white/[0.02] px-4 py-3 text-sm font-medium text-foreground/75 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-white"
                >
                  <span>{link.label}</span>
                  {link.href === '/search' ? (
                    <Search className="h-4 w-4 text-foreground/35 transition-colors group-hover:text-primary" />
                  ) : link.href === '/library' ? (
                    <Library className="h-4 w-4 text-foreground/35 transition-colors group-hover:text-primary" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-foreground/35 transition-colors group-hover:text-primary" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-foreground/45 md:flex-row md:items-center md:justify-between">
          <p>{packageJson.name} v{packageJson.version} © {currentYear}</p>
          <p>Designed for discovery, backlog sanity, and better game nights.</p>
        </div>
      </div>
    </footer>
  );
}
