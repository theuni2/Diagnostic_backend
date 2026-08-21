import { Request, Response, NextFunction } from 'express';
import { DiagnosticService } from '../services/diagnostic.service.js';
import { AssessmentService } from '../services/assessment.service.js';
import { EvaluationService } from '../services/evaluation.service.js';
import { ProfileService } from '../services/profile.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const profile = await ProfileService.getProfileByUserId(req.user.id);
    if (!profile.classGroup) {
      sendError(res, 'Please select your class group before accessing diagnostic questions.', 400);
      return;
    }

    const grade = profile.grade || (profile.classGroup === '6-8' ? 7 : profile.classGroup === '9-10' ? 9 : 11);
    const questions = DiagnosticService.getQuestionsForStudent(grade, profile.classGroup);

    sendSuccess(res, 'Diagnostic questions fetched successfully', {
      grade,
      classGroup: profile.classGroup,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const assessment = await AssessmentService.getActiveAssessment(req.user.id);
    sendSuccess(res, 'Active assessment state retrieved', { assessment });
  } catch (error) {
    next(error);
  }
};

export const startAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const assessment = await AssessmentService.startAssessment(req.user.id);
    sendSuccess(res, 'New diagnostic assessment started', { assessment }, 201);
  } catch (error) {
    next(error);
  }
};

export const saveProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const { currentQuestionIndex, answers } = req.body;
    const assessment = await AssessmentService.saveProgress(
      req.user.id,
      currentQuestionIndex || 0,
      answers || {}
    );

    sendSuccess(res, 'Assessment progress auto-saved', { assessment });
  } catch (error) {
    next(error);
  }
};

export const submitAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    // Auto-save any final answers sent in body before completing
    if (req.body.answers) {
      await AssessmentService.saveProgress(
        req.user.id,
        req.body.currentQuestionIndex || 0,
        req.body.answers
      );
    }

    const completedAssessment = await AssessmentService.submitAssessment(req.user.id);
    const result = await EvaluationService.evaluateAssessment(completedAssessment);

    sendSuccess(res, 'Assessment submitted and diagnostic report generated!', {
      assessment: completedAssessment,
      resultId: result._id,
      evaluation: result.evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const getResults = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const results = await EvaluationService.getStudentResults(req.user.id);
    sendSuccess(res, 'Diagnostic results history fetched', { results });
  } catch (error) {
    next(error);
  }
};

export const getResultById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: 'Not authenticated' };
    }

    const { id } = req.params;
    const result = await EvaluationService.getResultById(req.user.id, id);
    if (!result) {
      sendError(res, 'Diagnostic report not found or access denied', 404);
      return;
    }

    sendSuccess(res, 'Diagnostic report fetched successfully', { result });
  } catch (error) {
    next(error);
  }
};
