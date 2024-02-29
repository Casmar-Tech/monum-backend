import { Schema, model } from "mongoose";
import { PermissionSchema } from "../../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import IRole from "../../domain/interfaces/IRole.js";

export const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    permissions: { type: [PermissionSchema], required: true },
  },
  { timestamps: true }
);

export const MongoRoleModel = model("role", RoleSchema);
