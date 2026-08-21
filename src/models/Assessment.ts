import mongoose, { Schema, Document, Model } from 'mongoose';
import { ClassGroupType } from './StudentProfile.js';

export type AssessmentStatus = 'in_progress' | 'completed';

export interface IAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentProfileId?: mongoose.Types.ObjectId;
  classGroup: ClassGroupType;
  grade: number;
  status: AssessmentStatus;
  currentQuestionIndex: number;
  answers: Record<string, unknown>;
  startedAt: Date;
  lastSavedAt: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentProfile',
    },
    classGroup: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
