import { NextPage } from 'next';
import { useRouter } from 'next/router';
import QrScanner from 'qr-scanner';
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { BackButton, StandardButton } from '../buttons/StandardButton';
import { PoweredBy } from '../sections/PoweredBy';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import css from './ScanQRPage.module.css';

const ScanQRPage: NextPage = () => {
    const router = useRouter();
    const video = createRef<HTMLVideoElement>();
    const fileInput = createRef<HTMLInputElement>();

    const setResult = useCallback((result: { data: string }) => {
        console.log(result.data);
        alert(result.data);
    }, []);

    const [hasCamera, setHasCamera] = useState(false);
    QrScanner.hasCamera().then(setHasCamera);

    const [hasFlash, setHasFlash] = useState(false);
    const [flashOn, setFlashOn] = useState(false);

    const scanner = useRef<QrScanner>();
    useEffect(() => {
        if (hasCamera && video.current) {
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
                    // setFlashOn(scanner.current.isFlashOn());
                }
            });
        }
    }, [hasCamera, setResult, video]);

    // const updateFlashAvailability = useCallback(() => {
    //     scanner.current?.hasFlash().then((hasFlash) => {
    //         console.log(hasFlash);
    //         // camHasFlash.textContent = hasFlash;
    //         // flashToggle.style.display = hasFlash ? 'inline-block' : 'none';
    //     });
    // }, []);

    // scanner.current?.start().then(() => {
    //     updateFlashAvailability();
    //     // List cameras after the scanner started to avoid listCamera's stream and the scanner's stream being requested
    //     // at the same time which can result in listCamera's unconstrained stream also being offered to the scanner.
    //     // Note that we can also start the scanner after listCameras, we just have it this way around in the demo to
    //     // start the scanner earlier.
    //     QrScanner.listCameras(true).then((cameras) => {
    //         console.log(cameras);
    //         cameras.forEach((camera) => {
    //             // const option = document.createElement('option');
    //             // option.value = camera.id;
    //             // option.text = camera.label;
    //             // camList.add(option);
    //         });
    //     });
    // });

    // // Create a component with three buttons : one is for printing, one is for downloading and one is for sharing the QR code.

    // // Create a printing button
    // const printingButton = () => {
    //     return (
    //         <StandardButton
    //             messageId={'print'}
    //             onClick={() => {
    //                 // Print the QR code
    //             }}
    //         />
    //     );
    // };
    // // Create a print function
    // const print = useCallback(() => {
    //     // Print the QR code
    // }, []);

    // // Create a downloading button
    // const downloadingButton = () => {
    //     return <StandardButton messageId={'download'} onClick={() => {}} />;
    // };

    // // Create a sharing button
    // const sharingButton = () => {
    //     return <StandardButton messageId={'share'} onClick={() => {}} />;
    // };

    fileInput.current?.addEventListener('change', (event) => {
        const file = fileInput.current?.files?.[0];
        if (!file) return;
        QrScanner.scanImage(file, { returnDetailedScanResult: true })
            .then(setResult)
            .catch((e) => setResult({ data: e || 'QRCodeNotFound' }));
    });

    const toggleFlash = useCallback(async () => {
        alert(scanner.current);
        if (scanner.current) {
            alert(flashOn);
            if (flashOn) {
                await scanner.current.turnFlashOff().then(() => {
                    alert('flash off');
                    setFlashOn(false);
                });
            } else {
                await scanner.current.turnFlashOn().then(() => {
                    alert('flash on');
                    setFlashOn(true);
                });
            }
            // scanner.current.turnFlashOff();
            // setFlashOn(!flashOn);
        }
    }, [flashOn]);

    const destroyScanner = useCallback(() => {
        scanner.current?.destroy();
        scanner.current = undefined;
        router.back();
    }, [router]);

    const [disabled, setDisabled] = useState(false);
    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton messageId="back" onClick={destroyScanner} disabled={disabled} setDisabled={setDisabled} />
                {hasFlash && !disabled && (
                    <button
                        className={css.flash}
                        onClick={async () =>
                            // await toggleFlash()
                            await scanner.current?.toggleFlash().then(() => setFlashOn(!flashOn))
                        }
                    >
                        {flashOn ? <FlashOffIcon fontSize="large" /> : <FlashOnIcon fontSize="large" />}
                    </button>
                )}
            </div>
            {!disabled && (
                <>
                    <div className={css.main}>
                        <div className={css.title}>
                            <FormattedMessage id="scanQRCode" />
                        </div>

                        <video className={css.video} ref={video} />
                        {hasCamera && (
                            <div className={css.title}>
                                <FormattedMessage id="or" />
                            </div>
                        )}
                        <input type="file" ref={fileInput} style={{ display: 'none' }} />
                        <StandardButton messageId={'openQRFile'} onClick={() => fileInput.current?.click()} />
                    </div>
                    <PoweredBy />
                </>
            )}
        </div>
    );
};

export default ScanQRPage;
