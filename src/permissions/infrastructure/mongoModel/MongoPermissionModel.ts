import { Schema, model } from "mongoose";
import IPermission from "../../domain/interfaces/IPermission.js";

export const PermissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    action: { type: String, required: true, unique: true },
    entity: { type: String, required: true },
    max: { type: Number },
    min: { type: Number },
  },
  { timestamps: true }
);

PermissionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PermissionSchema.set("toJSON", { virtuals: true });
PermissionSchema.set("toObject", { virtuals: true });

export const MongoPermissionModel = model("permission", PermissionSchema);
