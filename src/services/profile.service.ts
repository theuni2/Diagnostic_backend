import { StudentProfile, IStudentProfile, ALLOWED_CLASS_GROUPS, ClassGroupType, CollegeGoals } from '../models/StudentProfile.js';

export interface UpdateProfileDTO {
  classGroup?: ClassGroupType;
  classLevel?: number;
  grade?: number;
  country?: string;
  schoolBoard?: string;
  subjects?: string[];
  stream?: string;
  academicPerformance?: string;
  standardizedScores?: string;
  collegeGoals?: CollegeGoals;
  onboardingCompleted?: boolean;
  age?: number;
  school?: string;
  city?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export class ProfileService {
  /**
   * Retrieve Student Profile by User ID
   */
  public static async getProfileByUserId(userId: string): Promise<IStudentProfile> {
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = await StudentProfile.create({ userId });
    }
    return profile;
  }

  /**
   * Update Student Profile with STRICT backend class-group validation
   */
  public static async updateProfile(
    userId: string,
    data: UpdateProfileDTO
  ): Promise<IStudentProfile> {
    // 1. Strict Backend Class-Group Security Validation
    if (data.classGroup !== undefined) {
      if (!ALLOWED_CLASS_GROUPS.includes(data.classGroup)) {
        throw {
          statusCode: 400,
          message: `Invalid class group '${data.classGroup}'. Allowed values: 6-8, 9-10, 11-12`,
        };
      }
    }

    // 2. Class Level Range Validation against Class Group
    const checkLevel = data.grade || data.classLevel;
    if (checkLevel !== undefined && data.classGroup) {
      const level = checkLevel;
      const group = data.classGroup;

      if (group === '6-8' && (level < 6 || level > 8)) {
        throw { statusCode: 400, message: 'Class level/grade must be 6, 7, or 8 for class group 6-8' };
      }
      if (group === '9-10' && (level < 9 || level > 10)) {
        throw { statusCode: 400, message: 'Class level/grade must be 9 or 10 for class group 9-10' };
      }
      if (group === '11-12' && (level < 11 || level > 12)) {
        throw { statusCode: 400, message: 'Class level/grade must be 11 or 12 for class group 11-12' };
      }
    }

    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = new StudentProfile({ userId, ...data });
    } else {
      if (data.classGroup !== undefined) profile.classGroup = data.classGroup;
      if (data.classLevel !== undefined) profile.classLevel = data.classLevel;
      if (data.grade !== undefined) profile.grade = data.grade;
      if (data.country !== undefined) profile.country = data.country;
      if (data.schoolBoard !== undefined) profile.schoolBoard = data.schoolBoard;
      if (data.subjects !== undefined) profile.subjects = data.subjects;
      if (data.stream !== undefined) profile.stream = data.stream;
      if (data.academicPerformance !== undefined) profile.academicPerformance = data.academicPerformance;
      if (data.standardizedScores !== undefined) profile.standardizedScores = data.standardizedScores;
      if (data.collegeGoals !== undefined) profile.collegeGoals = data.collegeGoals;
      if (data.onboardingCompleted !== undefined) profile.onboardingCompleted = data.onboardingCompleted;
      if (data.age !== undefined) profile.age = data.age;
      if (data.school !== undefined) profile.school = data.school;
      if (data.city !== undefined) profile.city = data.city;
      if (data.parentName !== undefined) profile.parentName = data.parentName;
      if (data.parentPhone !== undefined) profile.parentPhone = data.parentPhone;
      if (data.parentEmail !== undefined) profile.parentEmail = data.parentEmail;
    }

    await profile.save();
    return profile;
  }
}
