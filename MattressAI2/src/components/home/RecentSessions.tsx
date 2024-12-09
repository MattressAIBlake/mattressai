import React from 'react';
import { RotateCw, Ban, ThumbsDown, Edit, Users } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useSessionsStore } from '../sessions/sessionsStore';
import { Link } from 'react-router-dom';

const RecentSessions = () => {
  const recentSessions = useSessionsStore((state) => state.recentSessions || []);

  if (!recentSessions?.length) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
          <Link to="/sessions">
            <Button variant="secondary" size="sm" icon={Users}>
              Sessions
            </Button>
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500">
          No recent sessions available
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Sessions</h2>
        <Link to="/sessions">
          <Button variant="secondary" size="sm" icon={Users}>
            Sessions
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {recentSessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {session.customerName !== 'N/A' ? session.customerName[0] : 'N'}
              </div>
              <span className="font-medium">{session.customerName}</span>
              <span className="text-sm text-gray-500">{session.time}</span>
            </div>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <RotateCw className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <Ban className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ThumbsDown className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentSessions;