
import React from 'react';
import { MoneyStatus } from '../types';

interface OptionBadgeProps {
    status: MoneyStatus;
}

const OptionBadge: React.FC<OptionBadgeProps> = ({ status }) => {
    const styles = {
        [MoneyStatus.ITM]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        [MoneyStatus.ATM]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        [MoneyStatus.OTM]: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    const labels = {
        [MoneyStatus.ITM]: 'Dentro (ITM)',
        [MoneyStatus.ATM]: 'No Dinheiro (ATM)',
        [MoneyStatus.OTM]: 'Fora (OTM)',
    };

    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default OptionBadge;
