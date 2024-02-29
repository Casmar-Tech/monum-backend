import IPermission from "../../permissions/domain/interfaces/IPermission";
import IUser from "./IUser";

export default interface IUserWithPermissions
  extends Omit<IUser, "roleId" | "organizationId"> {
  permissions: IPermission[];
}
