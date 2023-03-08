import { createContext, useContext } from 'react';

export interface ErrorContextState {
    error: Error | undefined;
    processError(error?: object): void;
    compareErrorType(error: Error | undefined, type: Error): boolean;
}

export const ErrorContext = createContext<ErrorContextState>({} as ErrorContextState);

export function useError(): ErrorContextState {
    return useContext(ErrorContext);
}
