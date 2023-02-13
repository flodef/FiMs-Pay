import React, { FC, HTMLAttributes, MouseEventHandler, ReactNode, useCallback, useState } from 'react';
import { BackIcon } from '../images/BackIcon';
import css from './BackButton.module.css';

export interface BackButtonProps {
    children: ReactNode;
    disabled?: boolean;
    onClick: HTMLAttributes<HTMLButtonElement>['onClick'];
}

export const BackButton: FC<BackButtonProps> = ({ children, disabled, onClick }) => {
    return (
        <button className={css.button} type="button" onClick={onClick} disabled={disabled}>
            <BackIcon />
            {children}
        </button>
    );
};
