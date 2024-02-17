// TODO implement SPV in a worker
export const workerInstance = new ComlinkSharedWorker<
  typeof import("./worker")
>(new URL("./worker", import.meta.url));
