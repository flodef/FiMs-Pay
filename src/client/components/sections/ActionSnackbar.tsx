import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import { FC, forwardRef, SyntheticEvent, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useMessage } from '../../hooks/useMessage';
import css from './ActionSnackbar.module.css';

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export interface ActionSnackbarProps {
    duration?: number;
    severity?: AlertColor;
    vertical?: SnackbarOrigin['vertical'];
    horizontal?: SnackbarOrigin['horizontal'];
}

export const ActionSnackbar: FC<ActionSnackbarProps> = ({
    duration = 3000,
    severity = 'success',
    vertical = 'top',
    horizontal = 'center',
}) => {
    const { message, displayMessage } = useMessage();
    const [open, setOpen] = useState(false);
    const alertMessage = useRef(message);

    useEffect(() => {
        const isOpen = message.length > 0;
        setOpen(isOpen);
        if (isOpen) {
            alertMessage.current = message;
        }
    }, [message]);

    const handleClose = (event?: SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;

        displayMessage('');
    };

    return (
        <Snackbar
            className={css.root}
            open={open}
            autoHideDuration={duration}
            onClose={handleClose}
            anchorOrigin={{ vertical, horizontal }}
        >
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                <FormattedMessage id={alertMessage.current} />
            </Alert>
        </Snackbar>
    );
};
