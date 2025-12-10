export default function CardStat({ title, value, icon: Icon, color = 'primary', change, index = 0, onClick, clickable = false }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div 
      className={`card animate__animated animate__fadeInUp card-hover ${clickable ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]} transition-all duration-200 hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && change !== null && (
          <span
            className={`text-sm font-medium animate__animated animate__pulse ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-1">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-[#E5E5E5]">{title}</p>
    </div>
  );
}

