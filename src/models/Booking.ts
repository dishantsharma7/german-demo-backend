import mongoose, { Schema, Document } from "mongoose";
import { BookingStatus, PaymentStatus } from "./enums";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  subAdminId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  date: Date;
  timeslot: { start: string; end: string };
  amount: number;
  paymentStatus: PaymentStatus;
  zoomLink?: string;
  zoomRecordingLink?: string;
  bookingStatus: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subAdminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: Date, required: true },
    timeslot: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    zoomLink: { type: String },
    zoomRecordingLink: { type: String },
    bookingStatus: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.SCHEDULED,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save Hook:
 * - Prevent Zoom link unless payment is successful
 */
BookingSchema.pre("save", function (next) {
  const booking = this as IBooking;

  if (booking.zoomLink && booking.paymentStatus !== PaymentStatus.SUCCESS) {
    return next(
      new Error("Cannot create Zoom link before successful payment.")
    );
  }

  next();
});

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);
