import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';
import { Shield, UserCheck, UserX } from 'lucide-react';

const SuperAdminPanel = () => {
  const { hasPermission, setUserRole } = useAuthStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: hasPermission('manage_roles')
  });

  if (!hasPermission('manage_roles')) {
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">User Management</h2>
      </div>

      <div className="space-y-4">
        {users?.map((user: any) => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {user.role}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={UserCheck}
                onClick={() => setUserRole(user.id, 'superadmin')}
                disabled={user.role === 'superadmin'}
              >
                Make Super Admin
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={UserX}
                onClick={() => setUserRole(user.id, 'merchant')}
                disabled={user.role === 'merchant'}
              >
                Remove Admin
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminPanel;