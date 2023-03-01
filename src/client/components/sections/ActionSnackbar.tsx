import React, { Dispatch, FC, forwardRef, SetStateAction, SyntheticEvent, useEffect, useRef, useState } from 'react';
import Stack from '@mui/material/Stack';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import css from './ActionSnackbar.module.css';

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export interface ActionSnackbarProps {
    message: string;
    setMessage: Dispatch<SetStateAction<string>>;
    duration?: number;
    vertical?: SnackbarOrigin['vertical'];
    horizontal?: SnackbarOrigin['horizontal'];
}

export const ActionSnackbar: FC<ActionSnackbarProps> = ({
    message,
    setMessage,
    duration = 3000,
    vertical = 'top',
    horizontal = 'center',
}) => {
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

        setMessage('');
    };

    return (
        <Snackbar
            className={css.root}
            open={open}
            autoHideDuration={duration}
            onClose={handleClose}
            anchorOrigin={{ vertical, horizontal }}
        >
            <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                {alertMessage.current}
            </Alert>
        </Snackbar>
    );
};
