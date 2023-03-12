import AddCardIcon from '@mui/icons-material/AddCard';
import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LockIcon from '@mui/icons-material/Lock';
import MenuIcon from '@mui/icons-material/Menu';
import WalletIcon from '@mui/icons-material/Wallet';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, Fragment, MouseEventHandler, ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useMessage } from '../../hooks/useMessage';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { usePayment } from '../../hooks/usePayment';
import { encrypt } from '../../utils/aes';
import { CRYPTO_SECRET, DEFAULT_WALLET, IS_CUSTOMER_POS, POS_USE_WALLET, USE_CUSTOM_CRYPTO } from '../../utils/env';
import { FiMsWalletName } from '../../utils/FiMsWalletAdapter';
import { LoadKey } from '../../utils/key';
import { ActivityIcon } from '../images/ActivityIcon';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import { MaximizeIcon } from '../images/MaximizeIcon';
import { MinimizeIcon } from '../images/MinimizeIcon';
import css from './ActionMenu.module.css';

type Anchor = 'top' | 'left' | 'bottom' | 'right';

export interface ActionListItemProps {
    icon: ReactNode;
    messageId: string;
    onClick: MouseEventHandler<HTMLDivElement>;
    disabled?: boolean;
}

const ActionListItem: FC<ActionListItemProps> = ({ icon, messageId, onClick, disabled = false }) => {
    return (
        <ListItem disablePadding>
            <ListItemButton onClick={onClick} disabled={disabled}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText>
                    <FormattedMessage id={messageId} />
                </ListItemText>
            </ListItemButton>
        </ListItem>
    );
};

export const ActionMenu: FC = () => {
    const { connected, connecting, publicKey } = useWallet();
    const { fullscreen, toggleFullscreen } = useFullscreen();
    const { connectWallet, supply } = usePayment();
    const { theme, changeTheme } = useConfig();
    const navigate = useNavigateWithQuery();
    const { displayMessage } = useMessage();

    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const walletAddressCopied = useTranslate('walletAddressCopied');

    const [state, setState] = useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const toggleDrawer = (anchor: Anchor, open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event &&
            event.type === 'keydown' &&
            ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
        ) {
            return;
        }

        setState({ ...state, [anchor]: open });
    };

    const list = (anchor: Anchor) => (
        <Box
            sx={{ width: 'auto' }}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <List>
                {(!POS_USE_WALLET && !IS_CUSTOMER_POS) ||
                    (publicKey && (
                        <>
                            <ActionListItem
                                icon={<ActivityIcon />}
                                messageId="recentTransactions"
                                onClick={() => navigate('/transactions')}
                            />
                            <ActionListItem icon={<AddCardIcon />} messageId="supply" onClick={supply} />
                            <ActionListItem
                                icon={<ContentCopyIcon />}
                                messageId="copyAddress"
                                onClick={() => {
                                    navigator.clipboard.writeText(publicKey.toString());
                                    displayMessage(walletAddressCopied);
                                }}
                            />
                        </>
                    ))}
                <ActionListItem
                    icon={
                        connecting ? null : !connected ? (
                            <ConnectIcon />
                        ) : DEFAULT_WALLET === FiMsWalletName ? (
                            <WalletIcon />
                        ) : (
                            <DisconnectIcon />
                        )
                    }
                    messageId={
                        connecting
                            ? 'connecting'
                            : !connected
                            ? 'connect'
                            : DEFAULT_WALLET === FiMsWalletName
                            ? 'saveRestore'
                            : 'disconnect'
                    }
                    onClick={connectWallet}
                    disabled={connecting}
                />
            </List>
            <Divider />
            <List>
                <ActionListItem
                    icon={!fullscreen ? <MaximizeIcon /> : <MinimizeIcon />}
                    messageId={!fullscreen ? 'enterFullScreen' : 'exitFullScreen'}
                    onClick={toggleFullscreen}
                />
                <ActionListItem icon={<AppShortcutIcon />} messageId="changeTheme" onClick={changeTheme} />
            </List>

            {!process.env.NEXT_PUBLIC_VERCEL_ENV && (
                <>
                    <Divider />

                    <List>
                        <ActionListItem
                            icon={<LockIcon />}
                            messageId="encryptAccount"
                            onClick={async () => {
                                const privateKey = await navigator.clipboard.readText();
                                const cipher = await encrypt(
                                    privateKey,
                                    CRYPTO_SECRET,
                                    await LoadKey(-1),
                                    USE_CUSTOM_CRYPTO
                                );
                                displayMessage(cipher);
                            }}
                        />
                    </List>
                </>
            )}
        </Box>
    );

    const anchor = 'right' as Anchor;
    return (
        <div className={css.root}>
            <Fragment key={anchor}>
                <button
                    className={theme === Theme.Color ? css.iconButtonColor : css.iconButton}
                    onClick={toggleDrawer(anchor, true)}
                    aria-label="Action menu"
                >
                    <MenuIcon className={css.menuIcon} />
                </button>
                <SwipeableDrawer
                    anchor={anchor}
                    open={state[anchor]}
                    onClose={toggleDrawer(anchor, false)}
                    onOpen={toggleDrawer(anchor, true)}
                >
                    {list(anchor)}
                </SwipeableDrawer>
            </Fragment>
        </div>
    );
};
