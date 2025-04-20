import { Schema, model } from "mongoose";
import { PermissionSchema } from "../../../permissions/infrastructure/mongoModel/MongoPermissionModel.js";
import IPlan from "../../domain/interfaces/IPlan.js";

export const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    permissions: { type: [PermissionSchema], required: true },
  },
  { timestamps: true }
);

PlanSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

PlanSchema.set("toJSON", { virtuals: true });
PlanSchema.set("toObject", { virtuals: true });

export const MongoPlanModel = model("plan", PlanSchema);
