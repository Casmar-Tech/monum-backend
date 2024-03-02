import { MongoRoleModel } from "../../roles/infrastructure/mongoModel/MongoRoleModel.js";
import IUserWithPermissions from "../domain/IUserWithPermissions.js";
import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import GetRealPermissionsOfUser from "../../permissions/application/GetRealPermissionsOfUser.js";
import jwt from "jsonwebtoken";
import { ApolloError } from "apollo-server-errors";

export default async function GetTouristUserOfOrganization(
  organizationId: string
): Promise<IUserWithPermissions> {
  const touristRole = await MongoRoleModel.findOne({
    name: "tourist",
  });
  if (!touristRole) {
    throw new ApolloError("Tourist role not found", "ROLE_NOT_FOUND");
  }
  const touristUser = (await MongoUserModel.findOne({
    organizationId,
    roleId: touristRole.id,
  }).lean()) as IUserWithPermissions;
  if (!touristUser || !touristUser._id) {
    throw new ApolloError("Tourist user not found", "USER_NOT_FOUND");
  }
  const realPermissions = await GetRealPermissionsOfUser(
    touristUser._id.toString()
  );
  touristUser.permissions = realPermissions;
  const token = jwt.sign(
    {
      id: touristUser._id.toString(),
      email: touristUser.email.toLowerCase(),
      username: touristUser.username,
    },
    process.env.SECRET_KEY!
  );
  return { ...touristUser, token };
}
