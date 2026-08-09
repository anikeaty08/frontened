export class AquaError extends Error {
  public constructor(
    public readonly code:
      | "AUTHENTICATION_REQUIRED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION_ERROR"
      | "INVALID_STATE"
      | "INTERNAL_ERROR",
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AquaError";
  }
}

export const forbidden = (message = "You are not authorised to perform this action") =>
  new AquaError("FORBIDDEN", message, 403);

export const notFound = (message = "The requested resource does not exist") =>
  new AquaError("NOT_FOUND", message, 404);

export const conflict = (message: string) => new AquaError("CONFLICT", message, 409);

export const invalidState = (message: string) => new AquaError("INVALID_STATE", message, 409);

export const validation = (message: string) => new AquaError("VALIDATION_ERROR", message, 400);
