export const logInfo = (message: string): void => {
  console.log(message);
};

export const logError = (message: string, error?: unknown): void => {
  if (error) {
    console.error(message, error);
    return;
  }
  console.error(message);
};
