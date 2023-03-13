import { FC } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { ActionMenu } from './ActionMenu';
import { ActionSnackbar } from './ActionSnackbar';
import css from './TopBar.module.css';

export const TopBar: FC = () => {
    const { reset } = useConfig();

    return (
        <div className={css.root}>
            <ActionSnackbar />
            <ActionMenu />
        </div>
    );
};
