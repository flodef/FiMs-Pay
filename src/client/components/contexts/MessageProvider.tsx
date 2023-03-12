import { FC, ReactNode, useState } from 'react';
import { MessageContext } from '../../hooks/useMessage';

export interface MessageProviderProps {
    children: ReactNode;
}

export const MessageProvider: FC<MessageProviderProps> = ({ children }) => {
    const [message, setMessage] = useState('');

    return (
        <MessageContext.Provider value={{ message, displayMessage: setMessage }}>{children}</MessageContext.Provider>
    );
};
