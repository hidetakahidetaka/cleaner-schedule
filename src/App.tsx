
import React, { useState, useEffect, useCallback } from 'react';
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
                    if (parsePairs(forbiddenPairs).some(p => (p.includes(c1) && p.includes(c2)))) { 
                        showCustomModal(`固定メンバー「${c1}」と「${c2}」は同じグループに固定されていますが、組み合わせたくない人に設定されています。`); 
                        return false; 
                    }
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
    
    const generateCombinations = useCallback(async () => {
        if (!validateInputs()) return;

        setIsLoading(true);
        setGeneratedSchedules([]);

        const requestBody = {
            numCleaners,
            cleanerNames,
            groups,
            forbiddenPairs,
            desiredPairs,
            prevCombinations,
        };

        try {
            const response = await fetch('/api/generate-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result: AiResponse | { error: string } = await response.json();

            if (!response.ok) {
                const errorMessage = (result as { error: string }).error || `サーバーエラーが発生しました: ${response.status}`;
                throw new Error(errorMessage);
            }

            const scheduleResponse = result as AiResponse;
            if (scheduleResponse.schedules && scheduleResponse.schedules.length > 0) {
                 setGeneratedSchedules(scheduleResponse.schedules);
            } else {
                showCustomModal('AIが有効なスケジュールを生成できませんでした。条件が厳しすぎるか、AIが応答しなかった可能性があります。');
            }

        } catch (error) {
            console.error("Error fetching schedule from API:", error);
            if (error instanceof Error) {
                showCustomModal(`スケジュールの生成中にエラーが発生しました: ${error.message}`);
            } else {
                showCustomModal("スケジュールの生成中に予期せぬエラーが発生しました。");
            }
        } finally {
            setIsLoading(false);
        }
    }, [cleanerNames, groups, forbiddenPairs, desiredPairs, prevCombinations, validateInputs, numCleaners]);


    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans text-gray-800">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700">
                        AI清掃員スケジュール作成
                    </h1>
                    <p className="mt-2 text-gray-500">条件を入力して、AIが最適な清掃スケジュール案を生成します。</p>
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
                            onClick={generateCombinations}
                            className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-blue-700 transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                            disabled={isLoading}
                        >
                            {isLoading ? 'AIが生成中...' : 'AIで組み合わせを生成'}
                        </button>
                    </div>

                    <ScheduleOutput schedules={generatedSchedules} startDate={startDate} />
                </main>
            </div>
        </div>
    );
};

export default App;
