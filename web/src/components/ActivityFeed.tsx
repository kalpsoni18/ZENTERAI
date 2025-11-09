import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  resource: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No recent activity
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user}</span>{' '}
              <span className="text-gray-600">{activity.action}</span>{' '}
              <span className="text-gray-500">{activity.resource}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

