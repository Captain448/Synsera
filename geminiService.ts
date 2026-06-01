
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentInput, AssessmentResult, UserRecord, TeamAnalysisResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeTeamWellbeing(records: UserRecord[]): Promise<TeamAnalysisResult> {
  // Extract critical data only to optimize token usage and focus analysis
  const teamData = records.map(r => ({
    user: r.user_key,
    dept: r.department,
    stress: r.summary.stress_level,
    efficiency: r.summary.mental_health_efficiency,
    burnout: r.summary.burnout_risk,
    attrition: r.summary.attrition_risk
  }));

  const prompt = `
    Analyze the following team well-being data for an HR strategic report. 
    Focus on structural causes of stress and provide systemic improvements.
    
    TEAM DATASET:
    ${JSON.stringify(teamData)}
    
    TASK:
    1. Calculate aggregated health scores for the whole team.
    2. Provide a 'department_breakdown' where keys are department names and values are the count of 'High' stress individuals in that department.
    3. Generate 3 high-level strategic recommendations for management.
    4. Provide a concrete action plan with immediate and long-term steps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are an expert Chief People Officer. Analyze team-wide health metrics. 
        Provide a structured strategic report. You MUST return valid JSON matching the schema precisely.
        For 'department_breakdown', provide an object where keys are department names and values are numbers representing High Stress frequency.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aggregated_metrics: {
              type: Type.OBJECT,
              properties: {
                avg_stress: { type: Type.NUMBER, description: "Average percentage of stress across team" },
                avg_efficiency: { type: Type.NUMBER, description: "Average mental health efficiency score" },
                high_risk_count: { type: Type.NUMBER, description: "Total number of individuals in High risk categories" },
                attrition_probability: { type: Type.NUMBER, description: "Overall team attrition probability percentage" }
              },
              required: ['avg_stress', 'avg_efficiency', 'high_risk_count', 'attrition_probability']
            },
            department_breakdown: { 
              type: Type.OBJECT,
              description: "Mapping of department names to number of high-stress individuals"
            },
            team_recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            action_plan: {
              type: Type.OBJECT,
              properties: {
                immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
                long_term: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['immediate', 'long_term']
            }
          },
          required: ['aggregated_metrics', 'department_breakdown', 'team_recommendations', 'action_plan']
        }
      }
    });

    const result = JSON.parse(response.text);
    // Ensure department_breakdown isn't empty if the model missed it
    if (!result.department_breakdown || Object.keys(result.department_breakdown).length === 0) {
      result.department_breakdown = { "General": teamData.length };
    }
    return result as TeamAnalysisResult;
  } catch (error) {
    console.error("Team Analysis API Error:", error);
    throw new Error("Neural strategic analysis failed. Check console for details.");
  }
}

export async function analyzeWellbeing(
  input: AssessmentInput, 
  userKey: string, 
  status: 'New User' | 'Existing User',
  history: UserRecord[]
): Promise<AssessmentResult> {
  const historicalContext = history.map(h => ({
    date: h.timestamp,
    metrics: h.summary
  }));

  const prompt = `
    Analyze this employee's current well-being data vs their specific history.
    
    USER KEY: ${userKey}
    DEPARTMENT: ${input.department}

    CURRENT ASSESSMENT:
    - Workload: ${input.workload}
    - Working Hours: ${input.workingHours}
    - Energy Level: ${input.energyLevel}
    - Sleep: ${input.sleepQuality}
    - Satisfaction: ${input.jobSatisfaction}
    - Motivation: ${input.motivation}
    - Support: ${input.managerialSupport}
    - Balance: ${input.workLifeBalance}
    - Pressure: ${input.pressure}
    - Feedback: "${input.feedback}"
    
    HISTORICAL RECORDS:
    ${JSON.stringify(historicalContext)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are a professional workforce psychologist. 
        Analyze current data against personal history to provide comparative well-being insights.
        Output ONLY JSON. Ensure 'bars' array has 4 items for Stress, Efficiency, Satisfaction, and Balance.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                stress_level: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
                mental_health_efficiency: { type: Type.NUMBER },
                burnout_risk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                job_satisfaction_status: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
                attrition_risk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                overall_sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
                trend: { type: Type.STRING, enum: ['Improving', 'Stable', 'Declining'] }
              }
            },
            bars: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  current_value: { type: Type.NUMBER },
                  previous_average: { type: Type.NUMBER },
                  max_value: { type: Type.NUMBER },
                  color: { type: Type.STRING }
                }
              }
            },
            personalized_insights: {
              type: Type.OBJECT,
              properties: {
                for_employee: { type: Type.ARRAY, items: { type: Type.STRING } },
                for_hr: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            data_persistence: {
              type: Type.OBJECT,
              properties: {
                storage_format: { type: Type.STRING },
                record_saved: { type: Type.BOOLEAN }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text) as AssessmentResult;
    result.user_key = userKey;
    result.user_status = status;
    result.authentication = "Successful";
    result.data_persistence.total_records_for_user = history.length + 1;
    
    return result;
  } catch (error) {
    console.error("Individual Analysis API Error:", error);
    throw new Error("Neuro-assessment failed. Please check network connection.");
  }
}
