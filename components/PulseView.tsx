
import React from 'react';
import { useCatalyst } from '../context/CatalystContext';
import { AI_TEAM_MEMBERS } from '../constants';
import { TActivity, TTeamMember } from '../types';
import { 
    Bell, 
    MessageSquare, 
    User, 
    Activity, 
    Clock, 
    ChevronRight,
    Sparkles,
    MessageCircle,
    UserCircle
} from 'lucide-react';

const ActivityCard: React.FC<{ activity: TActivity }> = ({ activity }) => {
    const getAuthor = (id: string): TTeamMember | { name: string, avatar: React.ReactNode, color: string } => {
        if (id === 'user') return { name: 'You', avatar: <User className="w-5 h-5"/>, color: 'bg-surface-darker/10 text-text-main-light dark:text-text-main-dark' };
        const agent = AI_TEAM_MEMBERS.find(m => m.id === id);
        return agent || { name: 'Unknown', avatar: '?', color: 'bg-surface-darker/10' };
    };

    const author = getAuthor(activity.authorId);

    return (
        <div className="bg-surface-light dark:bg-surface-darker rounded-2xl shadow-sm border border-border-light dark:border-border-dark p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6 group hover:shadow-md transition-all">
            <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-border-light dark:border-border-dark transition-transform group-hover:scale-105 duration-300 ${author.color}`}>
                    {typeof author.avatar === 'string' ? author.avatar : author.avatar}
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-base font-black text-text-main-light dark:text-text-main-dark mr-3 tracking-tight">{author.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark bg-surface-darker/5 dark:bg-surface-darker/20 px-2 py-0.5 rounded-full border border-border-light dark:border-border-dark">{activity.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted-light dark:text-text-muted-dark font-mono uppercase">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <div className="text-sm font-medium text-text-main-light dark:text-text-main-dark leading-relaxed">
                        <span className="font-black text-accent-purple uppercase tracking-wider text-[11px] mr-2">[{activity.initiativeTitle}]</span> {activity.description}
                    </div>

                    {/* Comments Thread */}
                    {activity.comments.length > 0 && (
                        <div className="mt-6 space-y-4 pl-6 border-l-2 border-border-light dark:border-border-dark">
                            {activity.comments.map(comment => {
                                const commenter = getAuthor(comment.authorId);
                                return (
                                    <div key={comment.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-border-light dark:border-border-dark ${commenter.color}`}>
                                            {typeof commenter.avatar === 'string' ? commenter.avatar : <User className="w-3.5 h-3.5"/>}
                                        </div>
                                        <div className="bg-surface-darker/5 dark:bg-surface-darker/20 rounded-2xl p-4 flex-grow border border-border-light dark:border-border-dark shadow-inner">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-xs font-black text-text-main-light dark:text-text-main-dark uppercase tracking-wider">{commenter.name}</span>
                                                <span className="text-[9px] font-bold text-text-muted-light dark:text-text-muted-dark font-mono">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-xs font-medium text-text-main-light dark:text-text-main-dark leading-relaxed">{comment.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const PulseView: React.FC = () => {
    const { activities, markActivitiesRead } = useCatalyst();

    React.useEffect(() => {
        markActivitiesRead();
    }, [markActivitiesRead]);

    return (
        <div className="h-full flex flex-col p-8 bg-surface-light dark:bg-surface-dark animate-in fade-in duration-700">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-accent-purple/10 rounded-2xl">
                        <Bell className="h-10 w-10 text-accent-purple" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-text-main-light dark:text-text-main-dark tracking-tighter flex items-center gap-3">
                            The Pulse
                            <Sparkles className="h-5 w-5 text-accent-purple animate-pulse" />
                        </h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-1 font-medium">Enterprise Activity Stream & AI Collaboration Feed.</p>
                    </div>
                </div>
                
                {/* AI Team Roster */}
                <div className="hidden lg:flex -space-x-3">
                    {AI_TEAM_MEMBERS.map(member => (
                        <div key={member.id} className="relative group cursor-help">
                            <div className={`w-12 h-12 rounded-2xl border-4 border-surface-light dark:border-surface-dark flex items-center justify-center text-xl shadow-xl transition-transform group-hover:-translate-y-2 duration-300 ${member.color}`}>
                                {member.avatar}
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block w-56 bg-surface-darker text-white text-xs rounded-2xl p-4 z-20 text-center shadow-2xl border border-border-dark animate-in zoom-in-95 duration-200">
                                <p className="font-black text-sm mb-1 tracking-tight">{member.name}</p>
                                <p className="text-text-muted-dark font-bold uppercase tracking-widest text-[10px]">{member.role}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-darker"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
                {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted-light dark:text-text-muted-dark opacity-40 gap-6">
                        <div className="p-8 bg-surface-darker/5 rounded-full">
                            <MessageCircle className="h-24 w-24" />
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black tracking-tight mb-2">No activity yet.</p>
                            <p className="text-sm font-medium">Create artifacts in projects to trigger team reactions.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {activities.map(activity => (
                            <ActivityCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
