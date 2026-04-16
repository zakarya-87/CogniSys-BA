
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TMember, TOrgMemberStatus } from '../../../types';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Plus, UserPlus, Mail, Shield, MoreVertical } from 'lucide-react';

export const MembersView: React.FC = () => {
    const { t } = useTranslation(['settings', 'common']);
    const [loading, setLoading] = useState(false);
    
    const mockMembers: TMember[] = [
        { id: '1', name: 'Zakarya Boudjelel', email: 'zak@cognisys.ai', role: 'admin', status: 'active', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: '2', name: 'Sarah Chen', email: 'sarah@cognisys.ai', role: 'editor', status: 'active', avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: '3', name: 'Amine Rahal', email: 'amine@cognisys.ai', role: 'viewer', status: 'invited', avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('settings:teamMembers')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings:teamMembersDesc')}</p>
                </div>
                <Button className="bg-accent-purple hover:bg-accent-purple/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('settings:inviteMember')}
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings:member')}</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings:role')}</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settings:status')}</th>
                            <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {mockMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            <img className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-600" src={member.avatarUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                        <Shield className={`h-3.5 w-3.5 ${member.role === 'admin' ? 'text-accent-purple' : 'text-gray-400'}`} />
                                        <span className="capitalize">{member.role}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        member.status === 'active' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-accent-purple/5 dark:bg-accent-purple/10 border border-accent-purple/20 rounded-xl p-6 flex items-start gap-4">
                <div className="bg-accent-purple/20 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-accent-purple" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Bulk Invite?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">You can invite your entire department at once by uploading a CSV or connecting your Slack workspace.</p>
                    <Button variant="outline" size="sm" className="text-[10px] h-8 font-bold border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10">
                        LEARN MORE
                    </Button>
                </div>
            </div>
        </div>
    );
};
