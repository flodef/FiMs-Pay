import FlashOffIcon from '@mui/icons-material/FlashOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { parseURL, TransferRequestURL } from '@solana/pay';
import { useLiveQuery } from 'dexie-react-hooks';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import QrScanner from 'qr-scanner';
import React, { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { SOLANA_PROTOCOL } from '../../../server/core/constants';
import { usePayment } from '../../hooks/usePayment';
import { CURRENCY_LIST } from '../../utils/constants';
import { db } from '../../utils/db';
import { APP_TITLE } from '../../utils/env';
import { BackButton, StandardButton } from '../buttons/StandardButton';
import { Amount } from '../sections/Amount';
import { Merchant } from '../sections/Merchant';
import { PoweredBy } from '../sections/PoweredBy';
import css from './ScanQRPage.module.css';

interface Props {
    result?: string;
}

const ScanQRPage: NextPage = () => {
    const { process, setIsRecipient } = usePayment();

    const router = useRouter();
    const video = createRef<HTMLVideoElement>();
    const fileInput = createRef<HTMLInputElement>();

    const destroyScanner = useCallback(() => {
        scanner.current?.destroy();
        scanner.current = undefined;
    }, []);

    const [paymentInfo, setPaymentInfo] = useState<TransferRequestURL>();
    const setResult = useCallback(
        (result: { data: string }) => {
            const { data } = result;
            if (data) {
                destroyScanner();
                if (data.startsWith(SOLANA_PROTOCOL)) {
                    // This is a solana payment request : parse the quety to get all the Merchant information
                    const request = parseURL(data);
                    if (!('link' in request)) {
                        setPaymentInfo(request);
                    } else {
                        console.log('Transaction link not handled');
                    }
                } else {
                    // TODO: This is a solana address
                    console.log('Solana address not handled');
                }
            }
        },
        [destroyScanner]
    );

    const [hasCamera, setHasCamera] = useState(false);
    QrScanner.hasCamera().then(setHasCamera);

    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);

    const scanner = useRef<QrScanner>();
    useEffect(() => {
        if (hasCamera && video.current && !scanner.current) {
            scanner.current = new QrScanner(video.current, setResult, {
                onDecodeError: (error) => {
                    console.error(error);
                },
                highlightScanRegion: true,
                highlightCodeOutline: true,
            });
            scanner.current.start().then(() => {
                if (scanner.current) {
                    scanner.current.hasFlash().then(setHasFlash);
                    setFlashOn(scanner.current.isFlashOn());
                }
            });
        }
    }, [hasCamera, setResult, video]);

    const onFileInputChange = useCallback(() => {
        const file = fileInput.current?.files?.[0];
        if (file) {
            QrScanner.scanImage(file, { returnDetailedScanResult: true })
                .then(setResult)
                .catch((e) => setResult({ data: e || 'QRCodeNotFound' }));
        }
    }, [fileInput, setResult]);

    const [disabled, setDisabled] = useState(false);

    const getMerchant = useCallback(
        (address: string | undefined) =>
            address
                ? db.merchants
                      .where('address')
                      .equals(address)
                      .first()
                      .then((x) => x)
                : undefined,
        []
    );
    const merchantList = useLiveQuery(() => getMerchant(paymentInfo?.recipient.toString()), [paymentInfo]);

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton
                    messageId="back"
                    onClick={() => {
                        destroyScanner();
                        router.back();
                    }}
                    disabled={disabled}
                    setDisabled={setDisabled}
                />
                {hasFlash && !disabled && !paymentInfo && (
                    <button
                        className={css.flash}
                        onClick={() =>
                            scanner.current?.toggleFlash().then(() => setFlashOn(scanner.current?.isFlashOn() === true))
                        }
                    >
                        {flashOn ? <FlashOffIcon /> : <FlashOnIcon />}
                    </button>
                )}
            </div>
            {!disabled &&
                (!paymentInfo ? (
                    <div className={css.main}>
                        <div className={css.title}>
                            <FormattedMessage id="scanQRCode" />
                        </div>

                        <div id="videoContainer">
                            <video className={css.video} ref={video} />
                        </div>
                        {hasCamera && (
                            <div className={css.text}>
                                <FormattedMessage id="or" />
                            </div>
                        )}
                        <input type="file" onChange={onFileInputChange} ref={fileInput} style={{ display: 'none' }} />
                        <StandardButton messageId={'openQRFile'} onClick={() => fileInput.current?.click()} />
                    </div>
                ) : (
                    <div className={css.main}>
                        <div className={css.title}>
                            <FormattedMessage id="paymentRequest" />
                        </div>
                        <div className={css.icon}>
                            {paymentInfo
                                ? React.createElement(
                                      Object.values(CURRENCY_LIST).find(
                                          (x) => x.splToken?.toString() === paymentInfo?.splToken?.toString()
                                      )?.icon || ''
                                  )
                                : undefined}
                        </div>
                        <div className={css.value}>
                            <Amount
                                value={paymentInfo.amount?.toNumber()}
                                currency={Object.keys(CURRENCY_LIST).find(
                                    (x) => CURRENCY_LIST[x].splToken?.toString() === paymentInfo.splToken?.toString()
                                )}
                            />
                        </div>
                        <div>
                            <Merchant
                                index={Number(merchantList?.index)}
                                company={paymentInfo.label && paymentInfo.label !== APP_TITLE ? paymentInfo.label : ''}
                            />
                        </div>
                        <div className={css.location}>{merchantList?.location}</div>
                        <div className={css.message}>{paymentInfo.message}</div>
                        <div className={css.memo}>{paymentInfo.memo}</div>

                        <StandardButton
                            messageId={'pay'}
                            onClick={() => {
                                process(paymentInfo);
                                setIsRecipient(false);
                            }}
                            style={{ marginBottom: 48 }}
                            disabled={disabled}
                            setDisabled={setDisabled}
                        />
                    </div>
                ))}
            {!disabled && <PoweredBy />}
        </div>
    );
};

export default ScanQRPage;
