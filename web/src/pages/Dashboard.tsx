import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StorageChart } from '@/components/StorageChart';
import { ActivityFeed } from '@/components/ActivityFeed';

interface UsageStats {
  storageUsedGB: number;
  storageQuotaGB: number;
  filesCount: number;
  usersCount: number;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
    resource: string;
  }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const usage = await api.getUsage();
      setStats(usage);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const storagePercent = (stats.storageUsedGB / stats.storageQuotaGB) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your organization</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="text-sm text-gray-600 mb-1">Storage Used</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.storageUsedGB.toFixed(2)} GB
          </div>
          <div className="text-xs text-gray-500 mt-1">
            of {stats.storageQuotaGB} GB
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="text-sm text-gray-600 mb-1">Files</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.filesCount.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="text-sm text-gray-600 mb-1">Team Members</div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.usersCount}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft">
          <div className="text-sm text-gray-600 mb-1">Storage Usage</div>
          <div className="text-2xl font-semibold text-gray-900">
            {storagePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Over Time</h2>
          <StorageChart data={[]} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <ActivityFeed activities={stats.recentActivity} />
        </div>
      </div>
    </div>
  );
}

