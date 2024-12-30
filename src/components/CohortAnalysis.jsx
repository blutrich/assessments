import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Activity, TrendingUp, Award } from 'lucide-react';

function CohortAnalysis({ usersData }) {
  const [cohortData, setCohortData] = useState({
    byGrade: {},
    metrics: {
      fingerStrength: [],
      pullUps: [],
      pushUps: [],
      toeToBar: []
    }
  });

  useEffect(() => {
    analyzeCohorts(usersData);
  }, [usersData]);

  const analyzeCohorts = (users) => {
    const gradeGroups = {};
    const metrics = {
      fingerStrength: [],
      pullUps: [],
      pushUps: [],
      toeToBar: []
    };

    users.forEach(user => {
      const assessment = user.latestAssessment;
      const boulderGrade = assessment['Boulder 80% Grade'] || 'Ungraded';
      
      // Validate and clean input values
      let bodyWeight = Number(assessment['Personal Info']['Weight']);
      let addedWeight = Number(assessment['Finger Strength Weight']);

      // Detailed validation logging
      if (boulderGrade === 'V7-8') {
        console.log('Found V7-8 athlete:', {
          email: user.email,
          rawBodyWeight: assessment['Personal Info']['Weight'],
          rawAddedWeight: assessment['Finger Strength Weight'],
          parsedBodyWeight: bodyWeight,
          parsedAddedWeight: addedWeight
        });
      }

      // Validation checks
      if (isNaN(bodyWeight) || bodyWeight <= 0) {
        console.warn(`Invalid body weight for user ${user.email}:`, bodyWeight);
        bodyWeight = 70; // Default to 70kg if invalid
      }
      if (isNaN(addedWeight)) {
        console.warn(`Invalid added weight for user ${user.email}:`, addedWeight);
        addedWeight = 0;
      }
      if (addedWeight > 200) {
        console.warn(`Suspiciously high added weight for user ${user.email}:`, addedWeight);
      }

      // Calculate finger strength with bounds checking
      let fingerStrength = 1;
      if (addedWeight > 0) {
        fingerStrength = (addedWeight + bodyWeight) / bodyWeight;
        
        // Log if the ratio seems unreasonable
        if (fingerStrength > 3) {
          console.warn(`Very high strength ratio for user ${user.email}:`, {
            bodyWeight,
            addedWeight,
            ratio: fingerStrength
          });
        }
      }

      // Group by grade
      if (!gradeGroups[boulderGrade]) {
        gradeGroups[boulderGrade] = {
          grade: boulderGrade,
          count: 0,
          avgFingerStrength: 0,
          avgPullUps: 0,
          avgPushUps: 0,
          avgToeToBar: 0,
          totalFingerStrength: 0,
          totalPullUps: 0,
          totalPushUps: 0,
          totalToeToBar: 0,
          users: [] // Track users in each group for debugging
        };
      }

      const group = gradeGroups[boulderGrade];
      group.count++;
      group.users.push({
        email: user.email,
        bodyWeight,
        addedWeight,
        fingerStrength
      });

      // Calculate relative strength metrics
      const pullUps = Number(assessment['Pull Up Repetitions']) / bodyWeight || 0;
      const pushUps = Number(assessment['Push Up Repetitions']) / bodyWeight || 0;
      const toeToBar = Number(assessment['Toe To bar Repetitions']) / bodyWeight || 0;

      group.totalFingerStrength += fingerStrength;
      group.totalPullUps += pullUps;
      group.totalPushUps += pushUps;
      group.totalToeToBar += toeToBar;

      // Add to metrics arrays for distribution analysis
      metrics.fingerStrength.push({ value: fingerStrength, grade: boulderGrade });
      metrics.pullUps.push({ value: pullUps, grade: boulderGrade });
      metrics.pushUps.push({ value: pushUps, grade: boulderGrade });
      metrics.toeToBar.push({ value: toeToBar, grade: boulderGrade });
    });

    // Calculate averages
    Object.values(gradeGroups).forEach(group => {
      group.avgFingerStrength = group.totalFingerStrength / group.count;
      group.avgPullUps = group.totalPullUps / group.count;
      group.avgPushUps = group.totalPushUps / group.count;
      group.avgToeToBar = group.totalToeToBar / group.count;
    });

    // Log final averages for each grade
    Object.entries(gradeGroups).forEach(([grade, data]) => {
      console.log(`Grade ${grade} metrics:`, {
        count: data.count,
        avgFingerStrength: data.totalFingerStrength / data.count,
        users: data.users
      });
    });

    setCohortData({
      byGrade: gradeGroups,
      metrics
    });
  };

  const gradeOrder = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12'];
  
  const chartData = Object.values(cohortData.byGrade)
    .sort((a, b) => {
      const aIndex = gradeOrder.indexOf(a.grade);
      const bIndex = gradeOrder.indexOf(b.grade);
      return aIndex - bIndex;
    });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Athletes</p>
              <p className="text-2xl font-bold text-indigo-600">{usersData.length}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-indigo-600">
                {chartData.length > 0 ? 
                  chartData[Math.floor(chartData.length / 2)].grade : 
                  'N/A'}
              </p>
            </div>
            <Award className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Common Grade</p>
              <p className="text-2xl font-bold text-indigo-600">
                {chartData.reduce((prev, current) => 
                  (prev.count > current.count) ? prev : current
                , { count: 0, grade: 'N/A' }).grade}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Grades</p>
              <p className="text-2xl font-bold text-indigo-600">{Object.keys(cohortData.byGrade).length}</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Metrics by Grade Charts */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Finger Strength by Grade (Total Weight / Body Weight)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis 
                  label={{ value: 'Added Weight % of BW', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${((value - 1) * 100).toFixed(0)}%`}
                  domain={[1, (dataMax) => Math.min(dataMax, 3)]} // Cap at 200% added weight
                />
                <Tooltip 
                  formatter={(value) => [`+${((value - 1) * 100).toFixed(1)}% BW`, 'Added Weight']}
                />
                <Legend />
                <Bar 
                  dataKey="avgFingerStrength" 
                  fill="#8884d8" 
                  name="Added Weight % of BW"
                  label={{ 
                    position: 'top',
                    formatter: (value) => `+${((value - 1) * 100).toFixed(0)}%`
                  }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pull-ups by Grade</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis 
                    label={{ value: 'Reps/BW', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Avg Pull-ups']}
                  />
                  <Bar dataKey="avgPullUps" fill="#82ca9d" name="Pull-ups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Push-ups by Grade</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis 
                    label={{ value: 'Reps/BW', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Avg Push-ups']}
                  />
                  <Bar dataKey="avgPushUps" fill="#ffc658" name="Push-ups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Toe-to-Bar by Grade</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis 
                    label={{ value: 'Reps/BW', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Avg Toe-to-Bar']}
                  />
                  <Bar dataKey="avgToeToBar" fill="#ff7300" name="Toe-to-Bar" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Athletes</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Finger Strength</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Pull-ups</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Push-ups</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Toe-to-Bar</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {chartData.map((grade) => (
              <tr key={grade.grade}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{grade.grade}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grade.count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{((grade.avgFingerStrength - 1) * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(grade.avgPullUps * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(grade.avgPushUps * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(grade.avgToeToBar * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CohortAnalysis;
