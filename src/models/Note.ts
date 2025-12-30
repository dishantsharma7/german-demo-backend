import mongoose, { Schema, Document } from "mongoose";

export interface INote extends Document {
  bookingId: mongoose.Types.ObjectId;
  subAdminId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // Ensures one note per booking
    },
    subAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries by subAdminId
NoteSchema.index({ subAdminId: 1 });

// Index for faster queries by bookingId (already unique, but explicit index helps)
NoteSchema.index({ bookingId: 1 });

export const NoteModel = mongoose.model<INote>("Note", NoteSchema);

