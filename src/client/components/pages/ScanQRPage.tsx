import FlashOffIcon from '@mui/icons-material/FlashOff';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { TransferRequestURLFields } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import QrScanner from 'qr-scanner';
import React, { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
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
    const router = useRouter();
    const video = createRef<HTMLVideoElement>();
    const fileInput = createRef<HTMLInputElement>();

    // Get the parameter from the URL
    const getParam = (info: string[], param: string, separator = '=') =>
        info
            .find((x) => x.startsWith(param))
            ?.split(separator)[1]
            .replaceAll('+', ' ') || '';

    const [paymentInfo, setPaymentInfo] = useState<TransferRequestURLFields>();
    const setResult = useCallback((result: { data: string }) => {
        const { data } = result;
        if (data) {
            scanner.current?.stop();
            if (data.startsWith('solana:')) {
                // This is a solana payment request : parse the quety to get all the Merchant information
                const info = data.split(/[?,&]+/); // Split the query string with ? or & as separator
                const splToken = getParam(info, 'spl-token');
                const label = getParam(info, 'label');
                setPaymentInfo({
                    recipient: new PublicKey(getParam(info, 'solana', ':')),
                    amount: BigNumber(getParam(info, 'amount')),
                    splToken: splToken ? new PublicKey(splToken) : undefined,
                    reference: new PublicKey(getParam(info, 'reference')),
                    label: label !== APP_TITLE ? label : '',
                    message: getParam(info, 'message'),
                    memo: getParam(info, 'memo'),
                } as TransferRequestURLFields);
            } else {
                // TODO: This is a solana address
            }
        }
    }, []);

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

    const destroyScanner = useCallback(() => {
        scanner.current?.destroy();
        scanner.current = undefined;
        router.back();
    }, [router]);

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
                <BackButton messageId="back" onClick={destroyScanner} disabled={disabled} setDisabled={setDisabled} />
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
                            <Merchant index={Number(merchantList?.index)} company={paymentInfo.label || ''} />
                        </div>
                        <div className={css.location}>{merchantList?.location}</div>
                        <div className={css.message}>{paymentInfo.message}</div>
                        <div className={css.memo}>{paymentInfo.memo}</div>

                        <StandardButton
                            messageId={'pay'}
                            onClick={() => {
                                //TODO
                            }}
                            style={{ marginBottom: 48 }}
                        />
                    </div>
                ))}
            {!disabled && <PoweredBy />}
        </div>
    );
};

export default ScanQRPage;
