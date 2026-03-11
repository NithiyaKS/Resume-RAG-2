import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  education: string;
  totalExperience: number;
  relevantExperience: number;
  skills: string[];
  text: string;
  embedding: number[];
  embeddingStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    totalExperience: {
      type: Number,
      default: 0,
    },
    relevantExperience: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    text: {
      type: String,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
