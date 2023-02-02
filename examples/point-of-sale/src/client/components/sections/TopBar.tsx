import React, { FC, useCallback } from 'react';
import css from './TopBar.module.css';
import { FormattedMessage } from "react-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConfig } from "../../hooks/useConfig";
import { BackButton } from "../buttons/BackButton";
import { SHOW_MERCHANT_LIST } from "../../utils/env";
import { ActionMenu } from "./ActionMenu";

export const TopBar: FC = () => {
    const { reset } = useConfig();
    const { disconnect } = useWallet();

    const handleClick = useCallback(() => {
        disconnect();
        reset();
    }, [reset, disconnect]);

    return (
        <div className={css.root}>
            <BackButton onClick={handleClick}>
                <FormattedMessage id={SHOW_MERCHANT_LIST ? "merchants" : "back"} />
            </BackButton>
            <ActionMenu />
        </div>
    );
};
