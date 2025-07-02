
import React from 'react';

interface ConditionsSectionProps {
    prevCombinations: [string, string];
    setPrevCombinations: (combos: [string, string]) => void;
    forbiddenPairs: string;
    setForbiddenPairs: (pairs: string) => void;
    desiredPairs: string;
    setDesiredPairs: (pairs: string) => void;
    specialRequests: string;
    setSpecialRequests: (requests: string) => void;
}

const ConditionsSection: React.FC<ConditionsSectionProps> = ({
    prevCombinations,
    setPrevCombinations,
    forbiddenPairs,
    setForbiddenPairs,
    desiredPairs,
    setDesiredPairs,
    specialRequests,
    setSpecialRequests
}) => {
    return (
        <section className="p-6 bg-green-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-green-600 mb-4">組み合わせ条件</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                        特別なリクエスト (任意)
                        <span className="block text-xs text-gray-500">例: 各グループに必ずベテランを1名以上配置してください。</span>
                    </label>
                    <textarea
                        id="specialRequests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={3}
                        placeholder="AIへの特別な指示があれば入力してください。"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="forbiddenPairs" className="block text-sm font-medium text-gray-700 mb-1">
                        組み合わせたくない人 (例: 山田-鈴木,佐藤-田中)
                    </label>
                    <input
                        type="text"
                        id="forbiddenPairs"
                        value={forbiddenPairs}
                        onChange={(e) => setForbiddenPairs(e.target.value)}
                        placeholder="例: 山田-鈴木,佐藤-田中"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <label htmlFor="desiredPairs" className="block text-sm font-medium text-gray-700 mb-1">
                        組み合わせたい人 (例: 山田-佐藤,鈴木-田中)
                    </label>
                    <input
                        type="text"
                        id="desiredPairs"
                        value={desiredPairs}
                        onChange={(e) => setDesiredPairs(e.target.value)}
                        placeholder="例: 山田-佐藤,鈴木-田中"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                 <div>
                    <label htmlFor="prevCombination1" className="block text-sm font-medium text-gray-700 mb-1">
                        前回組み合わせ (任意)
                        <span className="block text-xs text-gray-500">例: グループA: 山田,鈴木; グループB: 佐藤,田中</span>
                    </label>
                    <textarea
                        id="prevCombination1"
                        value={prevCombinations[0]}
                        onChange={(e) => setPrevCombinations([e.target.value, prevCombinations[1]])}
                        rows={2}
                        placeholder="例: グループA: 山田,鈴木; グループB: 佐藤,田中"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="prevCombination2" className="block text-sm font-medium text-gray-700 mb-1">
                        前々回組み合わせ (任意)
                    </label>
                    <textarea
                        id="prevCombination2"
                        value={prevCombinations[1]}
                        onChange={(e) => setPrevCombinations([prevCombinations[0], e.target.value])}
                        rows={2}
                        placeholder="例: グループX: 山田,佐藤; グループY: 鈴木,田中"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    ></textarea>
                </div>
            </div>
        </section>
    );
};

export default ConditionsSection;