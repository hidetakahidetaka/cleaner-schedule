
import React from 'react';
import { Group } from '../types';

interface GroupSettingsProps {
    numGroups: number;
    setNumGroups: (num: number) => void;
    groups: Group[];
    onGroupNameChange: (id: number, name: string) => void;
    onGroupSizeChange: (id: number, size: string) => void;
    onFixedMembersChange: (id: number, members: string) => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({
    numGroups,
    setNumGroups,
    groups,
    onGroupNameChange,
    onGroupSizeChange,
    onFixedMembersChange
}) => {
    return (
        <section className="p-6 bg-purple-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">グループ設定</h2>
            <div className="mb-4">
                <label htmlFor="numGroups" className="block text-sm font-medium text-gray-700 mb-1">
                    グループ数
                </label>
                <input
                    type="number"
                    id="numGroups"
                    value={numGroups}
                    onChange={(e) => setNumGroups(parseInt(e.target.value, 10) || 0)}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
            </div>
            {groups.map((group, index) => (
                <div key={group.id} className="mb-6 p-4 border border-purple-200 rounded-md bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-purple-700 mb-3">{`グループ ${index + 1} の詳細`}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                        <div>
                            <label htmlFor={`groupName-${group.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                グループ名
                            </label>
                            <input
                                type="text"
                                id={`groupName-${group.id}`}
                                value={group.name}
                                onChange={(e) => onGroupNameChange(group.id, e.target.value)}
                                placeholder={`例: Aチーム`}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label htmlFor={`groupSize-${group.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                人数
                            </label>
                            <input
                                type="number"
                                id={`groupSize-${group.id}`}
                                value={group.size}
                                onChange={(e) => onGroupSizeChange(group.id, e.target.value)}
                                min="0"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor={`fixedMembers-${group.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            固定メンバー (カンマ区切り)
                            <span className="block text-xs text-gray-500">例: 山田,鈴木</span>
                        </label>
                        <input
                            type="text"
                            id={`fixedMembers-${group.id}`}
                            value={group.fixedMembers.join(', ')}
                            onChange={(e) => onFixedMembersChange(group.id, e.target.value)}
                            placeholder="例: 山田,鈴木"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                </div>
            ))}
        </section>
    );
};

export default GroupSettings;
