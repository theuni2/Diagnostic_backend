import {
  DIAGNOSTIC_QUESTIONS_REGISTRY,
  DiagnosticQuestion,
} from '../config/diagnostic.config.js';
import { ClassGroupType } from '../models/StudentProfile.js';

export class DiagnosticService {
  /**
   * Filter and return grade-appropriate diagnostic questions
   */
  public static getQuestionsForStudent(
    grade: number,
    classGroup: ClassGroupType
  ): DiagnosticQuestion[] {
    let effectiveGrade = grade;
    if (classGroup === '6-8' && ![6, 7, 8].includes(effectiveGrade)) {
      effectiveGrade = 8;
    } else if (classGroup === '9-10' && ![9, 10].includes(effectiveGrade)) {
      effectiveGrade = 10;
    } else if (classGroup === '11-12' && ![11, 12].includes(effectiveGrade)) {
      effectiveGrade = 12;
    }

    const filtered = DIAGNOSTIC_QUESTIONS_REGISTRY.filter((q) => {
      const matchGroup = q.applicableClassGroups.includes(classGroup);
      const matchGrade = q.applicableGrades.includes(effectiveGrade);
      return matchGroup && matchGrade;
    });

    if (filtered.length === 0) {
      return DIAGNOSTIC_QUESTIONS_REGISTRY.filter((q) =>
        q.applicableClassGroups.includes(classGroup)
      ).sort((a, b) => a.order - b.order);
    }

    return filtered.sort((a, b) => a.order - b.order);
  }
}
