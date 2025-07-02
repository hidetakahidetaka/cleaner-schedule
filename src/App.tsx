import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Group, Schedule, AiResponse } from './types';
import Modal from './components/Modal';
import InputSection from './components/InputSection';
import GroupSettings from './components/GroupSettings';
import ConditionsSection from './components/ConditionsSection';
import ScheduleOutput from './components/ScheduleOutput';

const App: React.FC = () => {
    const [startDate, setStartDate] = useState<string>('');
    const [numCleaners, setNumCleaners] = useState<number>(0);
    const [cleanerNames, setCleanerNames] = useState<string[]>([]);
    const [currentCleanerName, setCurrentCleanerName] = useState<string>('');
    const [numGroups, setNumGroups] = useState<number>(0);
    const [groups, setGroups] = useState<Group[]>([]);
    const [prevCombinations, setPrevCombinations] = useState<[string, string]>(['', '']);
    const [forbiddenPairs, setForbiddenPairs] = useState<string>('');
    const [desiredPairs, setDesiredPairs] = useState<string>('');
    const [generatedSchedules, setGeneratedSchedules] = useState<Schedule[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [modalMessage, setModalMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const showCustomModal = (message: string) => {
        setModalMessage(message);
        setShowModal(true);
    };

    useEffect(() => {
        const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => {
            const existingGroup = groups.find(g => g.id === i);
            return existingGroup ? { ...existingGroup } : { id: i, name: `グループ ${i + 1}`, size: 0, fixedMembers: [] };
        });
        setGroups(newGroups.slice(0, numGroups));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numGroups]);

    const handleAddCleanerName = () => {
        if (currentCleanerName && !cleanerNames.includes(currentCleanerName)) {
            setCleanerNames([...cleanerNames, currentCleanerName]);
            setCurrentCleanerName('');
        } else if (cleanerNames.includes(currentCleanerName)) {
            showCustomModal('この清掃員名は既に登録されています。');
        }
    };

    const handleRemoveCleanerName = (nameToRemove: string) => {
        setCleanerNames(cleanerNames.filter(name => name !== nameToRemove));
        setGroups(groups.map(group => ({
            ...group,
            fixedMembers: group.fixedMembers.filter(member => member !== nameToRemove)
        })));
    };

    const handleGroupNameChange = (id: number, newName: string) => {
        setGroups(groups.map(group => group.id === id ? { ...group, name: newName } : group));
    };

    const handleGroupSizeChange = (id: number, newSize: string) => {
        setGroups(groups.map(group => group.id === id ? { ...group, size: parseInt(newSize, 10) || 0 } : group));
    };

    const handleFixedMembersChange = (id: number, membersString: string) => {
        const members = membersString.split(',').map(name => name.trim()).filter(name => name !== '');
        setGroups(groups.map(group => group.id === id ? { ...group, fixedMembers: members } : group));
    };

    const parsePairs = (pairsString: string): string[][] => {
        if (!pairsString) return [];
        return pairsString.split(',').map(pair => pair.trim().split('-').map(name => name.trim()));
    };

    const validateInputs = useCallback(() => {
        if (!startDate) { showCustomModal('開始日を選択してください。'); return false; }
        if (numCleaners <= 0 || cleanerNames.length !== numCleaners) { showCustomModal(`清掃員の人数は ${numCleaners} 人で、登録されている清掃員名も ${numCleaners} 人である必要があります。現在 ${cleanerNames.length} 人登録されています。`); return false; }
        if (numGroups <= 0) { showCustomModal('グループ数を入力してください。'); return false; }

        const totalGroupSize = groups.reduce((sum, group) => sum + group.size, 0);
        if (totalGroupSize !== numCleaners) { showCustomModal(`各グループの合計人数が総清掃員の人数と一致していません。合計人数: ${totalGroupSize} 人、総清掃員数: ${numCleaners} 人。`); return false; }

        for (const group of groups) {
            if (!group.name) { showCustomModal('すべてのグループに名前を入力してください。'); return false; }
            if (group.size <= 0) { showCustomModal('すべてのグループに適切な人数を入力してください。'); return false; }
            if (group.fixedMembers.length > group.size) { showCustomModal(`${group.name} の固定メンバー数がグループの人数 (${group.size}人) を超えています。`); return false; }
            for (const fixedMember of group.fixedMembers) { if (!cleanerNames.includes(fixedMember)) { showCustomModal(`固定メンバー「${fixedMember}」は登録されている清掃員名ではありません。`); return false; } }
        }

        const allFixedMembers = groups.flatMap(g => g.fixedMembers);
        if (allFixedMembers.length !== new Set(allFixedMembers).size) { showCustomModal('複数のグループに同じ清掃員が固定メンバーとして設定されています。'); return false; }

        const checkPairs = (pairs: string[][], type: string) => {
            for (const pair of pairs) {
                if (pair.length !== 2) { showCustomModal(`${type}ペアの形式が正しくありません: ${pair.join('-')}。例: A-B`); return false; }
                if (!cleanerNames.includes(pair[0]) || !cleanerNames.includes(pair[1])) { showCustomModal(`${type}ペアに登録されていない清掃員名が含まれています: ${pair[0]}-${pair[1]}`); return false; }
                if (pair[0] === pair[1]) { showCustomModal(`${type}ペアに同じ清掃員名が含まれています: ${pair[0]}-${pair[1]}。`); return false; }
            }
            return true;
        };

        if (!checkPairs(parsePairs(forbiddenPairs), '組み合わせたくない')) return false;
        if (!checkPairs(parsePairs(desiredPairs), '組み合わせたい')) return false;

        for (const group of groups) {
            for (let i = 0; i < group.fixedMembers.length; i++) {
                for (let j = i + 1; j < group.fixedMembers.length; j++) {
                    const c1 = group.fixedMembers[i];
                    const c2 = group.fixedMembers[j];
                    if (parsePairs(forbiddenPairs).some(p => (p.includes(c1) && p.includes(c2)))) { showCustomModal(`固定メンバー「${c1}」と「${c2}」は同じグループに固定されていますが、組み合わせたくない人に設定されています。`); return false; }
                }
            }
        }

        for (const [d1, d2] of parsePairs(desiredPairs)) {
            const fixed1Group = groups.find(g => g.fixedMembers.includes(d1));
            const fixed2Group = groups.find(g => g.fixedMembers.includes(d2));
            if (fixed1Group && fixed2Group && fixed1Group.id !== fixed2Group.id) { showCustomModal(`「${d1}」と「${d2}」は組み合わせたい人に設定されていますが、異なるグループに固定されています。`); return false; }
        }

        return true;
    }, [startDate, numCleaners, cleanerNames, numGroups, groups, forbiddenPairs, desiredPairs]);

    const generateCombinationsWithAI = useCallback(async () => {
        if (!validateInputs()) return;

        setIsLoading(true);
        setGeneratedSchedules([]);

        const prompt = `
あなたは清掃チームのスケジュール作成を支援するAIアシスタントです。
以下の条件に基づいて、ユニークな清掃スケジュールの組み合わせを3つ提案してください。

# 条件

- **全清掃員リスト:** ${cleanerNames.join(', ')}
- **総人数:** ${numCleaners}人

- **グループ構成:**
${groups.map(g => `  - ${g.name}: ${g.size}人`).join('\n')}

- **固定メンバー (これらのメンバーは必ず指定のグループに含まれる必要があります):**
${groups.filter(g => g.fixedMembers.length > 0).map(g => `  - ${g.name}: ${g.fixedMembers.join(', ')}`).join('\n') || '  - なし'}

- **組み合わせたくないペア (これらのペアは同じグループに入れてはいけません):**
  - ${forbiddenPairs || 'なし'}

- **組み合わせたいペア (これらのペアは可能な限り同じグループに入れてください):**
  - ${desiredPairs || 'なし'}

- **前回の組み合わせ (可能であれば、これらと完全に同じグループは避けてください):**
  - ${prevCombinations[0] || 'なし'}
- **前々回の組み合わせ (可能であれば、これらと完全に同じグループは避けてください):**
  - ${prevCombinations[1] || 'なし'}

# 出力形式
- 必ず3つの異なるスケジュール案を生成してください。
- 応答は、以下の構造を持つJSONオブジェクトのみとしてください。前後に説明文や ```json ``` マークダウンを入れないでください。

\`\`\`json
{
  "schedules": [
    [
      { "name": "グループ名", "members": ["メンバー1", "メンバー2"] },
      { "name": "グループ名", "members": ["メンバー3", "メンバー4"] }
    ],
    [
      { "name": "グループ名", "members": ["メンバーA", "メンバーB"] },
      { "name": "グループ名", "members": ["メンバーC", "メンバーD"] }
    ],
    [
      { "name": "グループ名", "members": ["メンバーX", "メンバーY"] },
      { "name": "グループ名", "members": ["メンバーZ", "メンバーW"] }
    ]
  ]
}
\`\`\`
`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            let jsonStr = response.text().trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) {
                jsonStr = match[2].trim();
            }

            const parsedData: AiResponse = JSON.parse(jsonStr);

            if (parsedData.schedules && Array.isArray(parsedData.schedules)) {
                setGeneratedSchedules(parsedData.schedules);
            } else {
                throw new Error("AIからの応答形式が正しくありません。");
            }

        } catch (error) {
            console.error("AI schedule generation failed:", error);
            showCustomModal("AIによるスケジュール生成に失敗しました。条件を調整するか、時間をおいて再試行してください。");
        } finally {
            setIsLoading(false);
        }
    }, [cleanerNames, groups, numCleaners, forbiddenPairs, desiredPairs, prevCombinations, validateInputs]);


    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700">
                        AI清掃員スケジュール作成
                    </h1>
                    <p className="mt-2 text-gray-500">条件を入力して、AIに最適なスケジュール案を生成させます。</p>
                </header>
                
                {showModal && <Modal message={modalMessage} onClose={() => setShowModal(false)} />}

                <main className="space-y-8">
                    <InputSection
                        startDate={startDate}
                        setStartDate={setStartDate}
                        numCleaners={numCleaners}
                        setNumCleaners={(val) => { setNumCleaners(val); setCleanerNames([])}}
                        cleanerNames={cleanerNames}
                        currentCleanerName={currentCleanerName}
                        setCurrentCleanerName={setCurrentCleanerName}
                        onAddCleanerName={handleAddCleanerName}
                        onRemoveCleanerName={handleRemoveCleanerName}
                    />

                    <GroupSettings
                        numGroups={numGroups}
                        setNumGroups={(val) => {setNumGroups(val); setGroups([])}}
                        groups={groups}
                        onGroupNameChange={handleGroupNameChange}
                        onGroupSizeChange={handleGroupSizeChange}
                        onFixedMembersChange={handleFixedMembersChange}
                    />
                    
                    <ConditionsSection
                        prevCombinations={prevCombinations}
                        setPrevCombinations={setPrevCombinations}
                        forbiddenPairs={forbiddenPairs}
                        setForbiddenPairs={setForbiddenPairs}
                        desiredPairs={desiredPairs}
                        setDesiredPairs={setDesiredPairs}
                    />
                    
                    <div className="text-center pt-4">
                        <button
                            onClick={generateCombinationsWithAI}
                            disabled={isLoading}
                            className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    AIが生成中...
                                </span>
                            ) : (
                                'AIで組み合わせを生成'
                            )}
                        </button>
                    </div>

                    <ScheduleOutput schedules={generatedSchedules} startDate={startDate} />
                </main>
            </div>
        </div>
    );
};

export default App;