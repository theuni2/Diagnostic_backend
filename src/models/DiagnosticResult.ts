import mongoose, { Schema, Document, Model } from 'mongoose';
import { ClassGroupType } from './StudentProfile.js';

export type EvaluationSourceType = 'claude' | 'rule_based';
export type EvaluationStatusType = 'completed' | 'fallback' | 'failed';

export interface Grade68ReportPayload {
  studentName: string;
  grade: string;
  assessmentDate: string;
  streamLeaning: string;

  // 01. WHO IS STUDENT?
  whoIsStudent: {
    academicProfile: {
      gradeAndBoard: string;
      subjectsStudied: string;
      easiestSubject: string;
      hardestSubject: string;
    };
    outsideClassroom: string;
    ownDirection: {
      tenYearVision: string;
      streamLeaning: string;
      familySituation: string;
      recognition: string;
      learningPreference: string;
      summaryConclusion: string;
    };
  };

  // 02. APTITUDE AND ABILITY ANALYSIS
  aptitudeAnalysis: {
    overallScore: number;
    overallLabel: string;
    numericalAbility: { score: number; statusLabel: string; analysisText: string };
    logicalAbility: { score: number; statusLabel: string; analysisText: string };
    verbalAbility: { score: number; statusLabel: string; analysisText: string };
    counsellorNotes: string[];
  };

  // 03. CAREER INTEREST PROFILE (RIASEC)
  careerInterestProfile: {
    riasecScores: {
      artistic: number;
      social: number;
      enterprising: number;
      investigative: number;
      realistic: number;
      conventional: number;
    };
    primaryInterestType: string;
    primarySummary: string;
    inPracticeBreakdown: {
      artistic: string;
      social: string;
      enterprising: string;
    };
  };

  // 04. MOTIVATORS AND VALUES
  motivatorsAndValues: {
    topMotivators: Array<{ label: string; percentage: number }>;
    scenarioAnalysis: Array<{ title: string; finding: string }>;
    counsellorInterpretation: string[];
  };

  // 05. PERSONALITY AND WORKING STYLE
  personalityAndWorkingStyle: {
    traits: Array<{ title: string; description: string }>;
    strengths: string[];
    areasToDevelop: string[];
  };

  // 06. CAREER CLUSTERS
  careerClusters: {
    clusterScores: Array<{ name: string; matchPercentage: number }>;
    topClustersExplained: Array<{ rank: number; name: string; matchPercentage: number; explanation: string }>;
  };

  // 07. CAREER PATH RECOMMENDATIONS
  careerRecommendations: {
    paths: Array<{
      rank: number;
      title: string;
      cluster: string;
      fitRating: string;
      fitScore: number;
      skillsScore: number;
      recommendationType: 'Top Choice' | 'Good Choice';
    }>;
    topRecommendationDeepDive: {
      title: string;
      arguments: string[];
    };
  };

  // 08. STREAM AND SUBJECT RECOMMENDATION
  streamAndSubjectRecommendation: {
    humanitiesAndArts: { status: 'RECOMMENDED' | 'POSSIBLE ALTERNATIVE' | 'NOT RECOMMENDED'; reason: string };
    science: { status: 'RECOMMENDED' | 'POSSIBLE ALTERNATIVE' | 'NOT RECOMMENDED'; reason: string };
    commerce: { status: 'RECOMMENDED' | 'POSSIBLE ALTERNATIVE' | 'NOT RECOMMENDED'; reason: string };
    recommendedSubjectCombination: {
      streamName: string;
      coreSubjects: string[];
      specializations: Array<{ name: string; reason: string }>;
    };
  };

  // 09. PROFILE ROADMAP: GRADE 8 TO UNIVERSITY
  profileRoadmap: {
    phase1: { title: string; subtitle: string; bullets: string[]; target: string };
    phase2: { title: string; subtitle: string; bullets: string[]; target: string };
    phase3: { title: string; subtitle: string; bullets: string[]; target: string };
    uniqueDifferentiators: string[];
  };

  // 10. SUMMARY AND NEXT STEPS
  summaryAndNextSteps: {
    summaryTable: {
      personalityType: string;
      topInterestCodes: string;
      coreMotivators: string;
      strongestAptitude: string;
      recommendedStream: string;
      topCareerPath: string;
      keyDifferentiator: string;
      phase1Priority: string;
    };
    bookingCtaText: string;
  };
}

export interface EvaluationPayload {
  studentName?: string;
  grade: number;
  classGroup: ClassGroupType;
  academicStrengths: string[];
  effortAreas: string[];
  genuineInterests: string[];
  curiosityPattern: string;
  learningBehavior: string;
  activityPreferences: string[];
  careerCuriosity: string[];
  diagnosticGoal?: string;
  collegeGuidance?: {
    degreeDirection?: string;
    targetUniversities?: string[];
    profileStrengths?: string[];
    profileGaps?: string[];
  };
  recommendedNextSteps: string[];
  // Grade 6-8 Discovery Report Payload (when classGroup === '6-8')
  grade68DiscoveryReport?: Grade68ReportPayload;
}

export interface IDiagnosticResult extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  classGroup: ClassGroupType;
  grade: number;
  evaluation: EvaluationPayload;
  evaluationSource: EvaluationSourceType;
  evaluationStatus: EvaluationStatusType;
  errorMessage?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosticResultSchema = new Schema<IDiagnosticResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    classGroup: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    evaluation: {
      type: Schema.Types.Mixed,
      required: true,
    },
    evaluationSource: {
      type: String,
      enum: ['claude', 'rule_based'],
      default: 'rule_based',
    },
    evaluationStatus: {
      type: String,
      enum: ['completed', 'fallback', 'failed'],
      default: 'completed',
    },
    errorMessage: {
      type: String,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const DiagnosticResult: Model<IDiagnosticResult> =
  mongoose.models.DiagnosticResult ||
  mongoose.model<IDiagnosticResult>('DiagnosticResult', DiagnosticResultSchema);
