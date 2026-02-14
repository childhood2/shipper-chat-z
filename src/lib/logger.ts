export const logger = {
  info: (_msg: string, ..._args: unknown[]) => {},
  warn: (_msg: string, ..._args: unknown[]) => {},
  error: (_msg: string, ..._args: unknown[]) => {},
  api: (_method: string, _path: string, _detail?: string) => {},
  auth: (_msg: string, ..._args: unknown[]) => {},
};
