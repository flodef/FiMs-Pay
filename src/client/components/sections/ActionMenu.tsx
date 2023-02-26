import React, { FC, useState } from 'react';
import css from './ActionMenu.module.css';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import { HamburgerMenuIcon, DotFilledIcon, CopyIcon } from '@radix-ui/react-icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePayment } from '../../hooks/usePayment';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { ActivityIcon } from '../images/ActivityIcon';
import { useFullscreen } from '../../hooks/useFullscreen';
import { MaximizeIcon } from '../images/MaximizeIcon';
import { MinimizeIcon } from '../images/MinimizeIcon';
import { IS_CUSTOMER_POS } from '../../utils/env';
import { Theme, useConfig } from '../../hooks/useConfig';
import { ActionSnackbar } from './ActionSnackbar';

export const ActionMenu: FC = () => {
    const { connected, publicKey } = useWallet();
    const { fullscreen, toggleFullscreen } = useFullscreen();
    const { connectWallet } = usePayment();
    const { theme, setTheme } = useConfig();
    const navigate = useNavigateWithQuery();

    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const walletAddressCopied = useTranslate('walletAddressCopied');

    const [message, setMessage] = useState('');

    return (
        <DropdownMenu.Root>
            <ActionSnackbar message={message} setMessage={setMessage} />
            <DropdownMenu.Trigger asChild>
                <button className={css.IconButton} aria-label="Customise options">
                    <HamburgerMenuIcon />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className={css.DropdownMenuContent} side="left" sideOffset={5}>
                    {publicKey ? (
                        <div>
                            <DropdownMenu.Item
                                className={css.DropdownMenuItem}
                                onClick={() => {
                                    navigator.clipboard.writeText(publicKey.toString());
                                    setMessage(walletAddressCopied);
                                }}
                            >
                                <FormattedMessage id="copyAddress" />
                                <div className={css.RightSlot}>
                                    <CopyIcon width={20} height={20} />
                                </div>
                            </DropdownMenu.Item>

                            <DropdownMenu.Separator className={css.DropdownMenuSeparator} />
                        </div>
                    ) : null}

                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={connectWallet}>
                        <FormattedMessage id={!connected ? 'connect' : 'disconnect'} />
                        <div className={css.RightSlot}>{!connected ? <ConnectIcon /> : <DisconnectIcon />}</div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        className={css.DropdownMenuItem}
                        onClick={() => navigate('/transactions')}
                        disabled={IS_CUSTOMER_POS}
                    >
                        <FormattedMessage id="recentTransactions" />
                        <div className={css.RightSlot}>
                            <ActivityIcon />
                        </div>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={toggleFullscreen}>
                        <FormattedMessage id={!fullscreen ? 'enterFullScreen' : 'exitFullScreen'} />
                        <div className={css.RightSlot}>{!fullscreen ? <MaximizeIcon /> : <MinimizeIcon />}</div>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className={css.DropdownMenuSeparator} />

                    <DropdownMenu.Label className={css.DropdownMenuLabel}>
                        <FormattedMessage id="theme" />
                    </DropdownMenu.Label>
                    <DropdownMenu.RadioGroup value={theme} onValueChange={setTheme}>
                        {Object.values(Theme).map((theme) => (
                            <DropdownMenu.RadioItem key={theme} className={css.DropdownMenuRadioItem} value={theme}>
                                <DropdownMenu.ItemIndicator className={css.DropdownMenuItemIndicator}>
                                    <DotFilledIcon />
                                </DropdownMenu.ItemIndicator>
                                <FormattedMessage id={theme} />
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>

                    <DropdownMenu.Arrow className={css.DropdownMenuArrow} />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
