import MenuIcon from '@mui/icons-material/Menu';
import WalletIcon from '@mui/icons-material/Wallet';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { CopyIcon, DotFilledIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { usePayment } from '../../hooks/usePayment';
import { encrypt } from '../../utils/aes';
import { CRYPTO_SECRET, DEFAULT_WALLET, IS_CUSTOMER_POS, USE_CUSTOM_CRYPTO } from '../../utils/env';
import { FiMsWalletName } from '../../utils/FiMsWalletAdapter';
import { LoadKey } from '../../utils/key';
import { ActivityIcon } from '../images/ActivityIcon';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import { MaximizeIcon } from '../images/MaximizeIcon';
import { MinimizeIcon } from '../images/MinimizeIcon';
import css from './ActionMenu.module.css';
import { ActionSnackbar } from './ActionSnackbar';

export const ActionMenu: FC = () => {
    const { connected, connecting, publicKey } = useWallet();
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
                <button
                    className={theme === Theme.Color ? css.IconButtonColor : css.IconButton}
                    aria-label="Customise options"
                >
                    <MenuIcon className={css.menuIcon} />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className={css.DropdownMenuContent} side="left" sideOffset={5}>
                    {publicKey && (
                        <>
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
                        </>
                    )}
                    <DropdownMenu.Item className={css.DropdownMenuItem} onClick={connectWallet} disabled={connecting}>
                        <FormattedMessage
                            id={
                                connecting
                                    ? 'connecting'
                                    : !connected
                                    ? 'connect'
                                    : DEFAULT_WALLET === FiMsWalletName
                                    ? 'saveRestore'
                                    : 'disconnect'
                            }
                        />
                        <div className={css.RightSlot}>
                            {connecting ? null : !connected ? (
                                <ConnectIcon />
                            ) : DEFAULT_WALLET === FiMsWalletName ? (
                                <WalletIcon />
                            ) : (
                                <DisconnectIcon />
                            )}
                        </div>
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
                    {!process.env.NEXT_PUBLIC_VERCEL_ENV && (
                        <>
                            <DropdownMenu.Separator className={css.DropdownMenuSeparator} />
                            <DropdownMenu.Item
                                className={css.DropdownMenuItem}
                                onClick={async () => {
                                    const privateKey = await navigator.clipboard.readText();
                                    const cipher = await encrypt(
                                        privateKey,
                                        CRYPTO_SECRET,
                                        await LoadKey(-1),
                                        USE_CUSTOM_CRYPTO
                                    );
                                    setMessage(cipher);
                                }}
                            >
                                <FormattedMessage id="encryptAccount" />
                                <div className={css.RightSlot}>
                                    <LockClosedIcon width={20} height={20} />
                                </div>
                            </DropdownMenu.Item>
                        </>
                    )}
                    <DropdownMenu.Arrow className={css.DropdownMenuArrow} />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
