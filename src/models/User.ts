import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "./enums";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  contactNumber?: string;
  profileImage?: string;
  serviceId?: mongoose.Types.ObjectId; // only for sub-admins
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    contactNumber: { type: String },
    profileImage: { type: String },
    // serviceId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Service",
    //   required: function (this: IUser) {
    //     return this.role === UserRole.SUBADMIN;
    //   },
    // },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: function (this: IUser) {
        return this.role === UserRole.SUBADMIN;
      },
      validate: {
        validator: function (value: any) {
          // Allow undefined/null for non-subadmins
          if (this.role !== UserRole.SUBADMIN) return true;
          // Validate ObjectId format for subadmins
          return mongoose.Types.ObjectId.isValid(value);
        },
        message: "Invalid serviceId provided.",
      },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
