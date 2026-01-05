import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, SubscriptionPlan } from '../lib/supabase';
import { getMonthlyUsage } from '../services/usageService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const SubscriptionPage: React.FC = () => {
  const { subscription, profile, refreshProfile } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      setPlans(plansData || []);

      if (profile?.id && !profile?.is_admin) {
        const usage = await getMonthlyUsage(profile.id);
        setMonthlyUsage(usage);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    alert('Stripe integration will redirect to checkout here');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex justify-center py-12">
        <Spinner size="large" />
      </div>
    );
  }

  const isAdmin = profile?.is_admin || false;
  const currentPlan = subscription?.subscription_plans;
  const limit = isAdmin ? 999999 : (currentPlan?.image_generations_limit || 0);
  const remaining = isAdmin ? 999999 : Math.max(0, limit - monthlyUsage);
  const usagePercent = isAdmin ? 0 : (limit > 0 ? (monthlyUsage / limit) * 100 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your plan and usage</p>
      </div>

      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Current Plan</h2>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isAdmin ? 'Admin Access' : currentPlan?.name || 'Free'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {isAdmin ? 'Unlimited access' : `$${((currentPlan?.monthly_price || 0) / 100).toFixed(2)}/month`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {subscription?.status || 'active'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Monthly Usage</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {isAdmin ? `${monthlyUsage} / Unlimited generations` : `${monthlyUsage} / ${limit} generations`}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isAdmin
                  ? 'bg-green-600'
                  : usagePercent >= 90
                  ? 'bg-red-600'
                  : usagePercent >= 70
                  ? 'bg-yellow-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: isAdmin ? '100%' : `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isAdmin ? 'Unlimited generations available' : `${remaining} generations remaining`}
          </p>
        </div>

        {(isAdmin || currentPlan?.features) && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features:</p>
            <ul className="space-y-1">
              {isAdmin ? (
                <>
                  <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    Unlimited image generations/month
                  </li>
                  <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    Full system access
                  </li>
                  <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    Admin dashboard access
                  </li>
                </>
              ) : (
                currentPlan?.features?.map((feature: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </Card>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === subscription?.plan_id;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isCurrent ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''
              }`}
            >
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Current
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${(plan.monthly_price / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.image_generations_limit} image generations per month
                </p>
                {plan.features && (
                  <ul className="space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <span className="text-green-600 dark:text-green-400 mr-2 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                className="w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent || plan.monthly_price === 0}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isCurrent ? 'Current Plan' : plan.monthly_price === 0 ? 'Free Plan' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;
