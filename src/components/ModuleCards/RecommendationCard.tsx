import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import type { Recommendation } from '@/types';

interface Props {
  recommendation: Recommendation;
  onOpen?: (r: Recommendation) => void;
}

const EFFORT_STYLES: Record<Recommendation['effort'], string> = {
  low: 'bg-emerald-400/15 text-emerald-300',
  medium: 'bg-amber-300/15 text-amber-200',
  high: 'bg-rose-400/15 text-rose-300',
};

export function RecommendationCard({ recommendation, onOpen }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-card p-5"
    >
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <Lightbulb className="h-4 w-4" />
        </span>
        <h3 className="flex-1 text-sm font-semibold text-white">{recommendation.title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${EFFORT_STYLES[recommendation.effort]}`}
        >
          {recommendation.effort} effort
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{recommendation.detail}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-300">✦ {recommendation.impact}</span>
        {onOpen && (
          <button
            type="button"
            onClick={() => onOpen(recommendation)}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300"
          >
            Details →
          </button>
        )}
      </div>
    </motion.article>
  );
}
