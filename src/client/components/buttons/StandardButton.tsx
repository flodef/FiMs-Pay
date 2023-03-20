import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { CSSProperties, FC, MouseEventHandler, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { isFullscreen, requestFullscreen } from '../../utils/fullscreen';
import { isMobileDevice } from '../../utils/mobile';
import css from './StandardButton.module.css';

enum Icon {
    Back,
    Next,
}

export interface StandardButtonProps {
    messageId?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    setDisabled?: (disabled: boolean) => void;
    loading?: boolean;
    hasTheme?: boolean;
    icon?: Icon;
    style?: CSSProperties;
}

export const BackButton: FC<StandardButtonProps> = ({
    messageId = 'back',
    onClick,
    disabled,
    setDisabled,
    loading,
    style,
}) => {
    const router = useRouter();
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            if (onClick) {
                onClick(event);
            } else {
                router.back();
            }
        },
        [router, onClick]
    );

    return (
        <StandardButton
            messageId={messageId}
            onClick={handleClick}
            disabled={disabled}
            setDisabled={setDisabled}
            loading={loading}
            hasTheme={false}
            icon={Icon.Back}
            style={style}
        />
    );
};

export const NextButton: FC<StandardButtonProps> = ({
    messageId = 'next',
    onClick,
    disabled,
    setDisabled,
    loading,
    style,
}) => {
    const router = useRouter();
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            if (onClick) {
                onClick(event);
            } else {
                router.forward();
            }
        },
        [router, onClick]
    );

    return (
        <StandardButton
            messageId={messageId}
            onClick={handleClick}
            disabled={disabled}
            setDisabled={setDisabled}
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
    setDisabled,
    loading,
    hasTheme = true,
    icon,
    style,
}) => {
    const { theme } = useConfig();

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            setDisabled ? setDisabled(true) : null;
            if (!isFullscreen() && isMobileDevice()) {
                requestFullscreen();
            }

            if (onClick) {
                onClick(event);
            }
        },
        [onClick, setDisabled]
    );
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
            {icon === Icon.Back && (
                <NavigateBeforeIcon fontSize="large" className={theme === Theme.Color ? css.buttonColor : ''} />
            )}
            <FormattedMessage id={messageId} />
            {icon === Icon.Next && (
                <NavigateNextIcon fontSize="large" className={theme === Theme.Color ? css.buttonColor : ''} />
            )}
        </button>
    ) : (
        <CircularProgress className={css.circular} sx={style} disableShrink />
    );
};
