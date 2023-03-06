import { FC } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { SHOW_MERCHANT_LIST } from '../../utils/env';
import { BackButton } from '../buttons/StandardButton';
import { ActionMenu } from './ActionMenu';
import css from './TopBar.module.css';

export const TopBar: FC = () => {
    const { reset } = useConfig();

    return (
        <div className={css.root}>
            <BackButton messageId={SHOW_MERCHANT_LIST ? 'merchants' : 'back'} onClick={reset} />
            <ActionMenu />
        </div>
    );
};
