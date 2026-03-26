export type ApiHeaders = Record<string, string>;

export type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
    headers?: ApiHeaders;
};

export type ApiError = Error & {
    status?: number;
};
