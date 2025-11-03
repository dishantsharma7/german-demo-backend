import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  senderId: mongoose.Types.ObjectId;
  messageText: string;
  attachments?: string[];
  sentAt: Date;
  readBy: mongoose.Types.ObjectId[];
}

export interface IChat extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subAdminId: mongoose.Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messageText: { type: String, required: true },
    attachments: [{ type: String }],
    sentAt: { type: Date, default: Date.now },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subAdminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);
