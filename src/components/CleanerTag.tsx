
import React from 'react';
import { Cleaner } from '../types';

interface CleanerTagProps {
    cleaner: Cleaner;
    onRemove: (name: string) => void;
}

const CleanerTag: React.FC<CleanerTagProps> = ({ cleaner, onRemove }) => {
    return (
        <span className="inline-flex items-center px-3 py-1 bg-indigo-200 text-indigo-800 text-sm font-medium rounded-full">
            {cleaner.name}
            {cleaner.role && <span className="text-xs ml-1 text-indigo-600">({cleaner.role})</span>}
            <button
                onClick={() => onRemove(cleaner.name)}
                className="ml-2 -mr-1 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                aria-label={`Remove ${cleaner.name}`}
            >
                &times;
            </button>
        </span>
    );
};

export default CleanerTag;