import CreatePermission from "../../application/CreatePermission.js";
import DeletePermissionAndRemoveFromPlansAndRoles from "../../application/DeletePermissionAndRemoveFromPlansAndRoles.js";
import IPermission from "../../domain/interfaces/IPermission.js";

interface CreatePermissionInput {
  createPermissionInput: {
    permission: IPermission;
  };
}

const resolvers = {
  Permission: {
    id: (parent: IPermission) => parent?._id?.toString(),
  },
  Mutation: {
    createPermission: async (
      parent: any,
      args: CreatePermissionInput,
      context: any
    ) => {
      const { createPermissionInput } = args;
      const { permission } = createPermissionInput;
      const createdPermission = await CreatePermission(permission);
      return createdPermission;
    },
    deletePermission: async (
      parent: any,
      args: { id: string },
      context: any
    ) => {
      await DeletePermissionAndRemoveFromPlansAndRoles(args.id);
      return true;
    },
  },
};
export default resolvers;
