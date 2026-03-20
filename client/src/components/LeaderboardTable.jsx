import React from 'react';

const LeaderboardTable = ({ data = [] }) => {
    if (data.length === 0) {
        return <p className="text-center text-gray-500">No data available for this leaderboard.</p>;
    }

    const renderRankBadge = (rank) => {
      let badge;
      let tooltip;
      if (rank === 1) {
        badge = (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs shadow-md">
            1
          </span>
        );
        tooltip = "First Place!";
      } else if (rank === 2) {
        badge = (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-gray-800 font-bold text-xs shadow-md">
            2
          </span>
        );
        tooltip = "Second Place!";
      } else if (rank === 3) {
        badge = (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-300 text-orange-900 font-bold text-xs shadow-md">
            3
          </span>
        );
        tooltip = "Third Place!";
      } else {
        badge = rank;
      }

      return (
        <div className="flex items-center justify-center relative group">
          {badge}
          {tooltip && (
            <span className="absolute bottom-full mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
              {tooltip}
            </span>
          )}
        </div>
      );
    };

    return (
      <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rank
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Athlete
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((entry, index) => (
              <tr
                key={entry.athleteId}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                  {renderRankBadge(index + 1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {entry.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.location?.state || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-500">
                  {entry.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};

export default LeaderboardTable;
