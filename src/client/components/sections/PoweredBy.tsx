import React, { FC } from 'react';
import { FormattedMessage } from "react-intl";
import { FiMsPayLogo } from '../images/FiMsPayLogo';
import css from './PoweredBy.module.css';

export const PoweredBy: FC = () => {
    return (
        <div className={css.root}>
            <FormattedMessage id="poweredBy" />
            <FiMsPayLogo />
        </div>
    );
};
