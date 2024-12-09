import React, { useState } from 'react';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { User, Shield, Users, Bell, Building2, Plus, X, Mail, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  status: 'active' | 'pending';
}

const AccountSettings = () => {
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('staff');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', email: 'owner@example.com', name: 'John Owner', role: 'owner', status: 'active' },
    { id: '2', email: 'manager@example.com', name: 'Sarah Manager', role: 'manager', status: 'active' },
    { id: '3', email: 'staff@example.com', name: 'Mike Staff', role: 'staff', status: 'pending' },
  ]);

  const handleInvite = () => {
    // Handle invite logic here
    console.log('Inviting:', inviteEmail, inviteRole);
    setShowInviteForm(false);
    setInviteEmail('');
    setInviteRole('staff');
  };

  const handlePasswordChange = () => {
    // Handle password change logic here
    console.log('Changing password');
  };

  const handleRoleChange = (memberId: string, newRole: TeamMember['role']) => {
    setTeamMembers(members => 
      members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Profile Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Email">
            <input 
              type="email" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              value={user?.email || ''} 
              disabled 
            />
          </FormField>

          <FormField label="Display Name">
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="Enter your name"
              defaultValue={user?.displayName || ''}
            />
          </FormField>

          <FormField label="Phone Number">
            <input 
              type="tel" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="(555) 123-4567"
            />
          </FormField>

          <FormField label="Job Title">
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg border-gray-200" 
              placeholder="Store Manager"
            />
          </FormField>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="primary">
            Save Profile
          </Button>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Security Settings</h2>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Current Password">
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded-lg border-gray-200" 
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="New Password">
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-lg border-gray-200" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormField>

              <FormField label="Confirm New Password">
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-lg border-gray-200" 
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              variant="primary"
              onClick={handlePasswordChange}
              disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              Update Password
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                <p className="text-xs text-gray-500 mt-1">Currently disabled</p>
              </div>
              <Button variant="secondary">Enable 2FA</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Team Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Team Management</h2>
          </div>
          <Button variant="secondary" onClick={() => setShowInviteForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        </div>

        {showInviteForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Invite New Team Member</h3>
              <button onClick={() => setShowInviteForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Email">
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border rounded-lg border-gray-200" 
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </FormField>
              <FormField label="Role">
                <select 
                  className="w-full px-3 py-2 border rounded-lg border-gray-200"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </FormField>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="primary" onClick={handleInvite} disabled={!inviteEmail}>
                Send Invitation
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {member.name[0]}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.status === 'pending' 
                    ? 'bg-yellow-50 text-yellow-600' 
                    : 'bg-green-50 text-green-600'
                }`}>
                  {member.status === 'pending' ? 'Pending' : 'Active'}
                </span>
                <select 
                  className="px-3 py-1.5 text-sm border rounded-lg border-gray-200"
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                  disabled={member.role === 'owner'}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Notification Preferences</h2>
        </div>
        
        <div className="space-y-4">
          <FormField label="Email Notifications">
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-600">New lead notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-600">Team member updates</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-600">Daily summary reports</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                <span className="text-sm text-gray-600">Marketing updates</span>
              </label>
            </div>
          </FormField>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="primary">
            Update Preferences
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AccountSettings;