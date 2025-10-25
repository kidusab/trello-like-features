export async function tryCatch<TResult>(
  promise: Promise<TResult>,
  errorHandler?: (error: any) => TResult | Promise<TResult>
): Promise<{ data?: TResult; error?: any }> {
  try {
    const data = await promise;
    return { data, error: undefined };
  } catch (error) {
    if (errorHandler) {
      const handled = await errorHandler(error);
      return { data: handled, error };
    }
    return { data: undefined, error };
  }
}
