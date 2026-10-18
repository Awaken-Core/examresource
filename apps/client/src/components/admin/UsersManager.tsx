import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type User, type CurrentUser } from './api';
import { useAdminToast } from './AdminToast';

interface UsersManagerProps {
  currentUser: CurrentUser | null;
}

export function UsersManager({ currentUser }: UsersManagerProps) {
  const { showToast } = useAdminToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Confirmation dialog state
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: User;
    newRole: 'student' | 'editor' | 'admin';
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load user list.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleSelectChange = (user: User, newRole: 'student' | 'editor' | 'admin') => {
    if (user.id === currentUser?.id) {
      showToast('You cannot alter your own admin privileges.', 'error');
      return;
    }
    setPendingRoleChange({ user, newRole });
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;

    setIsUpdatingRole(true);
    try {
      await adminApi.updateUserRole(user.id, newRole);
      showToast(`Updated role for ${user.name || user.email} to ${newRole.toUpperCase()}.`);
      // Update locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setPendingRoleChange(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user role.', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-colors">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
          User Access & Roles
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Assign roles for the CMS. Administrators can manage the whole platform; Editors can write and manage articles; Students browse public content.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 text-rose-800 dark:text-rose-200 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-56 sm:w-72 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Role select */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="editor">Editors</option>
            <option value="student">Students</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
          Total Users: {users.length}
        </span>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-100 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Assigned Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded w-36" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-48" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-16" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-100 dark:bg-zinc-800 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    No users matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const roleBadge =
                    user.role === 'admin'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                      : user.role === 'editor'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 overflow-hidden shadow-xs">
                            {(() => {
                              const name = (user.name || user.email || 'U').trim();
                              const parts = name.split(/\s+/).filter(Boolean);
                              return parts.length > 1
                                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                                : name.slice(0, 2).toUpperCase();
                            })()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>{user.name || 'Unnamed user'}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {user.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{user.status || 'Active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge}`}>
                            {user.role.toUpperCase()}
                          </span>
                          <select
                            value={user.role}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'You cannot remove your own admin role' : 'Change user role'}
                            onChange={(e) =>
                              handleRoleSelectChange(
                                user,
                                e.target.value as 'student' | 'editor' | 'admin'
                              )
                            }
                            className="border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <option value="student">Student</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {pendingRoleChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingRole) setPendingRoleChange(null);
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Confirm Role Change
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1">
                  Change role for <strong>{pendingRoleChange.user.name || pendingRoleChange.user.email}</strong> to{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">
                    {pendingRoleChange.newRole}
                  </span>
                  ?
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                  {pendingRoleChange.newRole === 'admin'
                    ? 'Admins have full write and delete permissions over all articles, categories, and users.'
                    : pendingRoleChange.newRole === 'editor'
                    ? 'Editors can write and manage articles, but cannot modify other users or system configuration.'
                    : 'Students have read-only consumer access.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPendingRoleChange(null)}
                disabled={isUpdatingRole}
                className="px-3.5 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingRole && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Confirm Role Change</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
