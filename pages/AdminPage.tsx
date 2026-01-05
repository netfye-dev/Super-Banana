import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, UserProfile, UserSubscription, ApiKey } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  image_generations_limit: number;
  is_active: boolean;
}

const AdminPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'api_keys' | 'subscriptions' | 'plans'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: '', provider: '', api_key: '' });
  const [newSubscription, setNewSubscription] = useState({ user_id: '', plan_id: '' });
  const [newPlan, setNewPlan] = useState({ name: '', monthly_price: 0, image_generations_limit: 0 });

  useEffect(() => {
    if (profile?.is_admin) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [profile, activeTab, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
      } else if (activeTab === 'api_keys') {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading API keys:', error);
        }

        console.log('Loaded API keys:', data);
        setApiKeys(data || []);
      } else if (activeTab === 'subscriptions') {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(*), user_profiles(email)')
          .order('created_at', { ascending: false });
        setSubscriptions(data || []);

        const { data: allUsers } = await supabase
          .from('user_profiles')
          .select('*')
          .order('email', { ascending: true });
        setUsers(allUsers || []);

        const { data: allPlans } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });
        setPlans(allPlans || []);
      } else if (activeTab === 'plans') {
        const { data } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('monthly_price', { ascending: true });
        setPlans(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    try {
      const { data, error } = await supabase.from('api_keys').insert({
        name: newApiKey.name,
        provider: newApiKey.provider,
        api_key: newApiKey.api_key,
        created_by: profile?.id,
      });

      if (error) {
        console.error('Error adding API key:', error);
        alert(`Error adding API key: ${error.message}`);
        return;
      }

      setShowAddApiKey(false);
      setNewApiKey({ name: '', provider: '', api_key: '' });
      loadData();
    } catch (error) {
      console.error('Error adding API key:', error);
      alert('Failed to add API key. Please try again.');
    }
  };

  const handleAddSubscription = async () => {
    try {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      await supabase.from('user_subscriptions').insert({
        user_id: newSubscription.user_id,
        plan_id: newSubscription.plan_id,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
      });
      setShowAddSubscription(false);
      setNewSubscription({ user_id: '', plan_id: '' });
      loadData();
    } catch (error) {
      console.error('Error adding subscription:', error);
      alert('Error adding subscription. User may already have a subscription.');
    }
  };

  const handleAddPlan = async () => {
    try {
      await supabase.from('subscription_plans').insert({
        name: newPlan.name,
        monthly_price: newPlan.monthly_price,
        image_generations_limit: newPlan.image_generations_limit,
        is_active: true,
      });
      setShowAddPlan(false);
      setNewPlan({ name: '', monthly_price: 0, image_generations_limit: 0 });
      loadData();
    } catch (error) {
      console.error('Error adding plan:', error);
      alert('Error adding plan. Plan name must be unique.');
    }
  };

  const toggleApiKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error toggling API key status:', error);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);
      loadData();
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);
      loadData();
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }
    try {
      await supabase.from('user_subscriptions').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage users, API keys, subscriptions, and plans</p>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'plans'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Plans
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('api_keys')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'api_keys'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          API Keys
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      ) : (
        <Card>
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Admin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.full_name || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_admin
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {user.is_admin ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to ${user.is_admin ? 'remove admin privileges from' : 'grant admin privileges to'} ${user.email}?`)) {
                              toggleAdminStatus(user.id, user.is_admin);
                            }
                          }}
                          disabled={user.id === profile?.id}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'plans' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Plans</h3>
                <Button onClick={() => setShowAddPlan(true)}>Add Plan</Button>
              </div>

              {showAddPlan && (
                <Card className="mb-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Add New Plan</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Plan Name (e.g., Pro, Enterprise)"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Monthly Price (in cents, e.g., 1900 for $19.00)"
                      value={newPlan.monthly_price}
                      onChange={(e) => setNewPlan({ ...newPlan, monthly_price: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      placeholder="Image Generations Limit"
                      value={newPlan.image_generations_limit}
                      onChange={(e) => setNewPlan({ ...newPlan, image_generations_limit: parseInt(e.target.value) || 0 })}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={handleAddPlan}>Save</Button>
                      <Button variant="secondary" onClick={() => setShowAddPlan(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Generations</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{plan.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          ${(plan.monthly_price / 100).toFixed(2)}/mo
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {plan.image_generations_limit} images
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              plan.is_active
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to ${plan.is_active ? 'deactivate' : 'activate'} the plan "${plan.name}"?`)) {
                                togglePlanStatus(plan.id, plan.is_active);
                              }
                            }}
                          >
                            {plan.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Subscriptions</h3>
                <Button onClick={() => setShowAddSubscription(true)}>Assign Subscription</Button>
              </div>

              {showAddSubscription && (
                <Card className="mb-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Assign Subscription to User</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select User
                      </label>
                      <select
                        value={newSubscription.user_id}
                        onChange={(e) => setNewSubscription({ ...newSubscription, user_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Choose a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email} - {user.full_name || 'No name'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Plan
                      </label>
                      <select
                        value={newSubscription.plan_id}
                        onChange={(e) => setNewSubscription({ ...newSubscription, plan_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Choose a plan...</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - ${(plan.monthly_price / 100).toFixed(2)}/mo ({plan.image_generations_limit} images)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleAddSubscription} disabled={!newSubscription.user_id || !newSubscription.plan_id}>
                        Assign
                      </Button>
                      <Button variant="secondary" onClick={() => setShowAddSubscription(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Plan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Period End</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {sub.user_profiles?.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {sub.subscription_plans?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(sub.current_period_end).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteSubscription(sub.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'api_keys' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
                <Button onClick={() => setShowAddApiKey(true)}>Add API Key</Button>
              </div>

              {showAddApiKey && (
                <Card className="mb-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Add New API Key</h4>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>How to get a Google Gemini API Key:</strong>
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                      <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                      <li>Sign in with your Google account</li>
                      <li>Click "Create API Key" or "Get API Key"</li>
                      <li>Copy the API key (starts with "AIza...")</li>
                      <li>Use <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">google_gemini</code> as the provider name below</li>
                    </ol>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Name (e.g., Google Gemini API)"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    />
                    <Input
                      placeholder="Provider (must be: google_gemini)"
                      value={newApiKey.provider}
                      onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                    />
                    <Input
                      placeholder="API Key"
                      value={newApiKey.api_key}
                      onChange={(e) => setNewApiKey({ ...newApiKey, api_key: e.target.value })}
                      type="password"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleAddApiKey}
                        disabled={!newApiKey.name || !newApiKey.provider || !newApiKey.api_key}
                      >
                        Save
                      </Button>
                      <Button variant="secondary" onClick={() => setShowAddApiKey(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

{apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No API keys found. Click "Add API Key" to create one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Provider</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr key={key.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{key.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{key.provider}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                key.is_active
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {key.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {new Date(key.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to ${key.is_active ? 'deactivate' : 'activate'} the API key "${key.name}"?`)) {
                                  toggleApiKeyStatus(key.id, key.is_active);
                                }
                              }}
                            >
                              {key.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminPage;
