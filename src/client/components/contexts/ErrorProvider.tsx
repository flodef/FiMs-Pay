import React, { FC, ReactNode, useCallback, useState } from 'react';
import { ErrorContext } from '../../hooks/useError';

export interface ErrorProviderProps {
    children: ReactNode;
}

export const ErrorProvider: FC<ErrorProviderProps> = ({ children }) => {
    const [error, setError] = useState<Error>();
    const processError = useCallback((error?: Error) => {
        if (error) {
            console.error(error);
        }
        setError(error);
    }, []);

    return <ErrorContext.Provider value={{ error, processError }}>{children}</ErrorContext.Provider>;
};
