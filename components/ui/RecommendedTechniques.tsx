import React from 'react';
import { useTranslation } from 'react-i18next';
import { TRecommendedTechnique } from '../../types';
import { Spinner } from './Spinner';

interface RecommendedTechniquesProps {
    techniques: TRecommendedTechnique[];
    isLoading: boolean;
    onSelectTechnique: (techniqueName: string) => void;
}

const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.62a6.01 6.01 0 00-3 0a6.01 6.01 0 001.5 11.62z" /></svg>;
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>;

export const RecommendedTechniques: React.FC<RecommendedTechniquesProps> = ({ techniques, isLoading, onSelectTechnique }) => {
    const { t } = useTranslation(['dashboard']);
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <LightBulbIcon className="h-6 w-6 mr-2 text-yellow-400" />
                {t('dashboard:strategy.recs.title', 'Recommended Techniques')}
            </h3>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Spinner />
                </div>
            ) : (
                <div className="space-y-3">
                    {(Array.isArray(techniques) ? techniques : []).map((tech, index) => (
                        <div key={tech.name || index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">{tech.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 my-1">{tech.justification}</p>
                            <button 
                                onClick={() => onSelectTechnique(tech.name)}
                                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center group"
                            >
                                {t('dashboard:strategy.recs.launch', 'Launch Tool')}
                                <ArrowRightIcon className="h-4 w-4 ml-1 transform transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
