import React, { FC, useCallback } from 'react';
import css from './ActionMenu.module.css';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { FormattedMessage } from "react-intl";
import { usePayment } from "../../hooks/usePayment";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigateWithQuery } from "../../hooks/useNavigateWithQuery";
import { ActivityIcon } from "../images/ActivityIcon";
import { useFullscreen } from "../../hooks/useFullscreen";
import { MaximizeIcon } from "../images/MaximizeIcon";
import { MinimizeIcon } from "../images/MinimizeIcon";
import { IS_CUSTOMER_POS } from "../../utils/env";

export const ActionMenu: FC = () => {
    const { connected } = useWallet();
    const { fullscreen, toggleFullscreen } = useFullscreen();
    const { connectWallet } = usePayment();
    const navigate = useNavigateWithQuery();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className={css.IconButton} aria-label="Customise options">
                    <HamburgerMenuIcon />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className={css.DropdownMenuContent} side="left" sideOffset={5}>
                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={connectWallet}>
                        <FormattedMessage id={!connected ? "connect" : "disconnect"} />
                        <div className={css.RightSlot}>{!connected ? <ConnectIcon /> : <DisconnectIcon />}</div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={() => navigate('/transactions')} disabled={IS_CUSTOMER_POS}>
                        <FormattedMessage id="recentTransactions" />
                        <div className={css.RightSlot}><ActivityIcon /></div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={toggleFullscreen}>
                        <FormattedMessage id={!fullscreen ? "enterFullScreen" : "exitFullScreen"} />
                        <div className={css.RightSlot}>{!fullscreen ? <MaximizeIcon /> : <MinimizeIcon />}</div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={css.DropdownMenuItem} disabled>
                        <FormattedMessage id="selectCurrency" />
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={css.DropdownMenuItem} disabled>
                        <FormattedMessage id="theme" />
                    </DropdownMenu.Item>

                    <DropdownMenu.Arrow className={css.DropdownMenuArrow} />
                </DropdownMenu.Content >
            </DropdownMenu.Portal >
        </DropdownMenu.Root >
    );
};
