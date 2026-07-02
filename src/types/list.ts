export type ListResponse<T, K> = {
  data: T;
  meta: {
    filter: K;
    total: number;
    page?: number;
    limit?: number;
  };
};
