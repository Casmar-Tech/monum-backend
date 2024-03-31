import { model, Schema } from "mongoose";
import IUser from "../../domain/IUser.js";

const userSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    name: { type: String },
    hashedPassword: { type: String },
    createdAt: { type: Date, required: true },
    photo: {
      type: String,
      validate: {
        validator: function (value: any) {
          const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
          return urlPattern.test(value);
        },
        message: "Photo must be a valid URL",
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (value: any) {
          return /^\d+$/.test(value);
        },
        message: "The google id must be numeric",
      },
    },
    token: { type: String },
    language: {
      type: String,
      enum: ["en_US", "fr_FR", "ca_ES", "es_ES"],
    },
    recoveryPasswordHashedCode: { type: String },
    lastRecoveryPasswordEmailSent: {
      type: Date,
    },
    lastRecoveryPasswordEmailResent: {
      type: Date,
    },
    recoveryPasswordCodeValidity: {
      type: Date,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "roles",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "organizations",
    },
    deviceId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const MongoUserModel = model("users", userSchema);
