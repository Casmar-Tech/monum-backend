import { Types } from "mongoose";

export default interface IUser {
  _id?: Types.ObjectId;
  id?: string;
  email: string;
  username: string;
  createdAt?: Date;
  name?: string;
  photo?: string;
  hashedPassword?: string;
  isTemporalPassword?: boolean;
  googleId?: string;
  token?: string;
  language: string;
}
