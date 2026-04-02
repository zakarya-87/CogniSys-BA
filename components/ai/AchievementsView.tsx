import React from 'react';
import { TShowcaseItem, TBacklogItem } from '../../types';

interface AchievementsViewProps {
    items: TShowcaseItem[];
    backlogItems: TBacklogItem[];
}

const ShowcaseCard: React.FC<{ item: TShowcaseItem; backlogItems: TBacklogItem[] }> = ({ item, backlogItems }) => {
    const completed = item.completedItems.map(id => backlogItems.find(b => b.id === id)).filter(Boolean);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden group">
            <div className="relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{item.description}</p>
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase mb-2">Completed Backlog Items</h4>
                    <ul className="space-y-1">
                        {completed.map(bItem => bItem && (
                            <li key={bItem.id} className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                                <CheckCircleIcon className="h-4 w-4 mr-2 text-accent-emerald flex-shrink-0" />
                                <span className="line-through text-gray-500 dark:text-gray-400">{bItem.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({ items, backlogItems }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg">
             <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Development Achievements</h2>
                <p className="text-gray-600 dark:text-gray-400">A showcase of completed features and milestones for this initiative.</p>
            </div>
            {items.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <ShowcaseCard key={item.id} item={item} backlogItems={backlogItems} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <TrophyIcon className="mx-auto h-12 w-12 text-text-muted-dark" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Achievements Yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete items from the backlog to see them here.</p>
                </div>
            )}
        </div>
    );
};

// Icons
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const TrophyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.5-3.419c.636-.88 1.57-1.545 2.581-2.055a4.5 4.5 0 014.638 0c1.01.51 1.945 1.175 2.581 2.055a9.75 9.75 0 011.5 3.419zM12 2.25c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5zm0 0v-1.5" /></svg>
);
