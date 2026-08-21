import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/environment.js';
import { EvaluationPayload, Grade68ReportPayload } from '../models/DiagnosticResult.js';

export interface QuestionAnswerPair {
  questionId: string;
  section: string;
  questionText: string;
  studentAnswer: string | string[];
}

export interface StudentContextPayload {
  studentName: string;
  grade: number;
  classGroup: '6-8' | '9-10' | '11-12';
  schoolBoard?: string;
  country?: string;
  stream?: string;
  subjects?: string[];
  academicPerformance?: string;
  collegeGoals?: {
    targetDegree?: string;
    targetUniversities?: string;
    targetCountries?: string[];
  };
}

export class ClaudeService {
  private static anthropicClient: Anthropic | null = null;

  private static getClient(): Anthropic | null {
    if (this.anthropicClient) {
      return this.anthropicClient;
    }
    if (!config.anthropicApiKey) {
      console.warn('⚠️ [ClaudeService] ANTHROPIC_API_KEY missing in environment variables.');
      return null;
    }
    this.anthropicClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    return this.anthropicClient;
  }

  /**
   * System Prompt for Grade 6-8 Comprehensive 10-Section Discovery Report
   */
  private static getGrade68SystemPrompt(): string {
    return `You are an expert, empathetic career & profile discovery counsellor for students in Grades 6–8 (Middle School).
Analyze the student's Submitted Profile and 32 Diagnostic Questionnaire Answers.

EVALUATION RULES:
1. Aptitude Scores: Numerical (Q6, Q7, Q8), Logical (Q9, Q10, Q11), Verbal (Q12, Q13). Output % score & analysis.
2. RIASEC Mapping: Calculate percentage scores from Q14-Q23 forced pairs (Artistic, Social, Enterprising, Investigative, Realistic, Conventional).
3. Motivators (Q24, Q25, Q27): Calculate percentages for Meaningful work, Creative Output, Autonomy, Recognition, Earnings.
4. Career Recommendations & Stream Recommendation (Humanities/Arts, Science, Commerce).
5. 3-Phase Profile Roadmap: Phase 1 (Grade 8-9), Phase 2 (Grade 9-11), Phase 3 (Grade 11-12).
6. CONCISENESS RULE: Keep all text explanations, paragraphs, and bullet points focused, sharp, and concise (1-2 clear sentences per field). Avoid repetitive filler essays so output remains fast and within token limits.

Call the submit_grade68_report tool with the complete, structured 10-section discovery report output.`;
  }

  /**
   * Structured Tool Schema for Grade 6-8 Discovery Report
   */
  /**
   * Structured Tool Schema for Grade 6-8 Discovery Report
   */
  private static GRADE_68_REPORT_TOOL: Anthropic.Tool = {
    name: 'submit_grade68_report',
    description: 'Submit the structured 10-section Grade 6-8 Career & Profile Discovery Report.',
    input_schema: {
      type: 'object',
      required: ['grade68DiscoveryReport'],
      properties: {
        grade68DiscoveryReport: {
          type: 'object',
          required: [
            'studentName',
            'grade',
            'assessmentDate',
            'streamLeaning',
            'whoIsStudent',
            'aptitudeAnalysis',
            'careerInterestProfile',
            'motivatorsAndValues',
            'personalityAndWorkingStyle',
            'careerClusters',
            'careerRecommendations',
            'streamAndSubjectRecommendation',
            'profileRoadmap',
            'summaryAndNextSteps',
          ],
          properties: {
            studentName: { type: 'string' },
            grade: { type: 'string' },
            assessmentDate: { type: 'string' },
            streamLeaning: { type: 'string' },
            whoIsStudent: {
              type: 'object',
              required: ['academicProfile', 'outsideClassroom', 'ownDirection'],
              properties: {
                academicProfile: {
                  type: 'object',
                  required: ['gradeAndBoard', 'subjectsStudied', 'easiestSubject', 'hardestSubject'],
                  properties: {
                    gradeAndBoard: { type: 'string' },
                    subjectsStudied: { type: 'string' },
                    easiestSubject: { type: 'string' },
                    hardestSubject: { type: 'string' },
                  },
                },
                outsideClassroom: { type: 'string' },
                ownDirection: {
                  type: 'object',
                  required: [
                    'tenYearVision',
                    'streamLeaning',
                    'familySituation',
                    'recognition',
                    'learningPreference',
                    'summaryConclusion',
                  ],
                  properties: {
                    tenYearVision: { type: 'string' },
                    streamLeaning: { type: 'string' },
                    familySituation: { type: 'string' },
                    recognition: { type: 'string' },
                    learningPreference: { type: 'string' },
                    summaryConclusion: { type: 'string' },
                  },
                },
              },
            },
            aptitudeAnalysis: {
              type: 'object',
              required: [
                'overallScore',
                'overallLabel',
                'numericalAbility',
                'logicalAbility',
                'verbalAbility',
                'counsellorNotes',
              ],
              properties: {
                overallScore: { type: 'number' },
                overallLabel: { type: 'string' },
                numericalAbility: {
                  type: 'object',
                  required: ['score', 'statusLabel', 'analysisText'],
                  properties: { score: { type: 'number' }, statusLabel: { type: 'string' }, analysisText: { type: 'string' } },
                },
                logicalAbility: {
                  type: 'object',
                  required: ['score', 'statusLabel', 'analysisText'],
                  properties: { score: { type: 'number' }, statusLabel: { type: 'string' }, analysisText: { type: 'string' } },
                },
                verbalAbility: {
                  type: 'object',
                  required: ['score', 'statusLabel', 'analysisText'],
                  properties: { score: { type: 'number' }, statusLabel: { type: 'string' }, analysisText: { type: 'string' } },
                },
                counsellorNotes: { type: 'array', items: { type: 'string' } },
              },
            },
            careerInterestProfile: {
              type: 'object',
              required: ['riasecScores', 'primaryInterestType', 'primarySummary', 'inPracticeBreakdown'],
              properties: {
                riasecScores: {
                  type: 'object',
                  required: ['artistic', 'social', 'enterprising', 'investigative', 'realistic', 'conventional'],
                  properties: {
                    artistic: { type: 'number' },
                    social: { type: 'number' },
                    enterprising: { type: 'number' },
                    investigative: { type: 'number' },
                    realistic: { type: 'number' },
                    conventional: { type: 'number' },
                  },
                },
                primaryInterestType: { type: 'string' },
                primarySummary: { type: 'string' },
                inPracticeBreakdown: {
                  type: 'object',
                  required: ['artistic', 'social', 'enterprising'],
                  properties: { artistic: { type: 'string' }, social: { type: 'string' }, enterprising: { type: 'string' } },
                },
              },
            },
            motivatorsAndValues: {
              type: 'object',
              required: ['topMotivators', 'scenarioAnalysis', 'counsellorInterpretation'],
              properties: {
                topMotivators: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['label', 'percentage'],
                    properties: { label: { type: 'string' }, percentage: { type: 'number' } },
                  },
                },
                scenarioAnalysis: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['title', 'finding'],
                    properties: { title: { type: 'string' }, finding: { type: 'string' } },
                  },
                },
                counsellorInterpretation: { type: 'array', items: { type: 'string' } },
              },
            },
            personalityAndWorkingStyle: {
              type: 'object',
              required: ['traits', 'strengths', 'areasToDevelop'],
              properties: {
                traits: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['title', 'description'],
                    properties: { title: { type: 'string' }, description: { type: 'string' } },
                  },
                },
                strengths: { type: 'array', items: { type: 'string' } },
                areasToDevelop: { type: 'array', items: { type: 'string' } },
              },
            },
            careerClusters: {
              type: 'object',
              required: ['clusterScores', 'topClustersExplained'],
              properties: {
                clusterScores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['name', 'matchPercentage'],
                    properties: { name: { type: 'string' }, matchPercentage: { type: 'number' } },
                  },
                },
                topClustersExplained: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['rank', 'name', 'matchPercentage', 'explanation'],
                    properties: { rank: { type: 'number' }, name: { type: 'string' }, matchPercentage: { type: 'number' }, explanation: { type: 'string' } },
                  },
                },
              },
            },
            careerRecommendations: {
              type: 'object',
              required: ['paths', 'topRecommendationDeepDive'],
              properties: {
                paths: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['rank', 'title', 'cluster', 'fitRating', 'fitScore', 'skillsScore', 'recommendationType'],
                    properties: {
                      rank: { type: 'number' },
                      title: { type: 'string' },
                      cluster: { type: 'string' },
                      fitRating: { type: 'string' },
                      fitScore: { type: 'number' },
                      skillsScore: { type: 'number' },
                      recommendationType: { type: 'string', enum: ['Top Choice', 'Good Choice'] },
                    },
                  },
                },
                topRecommendationDeepDive: {
                  type: 'object',
                  required: ['title', 'arguments'],
                  properties: { title: { type: 'string' }, arguments: { type: 'array', items: { type: 'string' } } },
                },
              },
            },
            streamAndSubjectRecommendation: {
              type: 'object',
              required: ['humanitiesAndArts', 'science', 'commerce', 'recommendedSubjectCombination'],
              properties: {
                humanitiesAndArts: {
                  type: 'object',
                  required: ['status', 'reason'],
                  properties: { status: { type: 'string', enum: ['RECOMMENDED', 'POSSIBLE ALTERNATIVE', 'NOT RECOMMENDED'] }, reason: { type: 'string' } },
                },
                science: {
                  type: 'object',
                  required: ['status', 'reason'],
                  properties: { status: { type: 'string', enum: ['RECOMMENDED', 'POSSIBLE ALTERNATIVE', 'NOT RECOMMENDED'] }, reason: { type: 'string' } },
                },
                commerce: {
                  type: 'object',
                  required: ['status', 'reason'],
                  properties: { status: { type: 'string', enum: ['RECOMMENDED', 'POSSIBLE ALTERNATIVE', 'NOT RECOMMENDED'] }, reason: { type: 'string' } },
                },
                recommendedSubjectCombination: {
                  type: 'object',
                  required: ['streamName', 'coreSubjects', 'specializations'],
                  properties: {
                    streamName: { type: 'string' },
                    coreSubjects: { type: 'array', items: { type: 'string' } },
                    specializations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['name', 'reason'],
                        properties: { name: { type: 'string' }, reason: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
            profileRoadmap: {
              type: 'object',
              required: ['phase1', 'phase2', 'phase3', 'uniqueDifferentiators'],
              properties: {
                phase1: {
                  type: 'object',
                  required: ['title', 'subtitle', 'bullets', 'target'],
                  properties: { title: { type: 'string' }, subtitle: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } }, target: { type: 'string' } },
                },
                phase2: {
                  type: 'object',
                  required: ['title', 'subtitle', 'bullets', 'target'],
                  properties: { title: { type: 'string' }, subtitle: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } }, target: { type: 'string' } },
                },
                phase3: {
                  type: 'object',
                  required: ['title', 'subtitle', 'bullets', 'target'],
                  properties: { title: { type: 'string' }, subtitle: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } }, target: { type: 'string' } },
                },
                uniqueDifferentiators: { type: 'array', items: { type: 'string' } },
              },
            },
            summaryAndNextSteps: {
              type: 'object',
              required: ['summaryTable', 'bookingCtaText'],
              properties: {
                summaryTable: {
                  type: 'object',
                  required: [
                    'personalityType',
                    'topInterestCodes',
                    'coreMotivators',
                    'strongestAptitude',
                    'recommendedStream',
                    'topCareerPath',
                    'keyDifferentiator',
                    'phase1Priority',
                  ],
                  properties: {
                    personalityType: { type: 'string' },
                    topInterestCodes: { type: 'string' },
                    coreMotivators: { type: 'string' },
                    strongestAptitude: { type: 'string' },
                    recommendedStream: { type: 'string' },
                    topCareerPath: { type: 'string' },
                    keyDifferentiator: { type: 'string' },
                    phase1Priority: { type: 'string' },
                  },
                },
                bookingCtaText: { type: 'string' },
              },
            },
          },
        },
      },
    },
  };

  /**
   * Standard System Prompt for Grades 9-12
   */
  private static getStandardSystemPrompt(): string {
    return `You are an expert, empathetic academic and career diagnostic advisor for high school students (Classes 9–12).
Derive all observations strictly from student answers. Output standard EvaluationPayload JSON.`;
  }

  /**
   * Format User Prompt containing student profile & Q&A
   */
  private static formatUserPrompt(
    context: StudentContextPayload,
    qaPairs: QuestionAnswerPair[]
  ): string {
    const formattedQA = qaPairs
      .map(
        (qa, idx) =>
          `Q${idx + 1} [${qa.section}] (${qa.questionId}): "${qa.questionText}"\nStudent Answer: ${
            Array.isArray(qa.studentAnswer) ? qa.studentAnswer.join(', ') : qa.studentAnswer || '(Unanswered)'
          }`
      )
      .join('\n\n');

    return `STUDENT PROFILE:
- Name: ${context.studentName}
- Grade: ${context.grade} (Class Group: ${context.classGroup})
- School Board / Curriculum: ${context.schoolBoard || 'Unstated'}
- Country: ${context.country || 'Unstated'}

DIAGNOSTIC QUESTIONNAIRE RESPONSES (32 QUESTIONS):
${formattedQA}

Please generate the structured diagnostic evaluation JSON according to the instructions.`;
  }

  /**
   * Clean raw JSON text to fix common LLM formatting issues defensively
   */
  public static sanitizeJsonString(str: string): string {
    let cleaned = str.trim();
    const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/) || cleaned.match(/({[\s\S]*})/);
    if (jsonMatch && jsonMatch[1]) {
      cleaned = jsonMatch[1].trim();
    }
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    return cleaned;
  }

  /**
   * Real Server-Side Schema Validation & Normalization for Grade 6-8 Discovery Report
   */
  public static validateGrade68DiscoveryReport(
    data: unknown,
    overrideStudentName?: string,
    overrideGrade?: number
  ): Grade68ReportPayload {
    if (typeof data !== 'object' || data === null) {
      throw new Error('ValidationError: Grade68 discovery report input must be a non-null object');
    }

    const rootObj = data as Record<string, unknown>;
    const reportObj = rootObj.grade68DiscoveryReport || rootObj;

    if (typeof reportObj !== 'object' || reportObj === null) {
      throw new Error('ValidationError: grade68DiscoveryReport payload must be an object');
    }

    const rep = reportObj as Record<string, unknown>;

    const getObj = (target: unknown, fieldName: string): Record<string, unknown> => {
      if (typeof target !== 'object' || target === null || Array.isArray(target)) {
        throw new Error(`ValidationError: Expected object for field '${fieldName}'`);
      }
      return target as Record<string, unknown>;
    };

    const getString = (target: unknown, fieldName: string): string => {
      if (typeof target !== 'string' || target.trim() === '') {
        throw new Error(`ValidationError: Expected non-empty string for field '${fieldName}'`);
      }
      return target.trim();
    };

    const getNumber = (target: unknown, fieldName: string): number => {
      if (typeof target !== 'number' || isNaN(target)) {
        throw new Error(`ValidationError: Expected valid number for field '${fieldName}'`);
      }
      return target;
    };

    const getStringArray = (target: unknown, fieldName: string): string[] => {
      if (!Array.isArray(target) || target.length === 0) {
        throw new Error(`ValidationError: Expected non-empty string array for field '${fieldName}'`);
      }
      return target.map((item, idx) => getString(item, `${fieldName}[${idx}]`));
    };

    const getRecommendationType = (target: unknown, fieldName: string): 'Top Choice' | 'Good Choice' => {
      const str = getString(target, fieldName);
      if (str === 'Top Choice' || str === 'Good Choice') {
        return str;
      }
      if (str.toLowerCase().includes('top')) return 'Top Choice';
      if (str.toLowerCase().includes('good')) return 'Good Choice';
      throw new Error(`ValidationError: Invalid recommendationType '${str}' for field '${fieldName}'`);
    };

    const getStreamStatus = (target: unknown, fieldName: string): 'RECOMMENDED' | 'POSSIBLE ALTERNATIVE' | 'NOT RECOMMENDED' => {
      const str = getString(target, fieldName).toUpperCase();
      if (str === 'RECOMMENDED' || str === 'POSSIBLE ALTERNATIVE' || str === 'NOT RECOMMENDED') {
        return str;
      }
      if (str.includes('NOT')) return 'NOT RECOMMENDED';
      if (str.includes('ALT') || str.includes('POSSIBLE')) return 'POSSIBLE ALTERNATIVE';
      if (str.includes('REC')) return 'RECOMMENDED';
      throw new Error(`ValidationError: Invalid stream status '${str}' for field '${fieldName}'`);
    };

    // 01. WHO IS STUDENT?
    const whoIsStudentObj = getObj(rep.whoIsStudent, 'whoIsStudent');
    const academicProfileObj = getObj(whoIsStudentObj.academicProfile, 'whoIsStudent.academicProfile');
    const ownDirectionObj = getObj(whoIsStudentObj.ownDirection, 'whoIsStudent.ownDirection');

    const academicProfile = {
      gradeAndBoard: getString(academicProfileObj.gradeAndBoard, 'whoIsStudent.academicProfile.gradeAndBoard'),
      subjectsStudied: getString(academicProfileObj.subjectsStudied, 'whoIsStudent.academicProfile.subjectsStudied'),
      easiestSubject: getString(academicProfileObj.easiestSubject, 'whoIsStudent.academicProfile.easiestSubject'),
      hardestSubject: getString(academicProfileObj.hardestSubject, 'whoIsStudent.academicProfile.hardestSubject'),
    };

    const ownDirection = {
      tenYearVision: getString(ownDirectionObj.tenYearVision, 'whoIsStudent.ownDirection.tenYearVision'),
      streamLeaning: getString(ownDirectionObj.streamLeaning, 'whoIsStudent.ownDirection.streamLeaning'),
      familySituation: getString(ownDirectionObj.familySituation, 'whoIsStudent.ownDirection.familySituation'),
      recognition: getString(ownDirectionObj.recognition, 'whoIsStudent.ownDirection.recognition'),
      learningPreference: getString(ownDirectionObj.learningPreference, 'whoIsStudent.ownDirection.learningPreference'),
      summaryConclusion: getString(ownDirectionObj.summaryConclusion, 'whoIsStudent.ownDirection.summaryConclusion'),
    };

    const whoIsStudent = {
      academicProfile,
      outsideClassroom: getString(whoIsStudentObj.outsideClassroom, 'whoIsStudent.outsideClassroom'),
      ownDirection,
    };

    // 02. APTITUDE ANALYSIS
    const aptitudeAnalysisObj = getObj(rep.aptitudeAnalysis, 'aptitudeAnalysis');
    const numObj = getObj(aptitudeAnalysisObj.numericalAbility, 'aptitudeAnalysis.numericalAbility');
    const logObj = getObj(aptitudeAnalysisObj.logicalAbility, 'aptitudeAnalysis.logicalAbility');
    const verbObj = getObj(aptitudeAnalysisObj.verbalAbility, 'aptitudeAnalysis.verbalAbility');

    const aptitudeAnalysis = {
      overallScore: getNumber(aptitudeAnalysisObj.overallScore, 'aptitudeAnalysis.overallScore'),
      overallLabel: getString(aptitudeAnalysisObj.overallLabel, 'aptitudeAnalysis.overallLabel'),
      numericalAbility: {
        score: getNumber(numObj.score, 'aptitudeAnalysis.numericalAbility.score'),
        statusLabel: getString(numObj.statusLabel, 'aptitudeAnalysis.numericalAbility.statusLabel'),
        analysisText: getString(numObj.analysisText, 'aptitudeAnalysis.numericalAbility.analysisText'),
      },
      logicalAbility: {
        score: getNumber(logObj.score, 'aptitudeAnalysis.logicalAbility.score'),
        statusLabel: getString(logObj.statusLabel, 'aptitudeAnalysis.logicalAbility.statusLabel'),
        analysisText: getString(logObj.analysisText, 'aptitudeAnalysis.logicalAbility.analysisText'),
      },
      verbalAbility: {
        score: getNumber(verbObj.score, 'aptitudeAnalysis.verbalAbility.score'),
        statusLabel: getString(verbObj.statusLabel, 'aptitudeAnalysis.verbalAbility.statusLabel'),
        analysisText: getString(verbObj.analysisText, 'aptitudeAnalysis.verbalAbility.analysisText'),
      },
      counsellorNotes: getStringArray(aptitudeAnalysisObj.counsellorNotes, 'aptitudeAnalysis.counsellorNotes'),
    };

    // 03. CAREER INTEREST PROFILE (RIASEC)
    const cipObj = getObj(rep.careerInterestProfile, 'careerInterestProfile');
    const riasecObj = getObj(cipObj.riasecScores, 'careerInterestProfile.riasecScores');
    const inPracticeObj = getObj(cipObj.inPracticeBreakdown, 'careerInterestProfile.inPracticeBreakdown');

    const careerInterestProfile = {
      riasecScores: {
        artistic: getNumber(riasecObj.artistic, 'careerInterestProfile.riasecScores.artistic'),
        social: getNumber(riasecObj.social, 'careerInterestProfile.riasecScores.social'),
        enterprising: getNumber(riasecObj.enterprising, 'careerInterestProfile.riasecScores.enterprising'),
        investigative: getNumber(riasecObj.investigative, 'careerInterestProfile.riasecScores.investigative'),
        realistic: getNumber(riasecObj.realistic, 'careerInterestProfile.riasecScores.realistic'),
        conventional: getNumber(riasecObj.conventional, 'careerInterestProfile.riasecScores.conventional'),
      },
      primaryInterestType: getString(cipObj.primaryInterestType, 'careerInterestProfile.primaryInterestType'),
      primarySummary: getString(cipObj.primarySummary, 'careerInterestProfile.primarySummary'),
      inPracticeBreakdown: {
        artistic: getString(inPracticeObj.artistic, 'careerInterestProfile.inPracticeBreakdown.artistic'),
        social: getString(inPracticeObj.social, 'careerInterestProfile.inPracticeBreakdown.social'),
        enterprising: getString(inPracticeObj.enterprising, 'careerInterestProfile.inPracticeBreakdown.enterprising'),
      },
    };

    // 04. MOTIVATORS AND VALUES
    const mvObj = getObj(rep.motivatorsAndValues, 'motivatorsAndValues');
    if (!Array.isArray(mvObj.topMotivators) || mvObj.topMotivators.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'motivatorsAndValues.topMotivators'");
    }
    const topMotivators = mvObj.topMotivators.map((item, idx) => {
      const tm = getObj(item, `motivatorsAndValues.topMotivators[${idx}]`);
      return {
        label: getString(tm.label, `motivatorsAndValues.topMotivators[${idx}].label`),
        percentage: getNumber(tm.percentage, `motivatorsAndValues.topMotivators[${idx}].percentage`),
      };
    });

    if (!Array.isArray(mvObj.scenarioAnalysis) || mvObj.scenarioAnalysis.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'motivatorsAndValues.scenarioAnalysis'");
    }
    const scenarioAnalysis = mvObj.scenarioAnalysis.map((item, idx) => {
      const sa = getObj(item, `motivatorsAndValues.scenarioAnalysis[${idx}]`);
      return {
        title: getString(sa.title, `motivatorsAndValues.scenarioAnalysis[${idx}].title`),
        finding: getString(sa.finding, `motivatorsAndValues.scenarioAnalysis[${idx}].finding`),
      };
    });

    const motivatorsAndValues = {
      topMotivators,
      scenarioAnalysis,
      counsellorInterpretation: getStringArray(mvObj.counsellorInterpretation, 'motivatorsAndValues.counsellorInterpretation'),
    };

    // 05. PERSONALITY AND WORKING STYLE
    const pwsObj = getObj(rep.personalityAndWorkingStyle, 'personalityAndWorkingStyle');
    if (!Array.isArray(pwsObj.traits) || pwsObj.traits.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'personalityAndWorkingStyle.traits'");
    }
    const traits = pwsObj.traits.map((item, idx) => {
      const tr = getObj(item, `personalityAndWorkingStyle.traits[${idx}]`);
      return {
        title: getString(tr.title, `personalityAndWorkingStyle.traits[${idx}].title`),
        description: getString(tr.description, `personalityAndWorkingStyle.traits[${idx}].description`),
      };
    });

    const personalityAndWorkingStyle = {
      traits,
      strengths: getStringArray(pwsObj.strengths, 'personalityAndWorkingStyle.strengths'),
      areasToDevelop: getStringArray(pwsObj.areasToDevelop, 'personalityAndWorkingStyle.areasToDevelop'),
    };

    // 06. CAREER CLUSTERS
    const ccObj = getObj(rep.careerClusters, 'careerClusters');
    if (!Array.isArray(ccObj.clusterScores) || ccObj.clusterScores.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'careerClusters.clusterScores'");
    }
    const clusterScores = ccObj.clusterScores.map((item, idx) => {
      const cs = getObj(item, `careerClusters.clusterScores[${idx}]`);
      return {
        name: getString(cs.name, `careerClusters.clusterScores[${idx}].name`),
        matchPercentage: getNumber(cs.matchPercentage, `careerClusters.clusterScores[${idx}].matchPercentage`),
      };
    });

    if (!Array.isArray(ccObj.topClustersExplained) || ccObj.topClustersExplained.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'careerClusters.topClustersExplained'");
    }
    const topClustersExplained = ccObj.topClustersExplained.map((item, idx) => {
      const te = getObj(item, `careerClusters.topClustersExplained[${idx}]`);
      return {
        rank: getNumber(te.rank, `careerClusters.topClustersExplained[${idx}].rank`),
        name: getString(te.name, `careerClusters.topClustersExplained[${idx}].name`),
        matchPercentage: getNumber(te.matchPercentage, `careerClusters.topClustersExplained[${idx}].matchPercentage`),
        explanation: getString(te.explanation, `careerClusters.topClustersExplained[${idx}].explanation`),
      };
    });

    const careerClusters = {
      clusterScores,
      topClustersExplained,
    };

    // 07. CAREER RECOMMENDATIONS
    const crObj = getObj(rep.careerRecommendations, 'careerRecommendations');
    if (!Array.isArray(crObj.paths) || crObj.paths.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'careerRecommendations.paths'");
    }
    const paths = crObj.paths.map((item, idx) => {
      const p = getObj(item, `careerRecommendations.paths[${idx}]`);
      return {
        rank: getNumber(p.rank, `careerRecommendations.paths[${idx}].rank`),
        title: getString(p.title, `careerRecommendations.paths[${idx}].title`),
        cluster: getString(p.cluster, `careerRecommendations.paths[${idx}].cluster`),
        fitRating: getString(p.fitRating, `careerRecommendations.paths[${idx}].fitRating`),
        fitScore: getNumber(p.fitScore, `careerRecommendations.paths[${idx}].fitScore`),
        skillsScore: getNumber(p.skillsScore, `careerRecommendations.paths[${idx}].skillsScore`),
        recommendationType: getRecommendationType(p.recommendationType, `careerRecommendations.paths[${idx}].recommendationType`),
      };
    });

    const topDeepDiveObj = getObj(crObj.topRecommendationDeepDive, 'careerRecommendations.topRecommendationDeepDive');
    const topRecommendationDeepDive = {
      title: getString(topDeepDiveObj.title, 'careerRecommendations.topRecommendationDeepDive.title'),
      arguments: getStringArray(topDeepDiveObj.arguments, 'careerRecommendations.topRecommendationDeepDive.arguments'),
    };

    const careerRecommendations = {
      paths,
      topRecommendationDeepDive,
    };

    // 08. STREAM AND SUBJECT RECOMMENDATION
    const ssrObj = getObj(rep.streamAndSubjectRecommendation, 'streamAndSubjectRecommendation');
    const humObj = getObj(ssrObj.humanitiesAndArts, 'streamAndSubjectRecommendation.humanitiesAndArts');
    const sciObj = getObj(ssrObj.science, 'streamAndSubjectRecommendation.science');
    const comObj = getObj(ssrObj.commerce, 'streamAndSubjectRecommendation.commerce');

    const recSubCombObj = getObj(ssrObj.recommendedSubjectCombination, 'streamAndSubjectRecommendation.recommendedSubjectCombination');
    if (!Array.isArray(recSubCombObj.specializations) || recSubCombObj.specializations.length === 0) {
      throw new Error("ValidationError: Expected non-empty array for 'streamAndSubjectRecommendation.recommendedSubjectCombination.specializations'");
    }
    const specializations = recSubCombObj.specializations.map((item, idx) => {
      const sp = getObj(item, `streamAndSubjectRecommendation.recommendedSubjectCombination.specializations[${idx}]`);
      return {
        name: getString(sp.name, `specializations[${idx}].name`),
        reason: getString(sp.reason, `specializations[${idx}].reason`),
      };
    });

    const streamAndSubjectRecommendation = {
      humanitiesAndArts: {
        status: getStreamStatus(humObj.status, 'streamAndSubjectRecommendation.humanitiesAndArts.status'),
        reason: getString(humObj.reason, 'streamAndSubjectRecommendation.humanitiesAndArts.reason'),
      },
      science: {
        status: getStreamStatus(sciObj.status, 'streamAndSubjectRecommendation.science.status'),
        reason: getString(sciObj.reason, 'streamAndSubjectRecommendation.science.reason'),
      },
      commerce: {
        status: getStreamStatus(comObj.status, 'streamAndSubjectRecommendation.commerce.status'),
        reason: getString(comObj.reason, 'streamAndSubjectRecommendation.commerce.reason'),
      },
      recommendedSubjectCombination: {
        streamName: getString(recSubCombObj.streamName, 'streamAndSubjectRecommendation.recommendedSubjectCombination.streamName'),
        coreSubjects: getStringArray(recSubCombObj.coreSubjects, 'streamAndSubjectRecommendation.recommendedSubjectCombination.coreSubjects'),
        specializations,
      },
    };

    // 09. PROFILE ROADMAP
    const prObj = getObj(rep.profileRoadmap, 'profileRoadmap');
    const p1Obj = getObj(prObj.phase1, 'profileRoadmap.phase1');
    const p2Obj = getObj(prObj.phase2, 'profileRoadmap.phase2');
    const p3Obj = getObj(prObj.phase3, 'profileRoadmap.phase3');

    const profileRoadmap = {
      phase1: {
        title: getString(p1Obj.title, 'profileRoadmap.phase1.title'),
        subtitle: getString(p1Obj.subtitle, 'profileRoadmap.phase1.subtitle'),
        bullets: getStringArray(p1Obj.bullets, 'profileRoadmap.phase1.bullets'),
        target: getString(p1Obj.target, 'profileRoadmap.phase1.target'),
      },
      phase2: {
        title: getString(p2Obj.title, 'profileRoadmap.phase2.title'),
        subtitle: getString(p2Obj.subtitle, 'profileRoadmap.phase2.subtitle'),
        bullets: getStringArray(p2Obj.bullets, 'profileRoadmap.phase2.bullets'),
        target: getString(p2Obj.target, 'profileRoadmap.phase2.target'),
      },
      phase3: {
        title: getString(p3Obj.title, 'profileRoadmap.phase3.title'),
        subtitle: getString(p3Obj.subtitle, 'profileRoadmap.phase3.subtitle'),
        bullets: getStringArray(p3Obj.bullets, 'profileRoadmap.phase3.bullets'),
        target: getString(p3Obj.target, 'profileRoadmap.phase3.target'),
      },
      uniqueDifferentiators: getStringArray(prObj.uniqueDifferentiators, 'profileRoadmap.uniqueDifferentiators'),
    };

    // 10. SUMMARY AND NEXT STEPS
    const snsObj = getObj(rep.summaryAndNextSteps, 'summaryAndNextSteps');
    const stObj = getObj(snsObj.summaryTable, 'summaryAndNextSteps.summaryTable');

    const summaryAndNextSteps = {
      summaryTable: {
        personalityType: getString(stObj.personalityType, 'summaryAndNextSteps.summaryTable.personalityType'),
        topInterestCodes: getString(stObj.topInterestCodes, 'summaryAndNextSteps.summaryTable.topInterestCodes'),
        coreMotivators: getString(stObj.coreMotivators, 'summaryAndNextSteps.summaryTable.coreMotivators'),
        strongestAptitude: getString(stObj.strongestAptitude, 'summaryAndNextSteps.summaryTable.strongestAptitude'),
        recommendedStream: getString(stObj.recommendedStream, 'summaryAndNextSteps.summaryTable.recommendedStream'),
        topCareerPath: getString(stObj.topCareerPath, 'summaryAndNextSteps.summaryTable.topCareerPath'),
        keyDifferentiator: getString(stObj.keyDifferentiator, 'summaryAndNextSteps.summaryTable.keyDifferentiator'),
        phase1Priority: getString(stObj.phase1Priority, 'summaryAndNextSteps.summaryTable.phase1Priority'),
      },
      bookingCtaText: getString(snsObj.bookingCtaText, 'summaryAndNextSteps.bookingCtaText'),
    };

    const validated: Grade68ReportPayload = {
      studentName: overrideStudentName || getString(rep.studentName, 'studentName'),
      grade: overrideGrade ? `Grade ${overrideGrade}` : getString(rep.grade, 'grade'),
      assessmentDate: getString(rep.assessmentDate, 'assessmentDate'),
      streamLeaning: getString(rep.streamLeaning, 'streamLeaning'),
      whoIsStudent,
      aptitudeAnalysis,
      careerInterestProfile,
      motivatorsAndValues,
      personalityAndWorkingStyle,
      careerClusters,
      careerRecommendations,
      streamAndSubjectRecommendation,
      profileRoadmap,
      summaryAndNextSteps,
    };

    return validated;
  }

  /**
   * Validate extracted top-level EvaluationPayload
   */
  private static validateEvaluationPayload(data: unknown): EvaluationPayload {
    if (typeof data !== 'object' || data === null) {
      throw new Error('ValidationError: Claude response is not a valid object');
    }
    const obj = data as Record<string, unknown>;

    if (!Array.isArray(obj.academicStrengths) || obj.academicStrengths.length === 0) {
      obj.academicStrengths = ['General Academics'];
    }
    if (!Array.isArray(obj.genuineInterests)) {
      obj.genuineInterests = ['Creative Pursuits'];
    }
    if (typeof obj.curiosityPattern !== 'string') {
      obj.curiosityPattern = 'Independent learner and problem solver.';
    }
    if (!Array.isArray(obj.recommendedNextSteps)) {
      obj.recommendedNextSteps = ['Explore foundational projects matching natural interests.'];
    }

    return obj as unknown as EvaluationPayload;
  }

  /**
   * Generate Diagnostic Evaluation via Anthropic Claude API (with single retry)
   */
  public static async generateEvaluation(
    context: StudentContextPayload,
    qaPairs: QuestionAnswerPair[]
  ): Promise<EvaluationPayload> {
    const client = this.getClient();
    if (!client) {
      throw new Error('Anthropic API key is not configured.');
    }

    const isGrade68 = context.classGroup === '6-8' || context.grade <= 8;
    const systemPrompt = isGrade68 ? this.getGrade68SystemPrompt() : this.getStandardSystemPrompt();
    const userPrompt = this.formatUserPrompt(context, qaPairs);
    const model = config.anthropicModel || 'claude-sonnet-4-6';

    console.log(`[ClaudeService] Requesting Grade ${context.grade} diagnostic evaluation from Anthropic model (${model}) for student ${context.studentName}...`);

    let lastError: unknown = null;

    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.warn(`[ClaudeService] Retrying Anthropic Claude API call (Attempt ${attempt} of ${maxAttempts})...`);
        }

        const requestParams: Anthropic.MessageCreateParams = {
          model,
          max_tokens: 8192,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        };

        if (isGrade68) {
          requestParams.tools = [this.GRADE_68_REPORT_TOOL];
          requestParams.tool_choice = { type: 'tool', name: 'submit_grade68_report' };
        }

        const response = await client.messages.create(requestParams);

        if (response.stop_reason === 'max_tokens') {
          throw new Error('Anthropic Claude API response truncated due to max_tokens limit');
        }

        let parsedJson: unknown;

        if (isGrade68) {
          const toolUseBlock = response.content.find((c) => c.type === 'tool_use') as { input?: unknown } | undefined;
          if (!toolUseBlock || !toolUseBlock.input) {
            throw new Error('Anthropic Claude API did not return tool_use block for submit_grade68_report');
          }
          parsedJson = toolUseBlock.input;
          const validatedReport = this.validateGrade68DiscoveryReport(parsedJson, context.studentName, context.grade);

          const payload: EvaluationPayload = {
            studentName: context.studentName,
            grade: context.grade,
            classGroup: context.classGroup,
            academicStrengths: ['General Academics'],
            effortAreas: [],
            genuineInterests: ['Creative Pursuits'],
            curiosityPattern: 'Independent learner and problem solver.',
            learningBehavior: 'Independent learner',
            activityPreferences: [],
            careerCuriosity: [],
            recommendedNextSteps: ['Explore foundational projects matching natural interests.'],
            grade68DiscoveryReport: validatedReport,
          };

          console.log(`✅ [ClaudeService] Successfully generated & validated Grade 6-8 AI discovery report for ${context.studentName}`);
          return payload;
        } else {
          const toolUseBlock = response.content.find((c) => c.type === 'tool_use') as { input?: unknown } | undefined;
          if (toolUseBlock && toolUseBlock.input) {
            parsedJson = toolUseBlock.input;
          } else {
            const textContent = response.content.find((c) => c.type === 'text')?.text || '';
            if (!textContent) {
              throw new Error('Empty text response received from Anthropic Claude API');
            }
            parsedJson = JSON.parse(this.sanitizeJsonString(textContent));
          }
          const validatedPayload = this.validateEvaluationPayload(parsedJson);
          console.log(`✅ [ClaudeService] Successfully generated & validated standard AI evaluation for ${context.studentName}`);
          return validatedPayload;
        }
      } catch (err) {
        lastError = err;
        console.error(`[ClaudeService] Attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err));
        if (attempt < maxAttempts) {
          const delayMs = attempt * 2000;
          console.log(`[ClaudeService] Backoff delay: waiting ${delayMs / 1000}s before retry ${attempt + 1}...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('ClaudeService evaluation failed after retry.');
  }
}

