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
import { generateInsights, calculateProgressionRate, predictGrade } from '../utils/analysis';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import CoachingRoadmap from './CoachingRoadmap';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatMetricValue = (value, type) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'height':
      return parseFloat(value).toFixed(1);
    case 'weight':
      return parseFloat(value).toFixed(1);
    case 'percentage':
      return parseFloat(value).toFixed(1);
    default:
      return value;
  }
};

const MetricCard = ({ title, value, unit = '', subtitle = '', type = 'default' }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    <p className="text-2xl font-bold mt-1 text-indigo-700">
      {value !== null && value !== undefined ? `${formatMetricValue(value, type)}${unit}` : 'N/A'}
    </p>
    {subtitle && (
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    )}
  </div>
);

const ClimbingAnalysis = ({ assessments }) => {
  const analysisRef = useRef(null);

  const calculateFingerStrength = (assessment) => {
    if (!assessment || !assessment['Personal Info']) return 100;
    
    const bodyWeight = Number(assessment['Personal Info']['Weight']) || 0;
    const addedWeight = Number(assessment['Finger Strength Weight']) || 0;
    
    if (bodyWeight <= 0) return 100; // Return baseline if no valid body weight
    
    // Calculate total weight as percentage of body weight
    const totalWeight = addedWeight + bodyWeight;
    const strengthPercentage = (totalWeight / bodyWeight) * 100;
    
    console.log('Finger Strength Calculation:', {
      bodyWeight,
      addedWeight,
      totalWeight,
      percentage: strengthPercentage
    });
    
    return strengthPercentage;
  };

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

  const processData = useMemo(() => {
    if (!assessments || assessments.length === 0) return null;

    console.log('Raw assessments:', assessments);

    // Sort assessments by date (newest first)
    const sortedAssessments = [...assessments].sort((a, b) => 
      new Date(b['Assessment Date']) - new Date(a['Assessment Date'])
    );

    // Get the latest assessment with null checks
    const latest = sortedAssessments[0] || {};
    const personalInfo = latest['Personal Info'] || {};
    
    // Safe access to values with defaults
    console.log('Latest assessment:', latest);
    console.log('Weight:', personalInfo['Weight']);
    console.log('Finger Strength Weight:', latest['Finger Strength Weight']);

    const fingerStrengthPct = calculateFingerStrength(latest);
    console.log('Finger Strength %:', fingerStrengthPct);

    const insights = generateInsights(sortedAssessments);
    const prediction = predictGrade(latest);

    // Transform and sort data for charts (oldest to newest) with null checks
    const chartData = [...sortedAssessments]
      .reverse()
      .map(assessment => {
        if (!assessment || !assessment['Personal Info']) {
          console.warn('Invalid assessment data:', assessment);
          return null;
        }

        const weight = Number(assessment['Personal Info']['Weight']) || 0;
        const addedWeight = Number(assessment['Finger Strength Weight']) || 0;
        const strengthPct = calculateFingerStrength(assessment);
        
        console.log('Assessment date:', assessment['Assessment Date']);
        console.log('Weight:', weight);
        console.log('Added weight:', addedWeight);
        console.log('Strength %:', strengthPct);
        
        return {
          date: formatDate(assessment['Assessment Date']) || 'Unknown Date',
          fingerStrengthPct: strengthPct || 100,
          fingerStrengthWeight: addedWeight || 0,
          bodyWeight: weight || 0,
          pullUps: Number(assessment['Pull Up Repetitions']) || 0,
          pushUps: Number(assessment['Push Up Repetitions']) || 0,
          toeToBar: Number(assessment['Toe To bar Repetitions']) || 0,
          rpeFingerStrength: Number(assessment['RPE Finger Strength']) || 0,
          rpePullUps: Number(assessment['RPE Pull Ups']) || 0,
          rpePushUps: Number(assessment['RPE Push Ups']) || 0,
          rpeToeToBar: Number(assessment['RPE Toe To Bar']) || 0,
          rpeSpread: Number(assessment['RPE Leg Spread']) || 0
        };
      })
      .filter(Boolean); // Remove any null entries

    // Calculate training days per week (excluding rest days)
    const trainingSchedule = latest.Training_Schedule || {};
    console.log('Training Schedule:', trainingSchedule);

    // Convert the schedule to an array of activities
    const activities = Object.values(trainingSchedule).filter(Boolean);
    console.log('Activities:', activities);

    // Count days with actual training (excluding rest days and empty slots)
    const trainingDays = activities.filter(activity => 
      activity && 
      !activity.toLowerCase().includes('rest') && 
      !activity.toLowerCase().includes('מנוחה')
    ).length;

    console.log('Training days:', trainingDays);

    // Format training schedule for display
    const formattedSchedule = Object.entries(latest.Training_Schedule || {})
      .map(([day, activity]) => ({
        day,
        activity: activity || 'Rest'
      }));

    console.log('Formatted schedule:', formattedSchedule);

    // Prepare strength profile data for radar chart
    const bodyWeight = Number(latest['Personal Info']['Weight']) || 1; // prevent division by zero
    const addedWeight = Number(latest['Finger Strength Weight']) || 0;
    const strengthProfile = [
      {
        metric: 'Finger Strength',
        value: ((addedWeight + bodyWeight) / bodyWeight) || 1,
        fullMark: 2.0, // Adjusted for percentage display (200% max)
        rawValue: `${addedWeight}kg added (${((addedWeight + bodyWeight) / bodyWeight * 100).toFixed(1)}% BW)`
      },
      {
        metric: 'Pull-ups',
        value: Number(latest['Pull Up Repetitions']) / bodyWeight || 0,
        fullMark: 0.5,
        rawValue: `${Number(latest['Pull Up Repetitions']) || 0} reps`
      },
      {
        metric: 'Push-ups',
        value: Number(latest['Push Up Repetitions']) / bodyWeight || 0,
        fullMark: 1.0,
        rawValue: `${Number(latest['Push Up Repetitions']) || 0} reps`
      },
      {
        metric: 'Toe to Bar',
        value: Number(latest['Toe To bar Repetitions']) / bodyWeight || 0,
        fullMark: 0.3,
        rawValue: `${Number(latest['Toe To bar Repetitions']) || 0} reps`
      }
    ];

    console.log('Chart data:', chartData);
    console.log('Strength profile:', strengthProfile);

    return {
      latest,
      insights,
      prediction,
      chartData,
      trainingDays,
      progressionRate: calculateProgressionRate(sortedAssessments),
      strengthProfile,
      formattedSchedule
    };
  }, [assessments]);

  if (!processData) {
    return (
      <div className="bg-pink-100 text-pink-900 p-4 rounded-lg">
        No assessment data available.
      </div>
    );
  }

  const { latest, chartData, insights, prediction, trainingDays, strengthProfile, formattedSchedule } = processData;

  return (
    <div ref={analysisRef} data-analysis-ref className="space-y-8">
      {/* Header with export options */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <Activity className="text-indigo-500" />
          Performance Analysis
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportFullAnalysis('pdf')}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button
            onClick={() => exportFullAnalysis('images')}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
          >
            <Download size={16} />
            Export Images
          </button>
        </div>
      </div>

      {/* Physical Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-indigo-900 flex items-center gap-2">
          <Dumbbell className="text-indigo-500" />
          Physical Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Height"
            value={latest?.['Personal Info']?.['Height']}
            unit=" cm"
            type="height"
          />
          <MetricCard
            title="Weight"
            value={latest?.['Personal Info']?.['Weight']}
            unit=" kg"
            type="weight"
          />
          <MetricCard
            title="Finger Strength (Added Weight)"
            value={latest?.['Finger Strength Weight']}
            unit="kg"
            subtitle="Weight added to body weight"
            type="weight"
          />
          <MetricCard
            title="Finger Strength (%BW)"
            value={calculateFingerStrength(latest)}
            unit="%"
            subtitle="Total weight as % of body weight"
            type="percentage"
          />
        </div>
      </div>

      {/* Current Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Current Boulder Grade"
          value={latest?.['Boulder 80% Grade']}
          subtitle="80% Grade"
        />
        <MetricCard
          title="Current Lead Grade"
          value={latest?.['Lead 80% Grade']}
          subtitle="80% Grade"
        />
        <MetricCard
          title="Training Days"
          value={trainingDays > 0 ? trainingDays : "N/A"}
          unit="/week"
          subtitle={trainingDays > 0 ? "Excluding rest days" : "No schedule set"}
        />
      </div>

      {/* Progress Charts */}
      <div className="space-y-6">
        {/* Strength Profile */}
        <div className="bg-pink-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-pink-900 flex items-center gap-2 mb-4">
            <Activity className="text-pink-500" />
            Strength Profile (Relative to Body Weight)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx={250}
                cy={250}
                outerRadius={150}
                width={500}
                height={500}
                data={strengthProfile}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'auto']}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Radar
                  name="Current"
                  dataKey="value"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.6}
                />
                <Tooltip
                  formatter={(value, name, props) => {
                    const metric = props.payload.metric;
                    const rawValue = props.payload.rawValue;
                    return [
                      `${(value * 100).toFixed(1)}% of BW (${rawValue})`,
                      'Current'
                    ];
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {strengthProfile.map(item => (
              <div key={item.metric} className="bg-pink-50 p-4 rounded-lg">
                <p className="text-pink-700 font-semibold">{item.metric}</p>
                <p className="text-2xl font-bold text-pink-900">{(item.value * 100).toFixed(1)}% BW</p>
                <p className="text-sm text-pink-600">{item.rawValue}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Finger Strength Progress */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Finger Strength Progress</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ec4899" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Added Weight') return [`${value} kg`, name];
                      if (name === '% of Body Weight') return [`${value.toFixed(1)}%`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="fingerStrengthWeight"
                    name="Added Weight"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="fingerStrengthPct"
                    name="% of Body Weight"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pull-ups Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Pull-ups Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pullUps"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#ec4899" }}
                    activeDot={{ r: 6, fill: "#be185d" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE Pull Ups'] || 'N/A'}
            </div>
          </div>

          {/* Push-ups Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Push-ups Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pushUps"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#ec4899" }}
                    activeDot={{ r: 6, fill: "#be185d" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE Push Ups'] || 'N/A'}
            </div>
          </div>

          {/* Toe to Bar Progress */}
          <div className="bg-pink-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">Toe to Bar Progress</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="toeToBar"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#ec4899" }}
                    activeDot={{ r: 6, fill: "#be185d" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-pink-700">
              Latest RPE: {latest?.['RPE Toe To Bar'] || 'N/A'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <MetricCard
              title="Predicted Boulder Grade"
              value={prediction?.boulder || 'N/A'}
              subtitle="Based on current metrics"
            />
            <MetricCard
              title="Predicted Lead Grade"
              value={prediction?.lead || 'N/A'}
              subtitle="French grading system"
            />
          </div>
          <div className="space-y-4">
            <MetricCard
              title="Confidence Score"
              value={prediction?.analysis?.confidenceScore || 'N/A'}
              unit="%"
              subtitle="Prediction accuracy"
            />
            <div className="bg-pink-50 p-4 rounded-lg shadow-sm border border-pink-100">
              <h3 className="text-lg font-semibold text-pink-900 mb-3">Performance Areas</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-pink-100">
                  <p className="text-pink-900">
                    <span className="font-semibold text-pink-700">Strongest: </span>
                    <span className="text-pink-800">{prediction?.analysis?.strongestArea || 'N/A'}</span>
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-pink-100">
                  <p className="text-pink-900">
                    <span className="font-semibold text-pink-700">Weakest: </span>
                    <span className="text-pink-800">{prediction?.analysis?.weakestArea || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded-lg shadow-sm border border-pink-100">
              <h3 className="text-lg font-semibold text-pink-900 mb-3">Training Recommendations</h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-pink-100">
                  <p className="font-semibold text-pink-700 mb-1">Primary Focus</p>
                  <p className="text-pink-800">{prediction?.analysis?.primaryFocus || 'N/A'}</p>
                </div>
                <div className="bg-white p-3 rounded border border-pink-100">
                  <p className="font-semibold text-pink-700 mb-1">Secondary Focus</p>
                  <p className="text-pink-800">{prediction?.analysis?.secondaryFocus || 'N/A'}</p>
                </div>
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

      {/* Training Schedule */}
      <div className="bg-pink-50 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-900">
          <Calendar className="text-pink-500" />
          Training Schedule
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-pink-900 mb-3">Weekly Schedule</h3>
            {formattedSchedule.length > 0 ? (
              <div className="space-y-2">
                {formattedSchedule.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-2 rounded ${
                      item.activity.toLowerCase().includes('rest') 
                        ? 'bg-gray-50 text-gray-500' 
                        : 'bg-white'
                    }`}
                  >
                    <span className="font-medium">{item.day}</span>
                    <span>{item.activity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-pink-600">No schedule available</p>
            )}
          </div>
          <div>
            <MetricCard
              title="Training Days"
              value={trainingDays > 0 ? trainingDays : "N/A"}
              unit="/week"
              subtitle={trainingDays > 0 ? "Excluding rest days" : "No schedule set"}
            />
          </div>
        </div>
      </div>

      {/* Coaching Roadmap */}
      <div className="mt-8">
        <CoachingRoadmap />
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
      {/* Finger Strength Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Finger Strength</h3>
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-pink-600">
            {latest ? `${calculateFingerStrength(latest).toFixed(1)}%` : 'N/A'}
          </p>
          <p className="ml-2 text-sm text-gray-500">of body weight</p>
        </div>
        <div className="mt-1">
          <p className="text-sm text-gray-600">
            Body Weight: {latest?.['Personal Info']?.['Weight'] || 0}kg
          </p>
          <p className="text-sm text-gray-600">
            Added Weight: {latest?.['Finger Strength Weight'] || 0}kg
          </p>
          <p className="text-sm text-gray-600">
            Total Weight: {(Number(latest?.['Finger Strength Weight'] || 0) + 
              Number(latest?.['Personal Info']?.['Weight'] || 0)).toFixed(1)}kg
          </p>
        </div>
      </div>
      <MetricCard
        title="Finger Strength"
        value={calculateFingerStrength(latest)}
        unit="%"
        subtitle={`Total: ${(Number(latest?.['Finger Strength Weight'] || 0) + Number(latest?.['Personal Info']?.['Weight'] || 0)).toFixed(1)}kg`}
        type="percentage"
      />
    </div>
  );
};

export default ClimbingAnalysis;
