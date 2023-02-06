// import { createQROptions } from '@solana/pay';
import QRCodeStyling from '@solana/qr-code-styling';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Theme, useConfig } from "../../hooks/useConfig";
import { usePayment } from '../../hooks/usePayment';
import { createQROptions } from "../../utils/createQR";
import css from './QRCode.module.css';

export const QRCode: FC = () => {
    const [size, setSize] = useState(() =>
        typeof window === 'undefined' ? 400 : Math.min(window.screen.availWidth - 48, 400)
    );
    useEffect(() => {
        const listener = () => setSize(Math.min(window.screen.availWidth - 48, 400));

        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, []);

    const { theme } = useConfig();
    const isColor = theme === Theme.Color;

    const { url } = usePayment();
    const options = useMemo(() => createQROptions(
        url,
        size,
        'transparent',
        isColor ? '#34A5FF' : '#2A2A2A',
        isColor ? { type: 'linear', colorStops: [{ offset: 0, color: '#9945FF' }, { offset: 1, color: '#14F195' }] } : undefined),
        [url, size, isColor]);

    const qr = useMemo(() => new QRCodeStyling(), []);
    const isQRUpdated = useRef(false);
    useEffect(() => {
        if (!isQRUpdated.current) {
            isQRUpdated.current = true;
            qr.update(options);
        }
    }, [qr, options]);

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current && !qr._container) {
            qr.append(ref.current);
        }
    }, [ref, qr]);

    return <div ref={ref} className={css.root} />;
};
