import { createContext, Dispatch, SetStateAction, useContext } from 'react';

export interface MessageContextState {
    message: string;
    displayMessage: Dispatch<SetStateAction<string>>;
}

export const MessageContext = createContext<MessageContextState>({} as MessageContextState);

export function useMessage(): MessageContextState {
    return useContext(MessageContext);
}
