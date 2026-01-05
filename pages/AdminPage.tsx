import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, UserProfile, UserSubscription, ApiKey } from '../lib/supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const AdminPage: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'api_keys' | 'subscriptions'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddApiKey, setShowAddApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState({ name: '', provider: '', api_key: '' });

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
        const { data } = await supabase
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });
        setApiKeys(data || []);
      } else if (activeTab === 'subscriptions') {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('*, subscription_plans(*), user_profiles(email)')
          .order('created_at', { ascending: false });
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    try {
      await supabase.from('api_keys').insert({
        name: newApiKey.name,
        provider: newApiKey.provider,
        api_key: newApiKey.api_key,
        created_by: profile?.id,
      });
      setShowAddApiKey(false);
      setNewApiKey({ name: '', provider: '', api_key: '' });
      loadData();
    } catch (error) {
      console.error('Error adding API key:', error);
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
            <div className="text-sm text-gray-500 dark:text-gray-500 mt-4 space-y-1">
              <p>Current user: {profile?.email || 'Not logged in'}</p>
              <p>User ID: {profile?.id || 'N/A'}</p>
              <p>Is Admin: {profile?.is_admin ? 'Yes' : 'No'}</p>
              <p>Profile loaded: {profile ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage users, API keys, and subscriptions</p>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('api_keys')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'api_keys'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Subscriptions
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

          {activeTab === 'api_keys' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h3>
                <Button onClick={() => setShowAddApiKey(true)}>Add API Key</Button>
              </div>

              {showAddApiKey && (
                <Card className="mb-4 bg-gray-50 dark:bg-gray-800">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Add New API Key</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Name (e.g., Google Gemini API)"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    />
                    <Input
                      placeholder="Provider (e.g., google_gemini)"
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
                      <Button onClick={handleAddApiKey}>Save</Button>
                      <Button variant="secondary" onClick={() => setShowAddApiKey(false)}>
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
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Period End</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Stripe ID</th>
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
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {sub.stripe_subscription_id || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminPage;
