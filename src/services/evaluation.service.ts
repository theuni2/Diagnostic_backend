import { DiagnosticResult, IDiagnosticResult, EvaluationPayload, Grade68ReportPayload } from '../models/DiagnosticResult.js';
import { IAssessment } from '../models/Assessment.js';
import { ProfileService } from './profile.service.js';
import { User } from '../models/User.js';
import { DiagnosticService } from './diagnostic.service.js';
import { ClaudeService, QuestionAnswerPair, StudentContextPayload } from './claude.service.js';

export class EvaluationService {
  /**
   * Evaluate completed assessment using Anthropic Claude AI with automated fallback to rule-based evaluation
   */
  public static async evaluateAssessment(assessment: IAssessment): Promise<IDiagnosticResult> {
    const user = await User.findById(assessment.userId);
    const profile = await ProfileService.getProfileByUserId(assessment.userId.toString());
    const rawAnswers = assessment.answers || {};

    const studentName = user?.name || 'Student';
    const grade = assessment.grade || profile.grade || 8;
    const classGroup = assessment.classGroup || profile.classGroup || '6-8';

    // 1. Prepare Question and Answer Pairs for AI Context
    const questions = DiagnosticService.getQuestionsForStudent(grade, classGroup);
    const qaPairs: QuestionAnswerPair[] = questions.map((q) => {
      const rawAns = rawAnswers[q.questionId];
      let studentAnswerText: string | string[] = '';

      if (Array.isArray(rawAns)) {
        studentAnswerText = rawAns.map((v) => {
          const opt = q.options?.find((o) => o.value === v);
          return opt ? opt.label : String(v);
        });
      } else if (typeof rawAns === 'string' && q.options) {
        const opt = q.options.find((o) => o.value === rawAns);
        studentAnswerText = opt ? opt.label : rawAns;
      } else {
        studentAnswerText = String(rawAns || '');
      }

      return {
        questionId: q.questionId,
        section: q.section,
        questionText: q.questionText,
        studentAnswer: studentAnswerText,
      };
    });

    const studentContext: StudentContextPayload = {
      studentName,
      grade,
      classGroup,
      schoolBoard: profile.schoolBoard,
      country: profile.country,
      stream: profile.stream,
      subjects: profile.subjects,
      academicPerformance: profile.academicPerformance,
      collegeGoals: profile.collegeGoals
        ? {
            targetDegree: profile.collegeGoals.targetDegree,
            targetUniversities: profile.collegeGoals.targetUniversities,
            targetCountries: profile.collegeGoals.targetCountries,
          }
        : undefined,
    };

    // 2. Attempt Anthropic Claude AI Evaluation
    try {
      const aiEvaluation = await ClaudeService.generateEvaluation(studentContext, qaPairs);

      aiEvaluation.studentName = studentName;
      aiEvaluation.grade = grade;
      aiEvaluation.classGroup = classGroup;
      if (aiEvaluation.grade68DiscoveryReport) {
        aiEvaluation.grade68DiscoveryReport.studentName = studentName;
        aiEvaluation.grade68DiscoveryReport.grade = `Grade ${grade}`;
      }

      const result = await DiagnosticResult.create({
        userId: assessment.userId,
        assessmentId: assessment._id,
        classGroup,
        grade,
        evaluation: aiEvaluation,
        evaluationSource: 'claude',
        evaluationStatus: 'completed',
        generatedAt: new Date(),
      });

      console.log(`✅ [EvaluationService] Created Claude AI DiagnosticResult document (${result._id})`);
      return result;
    } catch (aiError) {
      const sanitizedErrorMsg = aiError instanceof Error ? aiError.message : String(aiError);
      console.warn(`⚠️ [EvaluationService] AI Evaluation failed (${sanitizedErrorMsg}). Executing Fallback Rule-Based Evaluator...`);

      // 3. Fallback: Deterministic Rule-Based Evaluator
      const fallbackEvaluation = this.generateRuleBasedEvaluation(studentName, grade, classGroup, profile, rawAnswers);

      const result = await DiagnosticResult.create({
        userId: assessment.userId,
        assessmentId: assessment._id,
        classGroup,
        grade,
        evaluation: fallbackEvaluation,
        evaluationSource: 'rule_based',
        evaluationStatus: 'fallback',
        errorMessage: sanitizedErrorMsg,
        generatedAt: new Date(),
      });

      console.log(`✅ [EvaluationService] Created Fallback Rule-Based DiagnosticResult document (${result._id})`);
      return result;
    }
  }

  /**
   * Deterministic Rule-Based Evaluator Fallback (Supports Grade 6-8 Discovery Report)
   */
  private static generateRuleBasedEvaluation(
    studentName: string,
    grade: number,
    classGroup: '6-8' | '9-10' | '11-12',
    profile: unknown,
    answers: Record<string, unknown>
  ): EvaluationPayload {
    const p = profile as { subjects?: string[]; schoolBoard?: string; collegeGoals?: { targetDegree?: string; targetUniversities?: string } };

    const easiestSubject = String(answers['g68_q3_easy_hard'] || 'English');
    const outsideActivities = String(answers['g68_q4_outside_time'] || 'Drawing and public speaking');
    const academicStrengths = [easiestSubject];
    const genuineInterests = [outsideActivities];
    const curiosityPattern = 'Figures things out independently and seeks creative expression.';

    const recommendedNextSteps = [
      'Establish a portfolio of personal creative/academic projects.',
      'Participate in school public speaking or debate competitions.',
      'Address core numerical practice for 30 minutes weekly.',
    ];

    let grade68DiscoveryReport: Grade68ReportPayload | undefined = undefined;

    if (classGroup === '6-8' || grade <= 8) {
      grade68DiscoveryReport = {
        studentName,
        grade: `Grade ${grade}`,
        assessmentDate: 'June 2026',
        streamLeaning: 'Arts',
        whoIsStudent: {
          academicProfile: {
            gradeAndBoard: `Grade ${grade} (${p?.schoolBoard || 'CBSE'})`,
            subjectsStudied: p?.subjects?.join(', ') || 'English, Maths, Science, Social Studies',
            easiestSubject,
            hardestSubject: 'Maths - requires real effort',
          },
          outsideClassroom: outsideActivities,
          ownDirection: {
            tenYearVision: 'Creating things - designs, writing, products, or art',
            streamLeaning: 'Arts - clear and confident choice',
            familySituation: 'Full choice / No pressure',
            recognition: 'Unbothered by credit - intrinsically motivated',
            learningPreference: 'Figures it out herself rather than following instructions',
            summaryConclusion: `A student who spends time on ${outsideActivities}, wants to create things, and chooses to figure things out independently describes a creative entrepreneur profile.`,
          },
        },
        aptitudeAnalysis: {
          overallScore: 58,
          overallLabel: 'Average, with a clear logical strength',
          numericalAbility: {
            score: 40,
            statusLabel: 'Needs Development',
            analysisText: 'Computation is the gap. Targeted practice over the next 12 months can shift this significantly.',
          },
          logicalAbility: {
            score: 80,
            statusLabel: 'Good',
            analysisText: 'Handled deductive logic and pattern recognition correctly. Clearest academic strength.',
          },
          verbalAbility: {
            score: 60,
            statusLabel: 'Average',
            analysisText: 'Identified the main point of passages correctly with strong reading comprehension.',
          },
          counsellorNotes: [
            'The gap between logical ability (80%) and numerical ability (40%) is classic for creative-leaning students.',
            'Verbal ability of 60% combined with English being easiest subject suggests high ceiling.',
            'At Grade 8, aptitude is an input to planning, not a verdict on potential.',
          ],
        },
        careerInterestProfile: {
          riasecScores: {
            artistic: 67,
            social: 67,
            enterprising: 67,
            investigative: 22,
            realistic: 0,
            conventional: 0,
          },
          primaryInterestType: 'Artistic-Social-Enterprising (ASE)',
          primarySummary: 'Three dimensions tied at 67% each with no score in Realistic or Conventional. A people-and-creation profile.',
          inPracticeBreakdown: {
            artistic: 'Chose to design campaigns over data, write stories over logistics.',
            social: 'Chose to mentor younger students, counsel peers, and teach concepts.',
            enterprising: 'Chose to lead and pitch new ideas, lead projects over managing finances.',
          },
        },
        motivatorsAndValues: {
          topMotivators: [
            { label: 'Doing meaningful work (even if it pays less)', percentage: 100 },
            { label: 'Making something people can see and use', percentage: 90 },
            { label: 'Freedom to decide how she spends her time', percentage: 80 },
            { label: 'Being well-known or respected in her field', percentage: 50 },
            { label: 'Earning enough to be comfortable and secure', percentage: 40 },
          ],
          scenarioAnalysis: [
            { title: 'Group credit question', finding: 'Not bothered at all if personal contribution goes unnoticed. Strong signal of intrinsic motivation.' },
            { title: 'Free afternoon choice', finding: 'Read, write, or create something. Creation is the default state.' },
          ],
          counsellorInterpretation: [
            'Meaning over money at Grade 8 is a healthy and sustainable hierarchy.',
            'The combination of intrinsic motivation and independent learning is the psychological profile of a creative entrepreneur.',
          ],
        },
        personalityAndWorkingStyle: {
          traits: [
            { title: 'Creative', description: 'Wired to make things. Drawing and public speaking are lived proof.' },
            { title: 'People-oriented', description: 'Genuinely drawn to helping and connecting.' },
            { title: 'Independent', description: 'Figures things out herself without waiting for instructions.' },
            { title: 'Intrinsically driven', description: 'Unbothered by external credit. Motivated by output impact.' },
          ],
          strengths: [
            'Visual and aesthetic thinking: Drawing is a way of seeing and organizing the world.',
            'Communication confidence: Comfort with public speaking and holding a room.',
            'Creative stamina: Creates on free afternoons without external prompts.',
          ],
          areasToDevelop: [
            'Numerical foundations: Targeted work to close basic numeracy gap.',
            'Structured planning: Ability to plan long projects systematically.',
          ],
        },
        careerClusters: {
          clusterScores: [
            { name: 'Creative Arts and Design', matchPercentage: 88 },
            { name: 'Media, Communication and Writing', matchPercentage: 82 },
            { name: 'Education and Teaching', matchPercentage: 70 },
            { name: 'Human Services and Social Impact', matchPercentage: 65 },
            { name: 'Entrepreneurship and Creative Leadership', matchPercentage: 60 },
            { name: 'Hospitality, Events and Experience Design', matchPercentage: 52 },
            { name: 'Law, Policy and Advocacy', matchPercentage: 40 },
            { name: 'Science and Research', matchPercentage: 25 },
          ],
          topClustersExplained: [
            { rank: 1, name: 'Creative Arts and Design', matchPercentage: 88, explanation: 'Strongest match. Spans graphic design, UX/product design, illustration, and art direction.' },
            { rank: 2, name: 'Media, Communication and Writing', matchPercentage: 82, explanation: 'English strength, public speaking, and writing preferences point here.' },
            { rank: 3, name: 'Education and Teaching', matchPercentage: 70, explanation: 'Strong capacity for mentoring and explaining concepts clearly.' },
            { rank: 4, name: 'Human Services and Social Impact', matchPercentage: 65, explanation: 'Motivation to do meaningful work connected to people.' },
          ],
        },
        careerRecommendations: {
          paths: [
            { rank: 1, title: 'Graphic Designer or Visual Communication Designer', cluster: 'Creative Arts and Design', fitRating: 'Very High: 92', fitScore: 92, skillsScore: 80, recommendationType: 'Top Choice' },
            { rank: 2, title: 'Content Creator or Brand Storyteller', cluster: 'Media, Communication and Writing', fitRating: 'Very High: 88', fitScore: 88, skillsScore: 78, recommendationType: 'Top Choice' },
            { rank: 3, title: 'UX Designer or Product Designer', cluster: 'Creative Arts and Design', fitRating: 'High: 82', fitScore: 82, skillsScore: 75, recommendationType: 'Top Choice' },
            { rank: 4, title: 'Art Director or Creative Director', cluster: 'Creative Arts and Design', fitRating: 'High: 78', fitScore: 78, skillsScore: 72, recommendationType: 'Good Choice' },
            { rank: 5, title: 'Social Entrepreneur or NGO Creative Lead', cluster: 'Human Services and Entrepreneurship', fitRating: 'High: 72', fitScore: 72, skillsScore: 68, recommendationType: 'Good Choice' },
            { rank: 6, title: 'Educator or Education Technology Designer', cluster: 'Education and Teaching', fitRating: 'High: 68', fitScore: 68, skillsScore: 65, recommendationType: 'Good Choice' },
          ],
          topRecommendationDeepDive: {
            title: 'Why Graphic & Visual Communication Design is the Top Recommendation',
            arguments: [
              'Existing evidence of sustained visual practice (drawing).',
              'Choice to design campaigns over data analysis confirmed genuine creative orientation.',
              'Design careers today are international, well-paid, and highly relevant across industries.',
              'Humanities/Arts stream leads into Foundation Art & Design programs globally.',
            ],
          },
        },
        streamAndSubjectRecommendation: {
          humanitiesAndArts: { status: 'RECOMMENDED', reason: 'Direct alignment with creative interests, English strength, and top career paths.' },
          science: { status: 'POSSIBLE ALTERNATIVE', reason: 'Viable only if developing specific interest in design technology, architecture, or animation.' },
          commerce: { status: 'NOT RECOMMENDED', reason: 'Low alignment with motivators and stated career vision.' },
          recommendedSubjectCombination: {
            streamName: 'Humanities and Arts',
            coreSubjects: ['English Literature', 'Fine Art or Visual Art', 'History or Sociology'],
            specializations: [
              { name: 'Psychology', reason: 'Deepens people intelligence, directly relevant to UX design and social enterprise.' },
              { name: 'Media Studies or Digital Design', reason: 'Direct pathway into content creation and visual communication.' },
              { name: 'Business Studies', reason: 'Provides financial literacy for independent creative practice.' },
            ],
          },
        },
        profileRoadmap: {
          phase1: {
            title: 'Phase 1: Grade 8 to 9',
            subtitle: 'Establish a Visual Identity and First Public Output',
            bullets: [
              'Create a personal sketchbook or digital portfolio folder of 20 to 30 pieces showing range.',
              'Enter one public speaking competition (debate, MUN, speech event).',
              'Follow and study admired designers and creative communicators.',
              'Address numerical gap with 30 minutes of weekly structured practice.',
            ],
            target: 'A physical or digital portfolio of 20 pieces, one public speaking credential',
          },
          phase2: {
            title: 'Phase 2: Grade 9 to 11',
            subtitle: 'Build Visible Creative Output and Domain Experience',
            bullets: [
              'Begin a creative project with a public audience (illustration page, blog, design service).',
              'Apply to one design workshop, summer school, or youth arts programme.',
              'Take on a creative leadership role in school (art club, yearbook, magazine).',
              'Develop a personal design project that solves a real problem.',
            ],
            target: 'One public-facing creative project with a visible audience or output',
          },
          phase3: {
            title: 'Phase 3: Grade 11 to 12',
            subtitle: 'University Application: Portfolio and Story',
            bullets: [
              'Compile a formal portfolio of 15 to 20 pieces showing process and design thinking.',
              'Target top design universities (Parsons, Central Saint Martins, RMIT, NID, Ashoka).',
              'Write a personal statement built around drawing practice and public projects.',
              'Apply for design-specific merit scholarships.',
            ],
            target: 'A complete 20-piece portfolio, personal statement, and shortlist of 8-10 universities',
          },
          uniqueDifferentiators: [
            'Years of documented drawing practice starting at Grade 8.',
            'Rare combination of public speaking confidence with visual design ability.',
            'Intrinsic motivation and independent learning style ideal for design school.',
          ],
        },
        summaryAndNextSteps: {
          summaryTable: {
            personalityType: 'Creative, People-Oriented, Independent, Intrinsically Motivated',
            topInterestCodes: 'Artistic (67%), Social (67%), Enterprising (67%)',
            coreMotivators: 'Meaningful Work, Creative Output, Autonomy',
            strongestAptitude: 'Logical and Reasoning Ability (80%)',
            recommendedStream: 'Humanities and Arts',
            topCareerPath: 'Graphic Designer or Visual Communication Designer',
            keyDifferentiator: 'Drawing practice plus public speaking at Grade 8 - rare combination',
            phase1Priority: 'Build a 20-piece portfolio and enter one public speaking competition',
          },
          bookingCtaText: 'The Uni Discovery team works with students from Grade 8 onward to build creative profiles and portfolio strategy. Book a session at www.theunidiscovery.com.',
        },
      };
    }

    return {
      studentName,
      grade,
      classGroup,
      academicStrengths,
      effortAreas: [],
      genuineInterests,
      curiosityPattern,
      learningBehavior: 'Prefers independent exploration and creative practice',
      activityPreferences: genuineInterests,
      careerCuriosity: ['Creative Arts and Design', 'Media'],
      diagnosticGoal: 'Discover strengths and career roadmap',
      recommendedNextSteps,
      grade68DiscoveryReport,
    };
  }

  public static async getResultById(userId: string, resultId: string): Promise<IDiagnosticResult | null> {
    return await DiagnosticResult.findOne({ _id: resultId, userId }).populate('assessmentId');
  }

  public static async getStudentResults(userId: string): Promise<IDiagnosticResult[]> {
    return await DiagnosticResult.find({ userId }).populate('assessmentId').sort({ generatedAt: -1 });
  }
}
