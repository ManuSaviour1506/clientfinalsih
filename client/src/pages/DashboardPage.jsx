import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Link } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import TestCard from '../components/tests/TestCard';

const DashboardPage = () => {
    const [dashboardData, setDashboardData] = useState({ tests: [], submissions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // CORRECTED THE API ENDPOINT HERE
                const [testsRes, submissionsRes] = await Promise.all([
                    api.get('/tests'),
                    api.get('/submissions') // Was '/submissions/me'
                ]);
                setDashboardData({
                    tests: testsRes.data.data,
                    submissions: submissionsRes.data.data
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-amber-500">Your Dashboard</h1>

        {/* Available Tests Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Available Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.tests.map((test) => (
              <TestCard key={test._id} test={test} />
            ))}
          </div>
        </div>

        {/* Recent Submissions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Your Recent Submissions
          </h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Test Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Score
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Video
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.submissions.map((submission) => (
                  <tr
                    key={submission._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.test.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500 hover:text-amber-600 hover:underline">
                      <a
                        href={submission.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Video
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
};

export default DashboardPage;
