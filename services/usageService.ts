import { supabase } from '../lib/supabase';

export const checkUsageLimit = async (userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> => {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription || !subscription.subscription_plans) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const limit = subscription.subscription_plans.image_generations_limit;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('credits_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    const used = usageLogs?.reduce((sum, log) => sum + log.credits_used, 0) || 0;
    const remaining = Math.max(0, limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      limit,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
};

export const logUsage = async (
  userId: string,
  actionType: 'thumbnail' | 'product_shoot' | 'reimagine' | 'scene',
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from('usage_logs').insert({
      user_id: userId,
      action_type: actionType,
      credits_used: 1,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Error logging usage:', error);
  }
};

export const getMonthlyUsage = async (userId: string): Promise<number> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('credits_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    return usageLogs?.reduce((sum, log) => sum + log.credits_used, 0) || 0;
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return 0;
  }
};
