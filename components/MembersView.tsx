import React, { useEffect, useState } from 'react';
import { UserMinus, Shield, RefreshCw, UserPlus, Send } from 'lucide-react';
import { MemberAPI, InvitationAPI } from '../src/services/api';
import { useCatalyst } from '../context/CatalystContext';
import { UserRole } from '../../types';

interface Member { userId: string; role: UserRole; }

const ROLES: UserRole[] = ['admin', 'member', 'viewer'];

export const MembersView: React.FC = () => {
  const { organizations, user } = useCatalyst();
  const orgId = organizations[0]?.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  const fetchMembers = () => {
    if (!orgId) return;
    setLoading(true);
    MemberAPI.list(orgId)
      .then((r) => setMembers((r.data as any).members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchMembers, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !inviteEmail) return;
    setInviting(true);
    setInviteMsg('');
    try {
      await InvitationAPI.send(orgId, inviteEmail, inviteRole);
      setInviteMsg(`✓ Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch {
      setInviteMsg('✗ Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!orgId || !confirm('Remove this member?')) return;
    await MemberAPI.remove(orgId, userId).catch(() => {});
    fetchMembers();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!orgId) return;
    await MemberAPI.changeRole(orgId, userId, role).catch(() => {});
    fetchMembers();
  };

  if (!orgId) return <div className="p-6 text-slate-400">No organisation found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Shield className="w-5 h-5 text-indigo-400" /> Members
      </h2>

      {/* Invite form */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Invite Member
        </h3>
        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" /> {inviting ? 'Sending…' : 'Invite'}
          </button>
        </form>
        {inviteMsg && (
          <p className={`mt-2 text-xs ${inviteMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{inviteMsg}</p>
        )}
      </div>

      {/* Members list */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-300">Current Members</span>
          <button onClick={fetchMembers} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="divide-y divide-slate-700/50">
          {loading && (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">Loading…</div>
          )}
          {!loading && members.length === 0 && (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">No members found.</div>
          )}
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 text-xs font-bold flex-shrink-0">
                {m.userId.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-slate-300 font-mono truncate">{m.userId}</span>
              <select
                value={m.role}
                onChange={(e) => handleRoleChange(m.userId, e.target.value as UserRole)}
                disabled={m.userId === user?.id}
                className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {m.userId !== user?.id && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove member"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
