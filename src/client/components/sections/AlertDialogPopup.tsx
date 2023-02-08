import React, { FC, ReactNode, useMemo } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import css from './AlertDialogPopup.module.css';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

export enum AlertType {
    Message = 'green',
    Warning = 'orange',
    Alert = 'red',
}

export interface AlertDetails {
    title: string;
    description: string[];
    type: AlertType;
}

export interface AlertDialogPopupProps {
    button: ReactNode;
    onClick(): void;
    alert: AlertDetails | undefined;
}

export const AlertDialogPopup: FC<AlertDialogPopupProps> = ({ button, onClick, alert }) => {
    const buttonColor = alert
        ? alert.type === AlertType.Message
            ? css.green
            : alert.type === AlertType.Warning
            ? css.orange
            : css.red
        : undefined;

    return !alert ? (
        <div>{button}</div>
    ) : (
        <AlertDialog.Root>
            <AlertDialog.Trigger asChild>{button}</AlertDialog.Trigger>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className={css.AlertDialogOverlay} />
                <AlertDialog.Content className={css.AlertDialogContent}>
                    <AlertDialog.Title className={css.AlertDialogTitle}>{alert.title}</AlertDialog.Title>
                    <AlertDialog.Description className={css.AlertDialogDescription}>
                        {alert.description.map((x) => (
                            <span key={x}>
                                {x}
                                <br />
                            </span>
                        ))}
                    </AlertDialog.Description>
                    <div className={css.AlertDialogButton}>
                        <AlertDialog.Cancel asChild>
                            <button className={classNames(css.Button, css.mauve)}>
                                <FormattedMessage id="cancel" />
                            </button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                            <button className={classNames(css.Button, buttonColor)} onClick={onClick}>
                                <FormattedMessage id="OK" />
                            </button>
                        </AlertDialog.Action>
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
};
