import mongoose, { Schema, Document, Model } from 'mongoose';

export type ClassGroupType = '6-8' | '9-10' | '11-12';

export const ALLOWED_CLASS_GROUPS: ClassGroupType[] = ['6-8', '9-10', '11-12'];

export interface CollegeGoals {
  targetDegree?: string;
  targetCountries?: string[];
  targetUniversities?: string;
  selectionPriorities?: string[];
}

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  onboardingCompleted: boolean;
  age?: number;
  school?: string;
  city?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    classGroup: {
      type: String,
      enum: {
        values: ALLOWED_CLASS_GROUPS,
        message: 'Invalid class group. Allowed values: 6-8, 9-10, 11-12',
      },
      index: true,
    },
    classLevel: {
      type: Number,
      min: [6, 'Class level must be between 6 and 12'],
      max: [12, 'Class level must be between 6 and 12'],
    },
    grade: {
      type: Number,
      min: [6, 'Grade must be between 6 and 12'],
      max: [12, 'Grade must be between 6 and 12'],
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    schoolBoard: {
      type: String,
      trim: true,
    },
    subjects: {
      type: [String],
      default: [],
    },
    stream: {
      type: String,
      trim: true,
    },
    academicPerformance: {
      type: String,
      trim: true,
    },
    standardizedScores: {
      type: String,
      trim: true,
    },
    collegeGoals: {
      targetDegree: { type: String, trim: true },
      targetCountries: { type: [String], default: [] },
      targetUniversities: { type: String, trim: true },
      selectionPriorities: { type: [String], default: [] },
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      min: [5, 'Age must be realistic'],
      max: [25, 'Age must be realistic'],
    },
    school: {
      type: String,
      trim: true,
      maxlength: [200, 'School name cannot exceed 200 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    parentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ||
  mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
