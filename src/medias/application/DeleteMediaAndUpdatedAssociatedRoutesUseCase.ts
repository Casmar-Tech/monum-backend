import { ApolloError } from "apollo-server-errors";

export default async function DeleteMediaAndUpdatedAssociatedRoutesUseCase(
  id: string
): Promise<boolean> {
  try {
    return true;
  } catch (error) {
    console.error(
      "Error while deleting Media and updating associated Routes",
      error
    );
    throw new ApolloError(
      "Error while deleting Media and deleting associated Routes",
      "DELETE_MEDIA_AND_UPDATE_ASSOCIATED_ROUTES"
    );
  }
}
