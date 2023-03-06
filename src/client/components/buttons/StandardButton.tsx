import React, { CSSProperties, FC, MouseEventHandler } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import css from './StandardButton.module.css';
import { CircularProgress } from '@mui/material';

enum Icon {
    Back,
    Next,
}

export interface StandardButtonProps {
    messageId: string;
    onClick: MouseEventHandler<HTMLButtonElement> | undefined;
    disabled?: boolean;
    loading?: boolean;
    hasTheme?: boolean;
    icon?: Icon;
    style?: CSSProperties;
}

export const BackButton: FC<StandardButtonProps> = ({ messageId, onClick, disabled, loading, style }) => {
    return (
        <StandardButton
            messageId={messageId}
            onClick={onClick}
            disabled={disabled}
            loading={loading}
            hasTheme={false}
            icon={Icon.Back}
            style={style}
        />
    );
};

export const NextButton: FC<StandardButtonProps> = ({ messageId, onClick, disabled, loading, style }) => {
    return (
        <StandardButton
            messageId={messageId}
            onClick={onClick}
            disabled={disabled}
            loading={loading}
            hasTheme={false}
            icon={Icon.Next}
            style={style}
        />
    );
};

export const StandardButton: FC<StandardButtonProps> = ({
    messageId,
    onClick,
    disabled,
    hasTheme = true,
    loading,
    icon,
    style,
}) => {
    const { theme } = useConfig();
    return !loading ? (
        <button
            className={
                !hasTheme
                    ? css.rootEmpty
                    : theme === Theme.Color
                    ? css.rootColor
                    : theme === Theme.BlackWhite
                    ? css.rootBW
                    : css.root
            }
            style={style}
            type="button"
            onClick={onClick}
            disabled={disabled}
        >
            {icon === Icon.Back && <NavigateBeforeIcon width="24" />}
            <FormattedMessage id={messageId} />
            {icon === Icon.Next && <NavigateNextIcon />}
        </button>
    ) : (
        <CircularProgress className={css.circular} sx={style} disableShrink />
    );
};
