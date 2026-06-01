
import { MetricOption } from './types';

export const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Product", "Support"];

export const ASSESSMENT_OPTIONS: Record<string, MetricOption> = {
  department: {
    label: "Department",
    description: "Your primary business unit",
    options: DEPARTMENTS
  },
  workload: {
    label: "Workload Description",
    description: "Current volume of tasks",
    options: ["Very Light", "Light", "Moderate", "Heavy", "Very Heavy"]
  },
  workingHours: {
    label: "Daily Working Hours",
    description: "Average hours spent per day",
    options: ["Less than 6 hours", "6–8 hours", "8–9 hours", "9–10 hours", "More than 10 hours"]
  },
  energyLevel: {
    label: "Energy Level",
    description: "Self-perceived energy during work",
    options: ["Very Low", "Low", "Moderate", "High", "Very High"]
  },
  sleepQuality: {
    label: "Sleep / Rest Quality",
    description: "Quality of rest outside work",
    options: ["Poor", "Below Average", "Average", "Good", "Very Good"]
  },
  jobSatisfaction: {
    label: "Job Satisfaction",
    description: "Happiness with current role",
    options: ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"]
  },
  motivation: {
    label: "Work Motivation",
    description: "Drive to perform",
    options: ["Not Motivated", "Slightly Motivated", "Moderately Motivated", "Motivated", "Highly Motivated"]
  },
  managerialSupport: {
    label: "Managerial Support",
    description: "Guidance from leaders",
    options: ["Not Supported", "Slightly Supported", "Moderately Supported", "Well Supported", "Very Well Supported"]
  },
  workLifeBalance: {
    label: "Work–Life Balance",
    description: "Personal vs Professional balance",
    options: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
  },
  pressure: {
    label: "Work Pressure Frequency",
    description: "Frequency of feeling pressured",
    options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"]
  }
};
