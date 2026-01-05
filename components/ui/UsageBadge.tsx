import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { checkUsageLimit } from '../../services/usageService';

const UsageBadge: React.FC = () => {
  const { user, subscription, profile } = useAuth();
  const [usage, setUsage] = useState<{ remaining: number; limit: number; isAdmin?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [user?.id]);

  const loadUsage = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const result = await checkUsageLimit(user.id);
      setUsage({ remaining: result.remaining, limit: result.limit, isAdmin: result.isAdmin });
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  if (usage.isAdmin || profile?.is_admin) {
    return (
      <Link
        to="/subscription"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700"
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-75">Admin Access</span>
            <span className="font-bold">Unlimited</span>
          </div>
          <div className="text-xl">∞</div>
        </div>
      </Link>
    );
  }

  const usagePercent = usage.limit > 0 ? ((usage.limit - usage.remaining) / usage.limit) * 100 : 0;
  const isLow = usage.remaining <= 3;
  const isExceeded = usage.remaining === 0;

  return (
    <Link
      to="/subscription"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
        isExceeded
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
          : isLow
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-75">{subscription?.subscription_plans?.name || 'Free'} Plan</span>
          <span className="font-bold">
            {usage.remaining} / {usage.limit} left
          </span>
        </div>
        <div className="w-12 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isExceeded ? 'bg-red-600' : isLow ? 'bg-yellow-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

export default UsageBadge;
