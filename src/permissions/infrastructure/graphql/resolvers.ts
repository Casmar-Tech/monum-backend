import CreatePermission from "../../application/CreatePermission.js";
import IPermission from "../../domain/interfaces/IPermission.js";

interface CreatePermissionInput {
  createPermissionInput: {
    permission: IPermission;
  };
}
const resolvers = {
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
  },
};
export default resolvers;
