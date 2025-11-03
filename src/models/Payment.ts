import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus, PaymentMethod } from "./enums";
import { BookingModel } from "./Booking";

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
  },
  { timestamps: true }
);

/**
 * Post-save Hook:
 * Sync Payment → Booking
 */
PaymentSchema.post("save", async function (doc) {
  if (!doc.bookingId) return;

  await BookingModel.findByIdAndUpdate(doc.bookingId, {
    paymentStatus: doc.status,
  });
});

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
