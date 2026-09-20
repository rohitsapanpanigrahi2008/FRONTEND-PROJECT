import { lazy, Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Loader2, Lock, Mail } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@/utils/validators';
import { AuthService } from '@/services/auth';
import { loginRateLimiter } from '@/utils/rateLimiter';
import { useNotificationStore } from '@/store/notificationStore';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';

const FacilityGlobe = lazy(() =>
  import('@/components/3D/FacilityGlobe').then((m) => ({ default: m.FacilityGlobe })),
);

export default function LoginPage() {
  const navigate = useNavigate();
  const push = useNotificationStore((s) => s.push);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    const verdict = loginRateLimiter.isAllowed('login');
    if (!verdict.allowed) {
      push('warning', `Too many attempts. Try again in ${verdict.retryAfterSec ?? 60}s.`);
      return;
    }
    setBusy(true);
    try {
      await AuthService.login(values);
      push('success', 'Welcome back.');
      navigate('/', { replace: true });
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (role: 'admin' | 'operator' | 'analyst') => {
    setValue('email', `${role}@demo.gov.in`);
    setValue('password', 'Facility@2026');
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand / 3D hero */}
      <section className="aurora relative flex min-h-[280px] flex-1 flex-col justify-center overflow-hidden p-8 lg:min-h-screen lg:p-14">
        <div className="relative z-10 max-w-md">
          <span className="glass-card mb-6 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <Leaf className="h-3.5 w-3.5" /> Sustainable Estate Intelligence
          </span>
          <h1 className="text-4xl font-black leading-tight text-white lg:text-5xl">
            One dashboard for your facility's
            <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
              {' '}air, energy, water &amp; safety
            </span>
            .
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            AI-assisted monitoring, forecasting and recommendations for hospitals, campuses and
            public facilities across India. Decision support — not official measurement.
          </p>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] opacity-80 lg:block">
          <Suspense fallback={null}>
            <FacilityGlobe healthScore={74} />
          </Suspense>
        </div>
      </section>

      {/* Form */}
      <section className="flex flex-1 items-center justify-center p-6 lg:flex-none lg:basis-[46%] lg:p-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="glass-panel w-full max-w-md p-8"
        >
          <h2 className="text-2xl font-bold text-white">Sign in</h2>
          <p className="mt-1 mb-6 text-sm text-slate-400">
            Authorised facility staff only. Sessions auto-expire when idle.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300" htmlFor="email">
              Official email
            </label>
            <div className="relative mb-4">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="glass-input w-full py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500"
                placeholder="you@facility.gov.in"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mb-3 text-xs text-rose-400">{errors.email.message}</p>}

            <label className="mb-1.5 block text-xs font-semibold text-slate-300" htmlFor="password">
              Password
            </label>
            <div className="relative mb-4">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="glass-input w-full py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="mb-3 text-xs text-rose-400">{errors.password.message}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 font-bold text-night-950 transition hover:brightness-110 disabled:opacity-60"
            >
              {busy ? <LoadingSpinner size="sm" label="Signing in" /> : 'Sign in securely'}
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Demo roles (mock mode)
            </p>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'operator', 'analyst'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className="glass-input px-3 py-1.5 text-xs font-semibold capitalize text-sky-300 hover:text-sky-200"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
