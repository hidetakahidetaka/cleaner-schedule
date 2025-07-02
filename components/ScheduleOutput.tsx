
import React from 'react';
import { Schedule } from '../types';

interface ScheduleOutputProps {
    schedules: Schedule[];
    startDate: string;
}

const ScheduleOutput: React.FC<ScheduleOutputProps> = ({ schedules, startDate }) => {
    if (schedules.length === 0) {
        return null;
    }

    return (
        <section className="mt-8 p-6 bg-yellow-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">生成されたスケジュール</h2>
            {schedules.map((schedule, scheduleIndex) => (
                <div key={scheduleIndex} className="mb-6 p-4 border border-yellow-300 rounded-md bg-white shadow-sm">
                    <h3 className="text-xl font-semibold text-yellow-800 mb-3">
                        案 {scheduleIndex + 1}
                    </h3>
                    {startDate && (
                        <p className="text-gray-700 mb-2">
                            <strong className="text-yellow-900">開始日:</strong> {startDate}
                        </p>
                    )}
                    <div className="space-y-2">
                        {schedule.map((group, groupIndex) => (
                            <p key={groupIndex} className="text-gray-700">
                                <span className="font-medium text-yellow-900">{group.name}:</span>{' '}
                                {group.members.join(', ')}
                            </p>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

export default ScheduleOutput;
