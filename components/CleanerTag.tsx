
import React from 'react';

interface CleanerTagProps {
    name: string;
    onRemove: (name: string) => void;
}

const CleanerTag: React.FC<CleanerTagProps> = ({ name, onRemove }) => {
    return (
        <span className="inline-flex items-center px-3 py-1 bg-indigo-200 text-indigo-800 text-sm font-medium rounded-full">
            {name}
            <button
                onClick={() => onRemove(name)}
                className="ml-2 -mr-1 text-indigo-600 hover:text-indigo-900 focus:outline-none"
                aria-label={`Remove ${name}`}
            >
                &times;
            </button>
        </span>
    );
};

export default CleanerTag;
