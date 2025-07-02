
import React from 'react';
import CleanerTag from './CleanerTag';

interface InputSectionProps {
    startDate: string;
    setStartDate: (date: string) => void;
    numCleaners: number;
    setNumCleaners: (num: number) => void;
    cleanerNames: string[];
    currentCleanerName: string;
    setCurrentCleanerName: (name: string) => void;
    onAddCleanerName: () => void;
    onRemoveCleanerName: (name: string) => void;
}

const InputSection: React.FC<InputSectionProps> = ({
    startDate,
    setStartDate,
    numCleaners,
    setNumCleaners,
    cleanerNames,
    currentCleanerName,
    setCurrentCleanerName,
    onAddCleanerName,
    onRemoveCleanerName
}) => {
    return (
        <section className="p-6 bg-indigo-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">基本情報</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        開始日
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="numCleaners" className="block text-sm font-medium text-gray-700 mb-1">
                        清掃員の人数
                    </label>
                    <input
                        type="number"
                        id="numCleaners"
                        value={numCleaners}
                        onChange={(e) => setNumCleaners(parseInt(e.target.value, 10) || 0)}
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="cleanerName" className="block text-sm font-medium text-gray-700 mb-1">
                    清掃員の名前を追加
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        id="cleanerName"
                        value={currentCleanerName}
                        onChange={(e) => setCurrentCleanerName(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') onAddCleanerName(); }}
                        placeholder="例: 山田太郎"
                        className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={cleanerNames.length >= numCleaners && numCleaners > 0}
                    />
                    <button
                        onClick={onAddCleanerName}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400"
                        disabled={cleanerNames.length >= numCleaners && numCleaners > 0}
                    >
                        追加
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {cleanerNames.map((name, index) => (
                        <CleanerTag key={index} name={name} onRemove={onRemoveCleanerName} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InputSection;
