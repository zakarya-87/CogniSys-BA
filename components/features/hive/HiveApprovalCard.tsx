
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert as ShieldExclamationIcon, CheckCircle as CheckCircleIcon, XCircle as XCircleIcon } from 'lucide-react';
import { THiveApprovalRequest } from '../../../types';

interface HiveApprovalCardProps {
  approvalRequest: THiveApprovalRequest;
  onApproval: (approved: boolean) => void;
}

export const HiveApprovalCard: React.FC<HiveApprovalCardProps> = ({ approvalRequest, onApproval }) => {
    const { t } = useTranslation('dashboard');

    return (
        <div className="flex justify-start animate-fade-in-down">
            <div className="max-w-[85%] rounded-xl p-0 shadow-lg border border-yellow-400/50 bg-surface-light dark:bg-surface-darker overflow-hidden">
                <div className="bg-yellow-100/50 dark:bg-yellow-900/40 p-3 flex items-center gap-2 border-b border-yellow-200/50 dark:border-yellow-800/50">
                    <ShieldExclamationIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">{t('hive.approvalRequired')}</span>
                </div>
                <div className="p-4">
                    <p className="text-sm text-text-light dark:text-text-dark mb-3">
                        <span className="font-bold">{t(`hive.agent${approvalRequest.agent}`, { defaultValue: approvalRequest.agent })}</span> {t('hive.wantsToPerform')} <span className="font-bold text-red-500">{approvalRequest.actionType.toUpperCase()}</span> {t('hive.action')}
                    </p>
                    <div className="bg-surface-light dark:bg-surface-darker p-3 rounded border border-border-light dark:border-border-dark font-mono text-xs text-gray-600 dark:text-gray-300 mb-4">
                        {approvalRequest.summary}
                        <pre className="mt-2 text-[10px] opacity-70">
                            {JSON.stringify(approvalRequest.data, null, 2)}
                        </pre>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onApproval(true)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <CheckCircleIcon className="h-4 w-4" /> {t('hive.approve')}
                        </button>
                        <button 
                            onClick={() => onApproval(false)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <XCircleIcon className="h-4 w-4" /> {t('hive.reject')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
