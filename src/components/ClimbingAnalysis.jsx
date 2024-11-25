import React, { useMemo, useRef } from 'react';
import { TrendingUp, AlertCircle, Activity, Calendar, Dumbbell, Home, Target, Download, FileText } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { generateInsights, calculateProgressionRate, calculatePerformanceScore, predictGrade } from '../utils/analysis';
import { AskAI } from './AskAI';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const MetricCard = ({ title, value, unit = '', subtitle = '' }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-pink-700">{title}</h3>
    <p className="text-2xl font-bold mt-1 text-pink-900">
      {value !== null && value !== undefined ? `${value}${unit}` : 'N/A'}
    </p>
    {subtitle && (
      <p className="text-xs text-pink-600 mt-1">{subtitle}</p>
    )}
  </div>
);

const ClimbingAnalysis = ({ assessments }) => {
  const analysisRef = useRef(null);

  const exportFullAnalysis = async (format = 'images') => {
    if (analysisRef.current) {
      try {
        // Show loading state
        const loadingToast = toast.loading(`Generating ${format} analysis report...`);

        const element = analysisRef.current;
        const originalStyle = element.style.backgroundColor;
        element.style.backgroundColor = 'white';

        // Get dimensions
        const totalHeight = element.scrollHeight;
        const viewportHeight = Math.min(window.innerHeight, 1200); // Max height per page
        const numPages = Math.ceil(totalHeight / viewportHeight);

        if (format === 'pdf') {
          // PDF Export
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
          });

          for (let i = 0; i < numPages; i++) {
            const canvas = await html2canvas(element, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              windowWidth: element.scrollWidth,
              height: viewportHeight,
              y: i * viewportHeight,
              useCORS: true,
              onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.body.querySelector('[data-analysis-ref]');
                if (clonedElement) {
                  const charts = clonedElement.getElementsByClassName('recharts-wrapper');
                  Array.from(charts).forEach(chart => {
                    chart.style.visibility = 'visible';
                    chart.style.display = 'block';
                  });
                }
              }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
          }

          // Save PDF
          const date = new Date().toISOString().split('T')[0];
          pdf.save(`climbing-analysis-report-${date}.pdf`);
        } else {
          // Images Export (ZIP)
          const canvases = [];
          for (let i = 0; i < numPages; i++) {
            const canvas = await html2canvas(element, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              windowWidth: element.scrollWidth,
              height: viewportHeight,
              y: i * viewportHeight,
              useCORS: true,
              onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.body.querySelector('[data-analysis-ref]');
                if (clonedElement) {
                  const charts = clonedElement.getElementsByClassName('recharts-wrapper');
                  Array.from(charts).forEach(chart => {
                    chart.style.visibility = 'visible';
                    chart.style.display = 'block';
                  });
                }
              }
            });
            canvases.push(canvas);
          }

          // Create ZIP with images
          const zip = new JSZip();
          const date = new Date().toISOString().split('T')[0];
          
          for (let i = 0; i < canvases.length; i++) {
            const dataUrl = canvases[i].toDataURL('image/jpeg', 0.9);
            const base64Data = dataUrl.split(',')[1];
            zip.file(`climbing-analysis-page-${i + 1}.jpg`, base64Data, { base64: true });
          }

          const content = await zip.generateAsync({ type: 'blob' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `climbing-analysis-report-${date}.zip`;
          link.click();
        }

        // Restore original style
        element.style.backgroundColor = originalStyle;

        // Show success message
        toast.success(`Analysis report downloaded as ${format}!`, {
          id: loadingToast
        });
      } catch (err) {
        console.error('Error exporting analysis:', err);
        toast.error('Failed to generate report. Please try again.');
      }
    }
  };

  const processData = (data) => {
    if (!data || !Array.isArray(data)) return null;

    const latest = data[0];
    const chartData = data.map(entry => {
      return {
        date: formatDate(entry.fields.Date),
        grade: convertGradeToNumber(entry.fields.Grade),
        fingerStrength: parseFloat(entry.fields.FingerStrength) || 0,
        coreStrength: parseFloat(entry.fields.CoreStrength) || 0,
        trainingDays: parseInt(entry.fields.TrainingDays) || 0
      };
    }).reverse();

    return {
      latest,
      chartData,
      insights: generateInsights(data),
      performanceScore: calculatePerformanceScore(data),
      prediction: predictGrade(data),
      trainingDays: data.reduce((acc, curr) => acc + (parseInt(curr.fields.TrainingDays) || 0), 0),
      strengthProfile: {
        legSpread: latest.fields['LEG SPREAD'] || 'N/A',  // Keep for profile display only
        fingerStrength: latest.fields.FingerStrength || 'N/A',
        coreStrength: latest.fields.CoreStrength || 'N/A'
      }
    };
  };

  const processedData = useMemo(() => {
    if (!assessments || assessments.length === 0) return null;

    console.log('Raw assessments:', assessments);

    const latest = assessments[0]; // Assuming assessments are already sorted by date
    const insights = generateInsights(assessments);
    const performanceScore = calculatePerformanceScore(latest);
    const prediction = predictGrade(latest);

    // Transform and sort data for charts
    const chartData = assessments
      .sort((a, b) => new Date(a['Assessment Date']) - new Date(b['Assessment Date']))
      .map(assessment => {
        return {
          date: formatDate(assessment['Assessment Date']),
          fingerStrength: Number(assessment['Finger Strength Weight']) || 0,
          pullUps: Number(assessment['Pull Up Repetitions']) || 0,
          pushUps: Number(assessment['Push Up Repetitions']) || 0,
          toeToBar: Number(assessment['Toe To bar Repetitions']) || 0,
          rpeFingerStrength: Number(assessment['RPE FB']) || 0,
          rpePullUps: Number(assessment['RPE PullUPs']) || 0,
          rpePushUps: Number(assessment['RPE Pushups']) || 0,
          rpeToeToBar: Number(assessment['RPE T2B']) || 0,
          rpeSpread: Number(assessment['RPE Split']) || 0
        };
      });

    // Calculate training days per week
    const trainingDays = Object.values(latest.Training_Schedule || {})
      .filter(Boolean)
      .length;

    // Prepare strength profile data for radar chart
    const strengthProfile = [
      {
        metric: 'Finger Strength',
        value: Number(latest['Finger Strength Weight']) || 0,
        fullMark: 50
      },
      {
        metric: 'Pull-ups',
        value: Number(latest['Pull Up Repetitions']) || 0,
        fullMark: 30
      },
      {
        metric: 'Push-ups',
        value: Number(latest['Push Up Repetitions']) || 0,
        fullMark: 50
      },
      {
        metric: 'Toe to Bar',
        value: Number(latest['Toe To bar Repetitions']) || 0,
        fullMark: 20
      }
    ];

    console.log('Strength profile data:', strengthProfile);

    return {
      latest,
      chartData,
      insights,
      performanceScore,
      prediction,
      trainingDays,
      strengthProfile
    };
  }, [assessments]);

  if (!processedData) {
    return (
      <div className="bg-pink-100 text-pink-900 p-4 rounded-lg">
        No assessment data available.
      </div>
    );
  }

  const { latest, chartData, insights, performanceScore, prediction, trainingDays, strengthProfile } = processedData;

  return (
    <div ref={analysisRef} data-analysis-ref className="p-4 space-y-6 bg-white">
      {/* Export Buttons */}
      <div className="sticky top-0 z-50 flex justify-end gap-2 p-4 bg-white/80 backdrop-blur-sm">
        <button
          onClick={() => exportFullAnalysis('pdf')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors shadow-md"
        >
          <FileText size={20} />
          Export PDF
        </button>
        <button
          onClick={() => exportFullAnalysis('images')}
          className="flex items-center gap-2 px-4 py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors shadow-md"
        >
          <Download size={20} />
          Export Images
        </button>
      </div>

      {/* Overview Section */}
      <div className="bg-pink-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
          <Activity className="text-pink-500" />
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Performance Score"
            value={performanceScore}
            unit="/100"
          />
          <MetricCard
            title="Boulder Grade"
            value={latest['Boulder 80% Grade']}
            subtitle="80% Grade"
          />
          <MetricCard
            title="Lead Grade"
            value={latest['Lead 80% Grade']}
            subtitle="80% Grade"
          />
          <MetricCard
            title="Training Days"
            value={trainingDays}
            unit="/week"
          />
        </div>
      </div>

      {/* Progress Charts */}
      <div className="space-y-6">
        {/* Strength Profile */}
        <div className="bg-pink-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
            <Activity className="text-pink-500" />
            Strength Profile
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={strengthProfile} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid gridType="circle" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: '#be185d', fontSize: 14 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'auto']}
                  tick={{ fill: '#be185d' }}
                />
                <Radar
                  name="Current"
                  dataKey="value"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    border: '1px solid #fce7f3'
                  }}
                  formatter={(value, name, props) => [
                    `${value} ${props.payload.metric === 'Finger Strength' ? 'kg' : 
                      props.payload.metric === 'Leg Spread' ? 'm' : 'reps'}`,
                    'Current'
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend for metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {strengthProfile.map((item) => (
              <div key={item.metric} className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-pink-700">{item.metric}</div>
                <div className="text-lg font-bold text-pink-900">
                  {item.value} {item.metric === 'Finger Strength' ? 'kg' : 
                    item.metric === 'Leg Spread' ? 'm' : 'reps'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Finger Strength Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Finger Strength Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="fingerStrength"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE FB'] || 'N/A'}
            </div>
          </div>

          {/* Pull-ups Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Pull-ups Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pullUps"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE PullUPs'] || 'N/A'}
            </div>
          </div>

          {/* Push-ups Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Push-ups Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pushUps"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE Pushups'] || 'N/A'}
            </div>
          </div>

          {/* Toe to Bar Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Toe to Bar Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="toeToBar"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE T2B'] || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Prediction */}
      <div className="bg-pink-50 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
          <Target className="text-pink-500" />
          Grade Prediction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-pink-900 mb-2">Predicted Grade</h3>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-pink-600">{prediction?.predictedGrade || 'N/A'}</span>
                <span className="text-sm text-pink-700 px-2 py-1 bg-pink-50 rounded">
                  {prediction?.confidence} Confidence
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-pink-700">Strongest Area:</span>
                <span className="font-medium text-pink-900">{prediction?.strongest?.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-pink-700">Weakest Area:</span>
                <span className="font-medium text-pink-900">{prediction?.weakest?.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Training Recommendations</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-pink-700 mb-1">Primary Focus</h4>
                <p className="text-sm text-pink-900">{prediction?.recommendations?.primary?.exercises}</p>
                <p className="text-xs text-pink-600 mt-1">{prediction?.recommendations?.primary?.protocol}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-pink-700 mb-1">Secondary Focus</h4>
                <p className="text-sm text-pink-900">{prediction?.recommendations?.secondary?.exercises}</p>
                <p className="text-xs text-pink-600 mt-1">{prediction?.recommendations?.secondary?.protocol}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-pink-50 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
          <Target className="text-pink-500" />
          Training Goals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-pink-900 mb-3">5-Month Goal</h3>
            <p className="text-pink-700">
              {latest?.Goals?.['Five Month Goal'] || 'Not set'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-pink-900 mb-3">1-Year Goal</h3>
            <p className="text-pink-700">
              {latest?.Goals?.['One Year Goal'] || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Ask AI Coach */}
      <AskAI assessments={assessments} latestAssessment={latest} />

      {/* Equipment */}
      <div className="bg-pink-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
          <Home className="text-pink-500" />
          Home Equipment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(latest['Equipment'] || {}).map(([equipment, available]) => (
            <div
              key={equipment}
              className={`p-4 rounded-lg ${
                available
                  ? 'bg-pink-100 text-pink-900'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <div className="font-medium">{equipment}</div>
              <div className="text-sm mt-1">
                {available ? 'Available' : 'Not Available'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-pink-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
            <AlertCircle className="text-pink-500" />
            Insights & Recommendations
          </h2>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  insight.type === 'warning'
                    ? 'bg-pink-100 text-pink-900'
                    : insight.type === 'positive'
                    ? 'bg-green-100 text-green-900'
                    : 'bg-blue-100 text-blue-900'
                }`}
              >
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClimbingAnalysis;
