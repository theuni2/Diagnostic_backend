import { Assessment } from '../models/Assessment.js';
import { ProfileService } from './profile.service.js';

export class AssessmentService {
  /**
   * Get active in-progress assessment for student
   */
  public static async getActiveAssessment(userId: string) {
    return await Assessment.findOne({ userId, status: 'in_progress' });
  }

  /**
   * Start new diagnostic assessment for student
   */
  public static async startAssessment(userId: string) {
    const profile = await ProfileService.getProfileByUserId(userId);
    if (!profile.classGroup) {
      throw { statusCode: 400, message: 'Please complete class group selection before starting diagnostic.' };
    }

    // Default grade if not set
    const grade = profile.grade || (profile.classGroup === '6-8' ? 7 : profile.classGroup === '9-10' ? 9 : 11);

    // Cancel / archive any previous in-progress assessments
    await Assessment.updateMany(
      { userId, status: 'in_progress' },
      { status: 'completed', submittedAt: new Date() }
    );

    const newAssessment = await Assessment.create({
      userId,
      studentProfileId: profile._id,
      classGroup: profile.classGroup,
      grade,
      status: 'in_progress',
      currentQuestionIndex: 0,
      answers: {},
      startedAt: new Date(),
      lastSavedAt: new Date(),
    });

    return newAssessment;
  }

  /**
   * Auto-save assessment answer progress
   */
  public static async saveProgress(
    userId: string,
    currentQuestionIndex: number,
    answers: Record<string, unknown>
  ) {
    let assessment = await Assessment.findOne({ userId, status: 'in_progress' });
    if (!assessment) {
      assessment = await this.startAssessment(userId);
    }

    assessment.currentQuestionIndex = currentQuestionIndex;
    assessment.answers = { ...(assessment.answers || {}), ...answers };
    assessment.lastSavedAt = new Date();
    assessment.markModified('answers');
    await assessment.save();

    return assessment;
  }

  /**
   * Complete and submit assessment
   */
  public static async submitAssessment(userId: string) {
    const assessment = await Assessment.findOne({ userId, status: 'in_progress' });
    if (!assessment) {
      throw { statusCode: 404, message: 'No active diagnostic assessment found to submit.' };
    }

    assessment.status = 'completed';
    assessment.submittedAt = new Date();
    await assessment.save();

    return assessment;
  }
}
