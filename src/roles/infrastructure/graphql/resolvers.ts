import CreateRole from "../../application/CreateRole.js";
import IRole from "../../domain/interfaces/IRole.js";
import AddPermissionsToRole from "../../application/AddPermissionsToRole.js";
import RemovePermissionsFromRole from "../../application/RemovePermissionsFromRole.js";

interface CreateRoleInput {
  createRoleInput: {
    role: IRole;
    permissionsIds: string[];
  };
}

const resolvers = {
  Role: {
    id: (parent: IRole) => parent?._id?.toString(),
  },
  Mutation: {
    createRole: async (parent: any, args: CreateRoleInput, context: any) => {
      const { createRoleInput } = args;
      const { role, permissionsIds } = createRoleInput;
      const createdRole = await CreateRole(role, permissionsIds);
      return createdRole;
    },
    addPermissionsToRole: async (
      parent: any,
      args: { roleId: string; permissionsIds: string[] },
      context: any
    ) => {
      const { roleId, permissionsIds } = args;
      return AddPermissionsToRole(roleId, permissionsIds);
    },
    removePermissionsFromRole: async (
      parent: any,
      args: { roleId: string; permissionsIds: string[] },
      context: any
    ) => {
      const { roleId, permissionsIds } = args;
      return RemovePermissionsFromRole(roleId, permissionsIds);
    },
  },
};
export default resolvers;
