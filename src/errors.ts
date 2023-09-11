export class MigrateError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.name = this.constructor.name;

    let stack = this.stack;
    if (options?.cause instanceof Error && options.cause.stack) {
      stack = options.cause.stack
        .split("\n")
        .filter((line) => !line.includes("___ErrorCatcher"))
        .join("\n");
    }

    this.stack = stack;
  }
}
