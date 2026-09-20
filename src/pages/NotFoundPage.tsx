import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-black text-slate-700">404</p>
      <h1 className="mt-3 text-xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-6 py-2.5 text-sm font-bold text-night-950 transition hover:brightness-110"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
