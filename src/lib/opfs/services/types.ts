// libs/opfs/services/types.ts
import * as internalActions from './internal';

// { ...actions, ...otherActions }
export const allActions = { ...internalActions };

export type GetHandleResult = {
  currentDir: FileSystemDirectoryHandle;
  fileName: string;
};

// signature
export type HandleGetter = (path: string, create?: boolean) => Promise<GetHandleResult>;

// trích xuất api từ các action
type InferApiFromInternal<T> = {
  [K in keyof T]: T[K] extends (getHandle: any, ...args: infer P) => infer R
    ? (...args: P) => R
    : never;
};

// Định nghĩa Service Type dựa trên allActions
export type OpfsServiceType = InferApiFromInternal<typeof allActions> & {
  // hàm đặc thù định nghĩa thủ công tại đây
  exists(path: string): Promise<boolean>;
};
