import AddCardIcon from '@mui/icons-material/AddCard';
import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockIcon from '@mui/icons-material/Lock';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import WalletIcon from '@mui/icons-material/Wallet';
import { SwipeableDrawer } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import { useWallet } from '@solana/wallet-adapter-react';
import * as React from 'react';
import { FC, MouseEventHandler, ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useConfig } from '../../hooks/useConfig';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useMessage } from '../../hooks/useMessage';
import { useNavigate } from '../../hooks/useNavigate';
import { usePayment } from '../../hooks/usePayment';
import { encrypt } from '../../utils/aes';
import {
    CRYPTO_SECRET,
    DEFAULT_WALLET,
    HELP_LINK,
    IS_CUSTOMER_POS,
    POS_USE_WALLET,
    USE_CUSTOM_CRYPTO,
} from '../../utils/env';
import { FiMsWalletName } from '../../utils/FiMsWalletAdapter';
import { LoadKey } from '../../utils/key';
import { useIsMobileSize } from '../../utils/mobile';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import { MaximizeIcon } from '../images/MaximizeIcon';
import { MinimizeIcon } from '../images/MinimizeIcon';
import css from './ActionMenu.module.css';

type Anchor = 'top' | 'left' | 'bottom' | 'right';
type Direction = 'up' | 'down' | 'left' | 'right';
type Placement =
    | 'bottom-end'
    | 'bottom-start'
    | 'bottom'
    | 'left-end'
    | 'left-start'
    | 'left'
    | 'right-end'
    | 'right-start'
    | 'right'
    | 'top-end'
    | 'top-start'
    | 'top';

interface ActionListItemProps {
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
    const { changeTheme } = useConfig();
    const navigate = useNavigate();
    const { displayMessage } = useMessage();

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [state, setState] = useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const isPhone = useIsMobileSize();
    const direction = (isPhone ? 'right' : 'down') as Direction;
    const anchor = (isPhone ? 'right' : 'left') as Anchor;
    const tooltipPlacement = (isPhone ? 'bottom' : 'right') as Placement;

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

    const actions = [
        { icon: <QrCodeScannerIcon />, name: 'scan' },
        { icon: <SearchIcon />, name: 'search', onClick: () => navigate('/merchants') },
        { icon: <CallReceivedIcon />, name: 'receive' },
        { icon: <AddCardIcon />, name: 'supply', onClick: () => supply() },
        { icon: <MoreHorizIcon />, name: 'more', onClick: toggleDrawer(anchor, true) },
    ];

    const list = (anchor: Anchor) => (
        <Box
            sx={{ width: 'auto' }}
            role="action menu"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <List>
                {(!POS_USE_WALLET && !IS_CUSTOMER_POS) ||
                    (publicKey && (
                        <>
                            <ActionListItem
                                icon={<ReceiptLongIcon />}
                                messageId="recentTransactions"
                                onClick={() => navigate('/transactions')}
                            />
                            {/* <ActionListItem icon={<AddCardIcon />} messageId="supply" onClick={supply} /> */}
                            <ActionListItem
                                icon={<ContentCopyIcon />}
                                messageId="shareAddress"
                                onClick={() => {
                                    navigator.clipboard.writeText(publicKey.toString());
                                    displayMessage('walletAddressCopied');
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
            <Divider />
            <List>
                <ActionListItem icon={<HelpOutlineIcon />} messageId={'help'} onClick={() => navigate(HELP_LINK)} />
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

    return (
        <Box
            sx={
                direction === 'down' || direction === 'right'
                    ? { height: 80, transform: 'translateZ(0px)', flexGrow: 1 }
                    : { height: 320, transform: 'translateZ(0px)', flexGrow: 1 }
            }
        >
            <Backdrop className={css.backdrop} open={open} />
            {publicKey && (
                <SpeedDial
                    ariaLabel="SpeedDial tooltip"
                    sx={
                        direction === 'down' || direction === 'right'
                            ? {
                                  position: 'absolute',
                                  top: 16,
                                  left: 16,
                              }
                            : { position: 'absolute', bottom: 16, right: 16 }
                    }
                    icon={<SpeedDialIcon />}
                    onClose={handleClose}
                    onOpen={handleOpen}
                    open={open}
                    direction={direction}
                >
                    {actions.map((action) => (
                        <SpeedDialAction
                            key={action.name}
                            icon={action.icon}
                            tooltipTitle={<FormattedMessage id={action.name} />}
                            tooltipOpen={!isPhone}
                            tooltipPlacement={tooltipPlacement}
                            onClick={action.onClick}
                        />
                    ))}
                </SpeedDial>
            )}
            <SwipeableDrawer
                anchor={anchor}
                open={state[anchor]}
                onClose={toggleDrawer(anchor, false)}
                onOpen={toggleDrawer(anchor, true)}
            >
                {list(anchor)}
            </SwipeableDrawer>
        </Box>
    );
};
