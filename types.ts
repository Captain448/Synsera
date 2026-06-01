
export interface AssessmentInput {
  department: string;
  workload: string;
  workingHours: string;
  energyLevel: string;
  sleepQuality: string;
  jobSatisfaction: string;
  motivation: string;
  managerialSupport: string;
  workLifeBalance: string;
  pressure: string;
  feedback: string;
}

export interface BarMetric {
  label: string;
  current_value: number;
  previous_average: number;
  max_value: number;
  color: string;
}

export interface UserRecord {
  user_key: string;
  department: string;
  timestamp: string;
  input: AssessmentInput;
  summary: AssessmentSummary;
}

export interface AssessmentSummary {
  stress_level: 'Low' | 'Moderate' | 'High';
  mental_health_efficiency: number;
  burnout_risk: 'Low' | 'Medium' | 'High';
  job_satisfaction_status: 'Low' | 'Moderate' | 'High';
  attrition_risk: 'Low' | 'Medium' | 'High';
  overall_sentiment: 'Positive' | 'Neutral' | 'Negative';
  trend: 'Improving' | 'Stable' | 'Declining';
}

export interface AssessmentResult {
  user_status: string;
  user_key: string;
  authentication: "Successful" | "Failed";
  summary: AssessmentSummary;
  bars: BarMetric[];
  personalized_insights: {
    for_employee: string[];
    for_hr: string[];
  };
  data_persistence: {
    storage_format: string;
    record_saved: boolean;
    total_records_for_user: number;
  };
}

export interface TeamAnalysisResult {
  aggregated_metrics: {
    avg_stress: number;
    avg_efficiency: number;
    high_risk_count: number;
    attrition_probability: number;
  };
  department_breakdown: Record<string, number>;
  team_recommendations: string[];
  action_plan: {
    immediate: string[];
    long_term: string[];
  };
}

export interface MetricOption {
  label: string;
  options: string[];
  description: string;
}
