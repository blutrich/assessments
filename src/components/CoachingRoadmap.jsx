import React from 'react';
import { Milestone, Target, AlertTriangle, Activity, Brain, Calendar, TrendingUp } from 'lucide-react';

const MilestoneCard = ({ phase, timeframe, expectations, insight }) => (
  <div className="bg-pink-50 rounded-lg p-4 space-y-2">
    <h3 className="text-lg font-semibold text-pink-900 flex items-center gap-2">
      <Milestone className="text-pink-500" />
      {phase}
      <span className="text-sm font-normal text-pink-600">({timeframe})</span>
    </h3>
    <div className="space-y-2">
      <div className="text-sm text-pink-800">
        <strong>What to expect:</strong>
        <ul className="list-disc list-inside ml-4 mt-1">
          {expectations.map((exp, i) => (
            <li key={i}>{exp}</li>
          ))}
        </ul>
      </div>
      <div className="text-sm text-pink-700 italic">
        <strong>Coach's insight:</strong> {insight}
      </div>
    </div>
  </div>
);

const RiskSection = ({ title, risks }) => (
  <div className="bg-pink-50 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-pink-900 flex items-center gap-2 mb-3">
      <AlertTriangle className="text-pink-500" />
      {title}
    </h3>
    <ul className="list-disc list-inside space-y-1">
      {risks.map((risk, i) => (
        <li key={i} className="text-sm text-pink-800">{risk}</li>
      ))}
    </ul>
  </div>
);

const TrackingSection = ({ title, items, icon: Icon }) => (
  <div className="bg-pink-50 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-pink-900 flex items-center gap-2 mb-3">
      <Icon className="text-pink-500" />
      {title}
    </h3>
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-pink-800">{item}</li>
      ))}
    </ul>
  </div>
);

const CoachingRoadmap = () => {
  const milestones = [
    {
      phase: "FOUNDATION PHASE",
      timeframe: "First 3 Months",
      expectations: [
        "5-10% boost in finger strength",
        "Establish baseline metrics",
        "Develop fundamental climbing techniques",
        "Initial endurance improvements"
      ],
      insight: "Success here depends on consistency - commit to 2-3 sessions weekly. This is your technique-building phase, so focus on quality over difficulty."
    },
    {
      phase: "DEVELOPMENT PHASE",
      timeframe: "3-6 Months",
      expectations: [
        "Finger strength will jump 15-25%",
        "Climb about half to one grade harder",
        "Pull-up strength will improve 10-15%"
      ],
      insight: "This is where you'll see rapid gains. The key is balancing your enthusiasm with proper rest periods. Many climbers try to rush this phase - don't fall into that trap."
    },
    {
      phase: "CONSOLIDATION PHASE",
      timeframe: "6-12 Months",
      expectations: [
        "Total finger strength improvement reaches 25-35%",
        "Climb 1-2 grades harder than starting point",
        "Overall strength metrics improve 15-20%"
      ],
      insight: "This is where technique and strength begin to merge. Focus on movement efficiency and introducing periodic deload weeks to prevent plateaus."
    },
    {
      phase: "MASTERY PHASE",
      timeframe: "12+ Months",
      expectations: [
        "Potential for 35-50% total finger strength improvement",
        "Ability to climb 2+ grades harder",
        "Significant refinement in technique"
      ],
      insight: "This is where individual programming becomes crucial. Your progress will be more nuanced, focusing on specific weaknesses and goals."
    }
  ];

  const physicalRisks = [
    "Ignoring previous injuries",
    "Compromising on sleep",
    "Inadequate nutrition",
    "Overtraining syndrome"
  ];

  const technicalRisks = [
    "Rushing through technique fundamentals",
    "Sporadic training attendance",
    "Random progression without structure",
    "Insufficient rest between sessions"
  ];

  const trackingMetrics = [
    "Strength tests every 3-4 months",
    "Regular technique video analysis",
    "Training log reviews",
    "Recovery quality monitoring"
  ];

  const progressMarkers = [
    "Finger strength measurements",
    "Boulder grade progression",
    "Overall strength capacity",
    "Body composition changes"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-pink-50 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-pink-900 flex items-center gap-2 mb-4">
          <Target className="text-pink-500" />
          CLIMBING PROGRESS ROADMAP: COACH'S INSIGHTS
        </h2>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {milestones.map((milestone, i) => (
          <MilestoneCard key={i} {...milestone} />
        ))}
      </div>

      {/* Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RiskSection title="PHYSICAL RISKS" risks={physicalRisks} />
        <RiskSection title="TECHNICAL RISKS" risks={technicalRisks} />
      </div>

      {/* Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrackingSection 
          title="ASSESSMENT SCHEDULE" 
          items={trackingMetrics} 
          icon={Calendar}
        />
        <TrackingSection 
          title="PROGRESS MARKERS" 
          items={progressMarkers} 
          icon={TrendingUp}
        />
      </div>

      {/* Training Components */}
      <div className="bg-pink-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-pink-900 flex items-center gap-2 mb-3">
          <Activity className="text-pink-500" />
          ESSENTIAL TRAINING COMPONENTS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-pink-800 mb-2">Training Schedule:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-pink-800">
              <li>Finger strength sessions: 2x weekly</li>
              <li>General strength work: 2x weekly</li>
              <li>Technique practice: Every session</li>
              <li>Project attempts: 1-2x weekly</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-pink-800 mb-2">Recovery Requirements:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-pink-800">
              <li>8+ hours sleep nightly</li>
              <li>Proper nutrition</li>
              <li>Deload week every 4-6 weeks</li>
              <li>Quick response to minor tweaks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachingRoadmap;
