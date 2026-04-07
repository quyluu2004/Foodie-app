import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorConfig = {
  primary:   { bg: 'from-orange-500 to-red-500',   light: 'bg-orange-50 dark:bg-orange-900/20',   icon: 'text-orange-600 dark:text-orange-400',   bar: 'bg-orange-500',  ring: 'ring-orange-200 dark:ring-orange-800' },
  secondary: { bg: 'from-amber-400 to-orange-500',  light: 'bg-amber-50 dark:bg-amber-900/20',    icon: 'text-amber-600 dark:text-amber-400',    bar: 'bg-amber-500',   ring: 'ring-amber-200 dark:ring-amber-800' },
  green:     { bg: 'from-emerald-400 to-green-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  blue:      { bg: 'from-blue-400 to-indigo-500',   light: 'bg-blue-50 dark:bg-blue-900/20',      icon: 'text-blue-600 dark:text-blue-400',      bar: 'bg-blue-500',    ring: 'ring-blue-200 dark:ring-blue-800' },
  purple:    { bg: 'from-purple-400 to-violet-500', light: 'bg-purple-50 dark:bg-purple-900/20',  icon: 'text-purple-600 dark:text-purple-400',  bar: 'bg-purple-500',  ring: 'ring-purple-200 dark:ring-purple-800' },
  pink:      { bg: 'from-pink-400 to-rose-500',     light: 'bg-pink-50 dark:bg-pink-900/20',      icon: 'text-pink-600 dark:text-pink-400',      bar: 'bg-pink-500',    ring: 'ring-pink-200 dark:ring-pink-800' },
  orange:    { bg: 'from-orange-400 to-amber-500',  light: 'bg-orange-50 dark:bg-orange-900/20',  icon: 'text-orange-600 dark:text-orange-400',  bar: 'bg-orange-500',  ring: 'ring-orange-200 dark:ring-orange-800' },
  yellow:    { bg: 'from-yellow-400 to-amber-500',  light: 'bg-yellow-50 dark:bg-yellow-900/20',  icon: 'text-yellow-600 dark:text-yellow-400',  bar: 'bg-yellow-500',  ring: 'ring-yellow-200 dark:ring-yellow-800' },
};

export default function CardStat({ title, value, icon: Icon, color = 'primary', change, index = 0, onClick, clickable = false }) {
  const cfg = colorConfig[color] || colorConfig.primary;

  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendColor = change > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
    : change < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    : 'text-gray-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-500';

  return (
    <div
      className={`
        relative overflow-hidden bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A]
        shadow-sm hover:shadow-md transition-all duration-300 p-5
        ${clickable ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0' : 'hover:-translate-y-0.5'}
      `}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={clickable ? onClick : undefined}
    >
      {/* Decorative gradient corner */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${cfg.bg} opacity-10`} />
      <div className={`absolute -bottom-8 -right-2 w-16 h-16 rounded-full bg-gradient-to-br ${cfg.bg} opacity-5`} />

      <div className="relative flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${cfg.light} flex items-center justify-center ring-4 ${cfg.ring} ring-opacity-30`}>
          <Icon className={`w-5 h-5 ${cfg.icon}`} />
        </div>
        {change !== undefined && change !== null && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>

      <div className="relative">
        <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums leading-none mb-1">
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-snug">{title}</p>
      </div>

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 w-1/3 bg-gradient-to-r ${cfg.bg} rounded-full`} />
    </div>
  );
}
