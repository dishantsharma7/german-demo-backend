import mongoose, { Schema, Document } from "mongoose";
import { ZoomSessionStatus } from "./enums";
import { BookingModel } from "./Booking";
import { BookingStatus } from "./enums";

export interface IZoomSession extends Document {
  bookingId: mongoose.Types.ObjectId;
  meetingId: string;
  joinUrl: string;
  startTime: Date;
  endTime?: Date;
  recordingUrl?: string;
  status: ZoomSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ZoomSessionSchema = new Schema<IZoomSession>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    meetingId: { type: String, required: true },
    joinUrl: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    recordingUrl: { type: String },
    status: {
      type: String,
      enum: Object.values(ZoomSessionStatus),
      default: ZoomSessionStatus.SCHEDULED,
    },
  },
  { timestamps: true }
);

/**
 * Post-save Hook:
 * Update Booking when session is completed
 */
ZoomSessionSchema.post("save", async function (doc) {
  if (doc.status === ZoomSessionStatus.COMPLETED) {
    await BookingModel.findByIdAndUpdate(doc.bookingId, {
      bookingStatus: BookingStatus.COMPLETED,
      zoomRecordingLink: doc.recordingUrl,
    });
  }
});

export const ZoomSessionModel = mongoose.model<IZoomSession>(
  "ZoomSession",
  ZoomSessionSchema
);
