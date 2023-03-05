import React, { FC, MouseEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { PaymentStatus } from '../../hooks/usePayment';
import { IS_CUSTOMER_POS } from '../../utils/env';
import css from './StandardButton.module.css';

enum State {
    Connecting = 'connecting',
    Connect = 'connect',
    Reload = 'reload',
    Supply = 'supply',
}

export interface StandardButtonProps {
    messageId: string;
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
    styleless?: boolean;
    disabled?: boolean;
}

export const StandardButton: FC<StandardButtonProps> = ({ messageId, onClick, styleless, disabled }) => {
    const { theme } = useConfig();
    return (
        <button
            className={
                styleless
                    ? css.rootEmpty
                    : theme === Theme.Color
                    ? css.rootColor
                    : theme === Theme.BlackWhite
                    ? css.rootBW
                    : css.root
            }
            type="button"
            onClick={onClick}
            disabled={disabled}
        >
            <FormattedMessage id={messageId} />
        </button>
    );
};
