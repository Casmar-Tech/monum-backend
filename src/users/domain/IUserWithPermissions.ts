import IPermission from "../../permissions/domain/interfaces/IPermission.js";
import IUser from "./IUser.js";

export default interface IUserWithPermissions
  extends Omit<IUser, "roleId" | "organizationId"> {
  permissions: IPermission[];
}
