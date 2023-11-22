import { model, Schema } from "mongoose";
import IUser from "../../domain/IUser.js";

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  hashedPassword: { type: String },
  isTemporalPassword: { type: Boolean, default: false },
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
});

export const MongoUserModel = model("users", userSchema);
