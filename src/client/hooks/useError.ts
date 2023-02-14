import { createContext, useContext } from 'react';

export interface ErrorContextState {
    error: Error | undefined;
    processError(error?: object): void;
}

export const ErrorContext = createContext<ErrorContextState>({} as ErrorContextState);

export function useError(): ErrorContextState {
    return useContext(ErrorContext);
}
