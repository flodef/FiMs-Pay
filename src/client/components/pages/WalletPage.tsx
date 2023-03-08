import { WalletNotReadyError } from '@solana/wallet-adapter-base';
import { NextPage } from 'next';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import StegCloak from 'stegcloak';
import FiMsWallet from '../../utils/FiMsWallet';
import { LoadKey } from '../../utils/key';
import { BackButton, StandardButton } from '../buttons/StandardButton';
import css from './WalletPage.module.css';

enum Phase {
    Select,
    Create,
    Retrieve,
    Store,
    Verify,
}

const WalletPage: NextPage = () => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const enterPhrase = useTranslate('enterPhrase');
    const pasteMyPhrase = useTranslate('pasteMyPhrase');

    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const timezoneOffset = currentDate.getTimezoneOffset() * 60 * 1000;
    const initPattern = '\\S+ +\\S+.*';
    const [phrasePattern, setPhrasePattern] = useState(initPattern);
    const [phase, setPhase] = useState(Phase.Select);
    const [phrase, setPhrase] = useState('');
    const [date, setDate] = useState(
        `${currentDate.getFullYear()}-${('0' + (currentDate.getMonth() + 1)).slice(-2)}-${(
            '0' + currentDate.getDate()
        ).slice(-2)}`
    );
    const [time, setTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [magic, setMagic] = useState('');

    const stegcloak = useMemo(() => new StegCloak(true, true), []);
    const generatePhrase = useCallback(async () => {
        setPhase(Phase.Store);
        setLoading(true);
        const key = FiMsWallet.privateKey.key;
        if (!key) throw new WalletNotReadyError('Wallet key not found');
        setMagic(stegcloak.hide(key, await LoadKey(), phrase));
        setLoading(false);
    }, [phrase, stegcloak]);

    const verifyPhrase = useCallback(
        async (phrase: string) => {
            if (!phrase || !new RegExp(initPattern, 'gm').test(phrase)) return;

            setLoading(true);
            let magic = '';
            let key: string | null = '';
            if (time === 0) {
                key = FiMsWallet.privateKey.key;
                if (!key) throw new WalletNotReadyError('Wallet key not found');
            }
            try {
                magic = stegcloak.reveal(phrase, await LoadKey(time));
            } catch {
                try {
                    magic = stegcloak.reveal(phrase, await LoadKey(time + 1000 * 3600 * 24)); // Try the next day because of the time it takes to generate a new key
                } catch {}
            } finally {
                const valid = magic && (!key || magic === key);
                setLoading(false);
                setMagic(magic);
                setPhrasePattern(valid ? initPattern : 'a{55}b{88}c{33}');
            }
        },
        [stegcloak, time]
    );

    const storePhrase = useCallback(() => {
        FiMsWallet.privateKey = { key: magic, time: time || currentTime };
        FiMsWallet.finishConnecting();
    }, [magic, time, currentTime]);

    const goToVerify = useCallback(() => {
        setPhase(Phase.Verify);
        setPhrase('');
    }, []);

    const phraseInvalid = useMemo(
        () => !phrase || !new RegExp(phrasePattern, 'gm').test(phrase),
        [phrase, phrasePattern]
    );

    const timeInvalid = useMemo(
        () => !time || time < 1677628800000 || time > currentTime - timezoneOffset,
        [time, currentTime, timezoneOffset]
    );

    return (
        <div className={css.root}>
            <div className={css.container}>
                <div className={css.popup} style={{ display: 'block' }}>
                    {phase === Phase.Select ? (
                        <div className={css.btnWrapper}>
                            <StandardButton
                                messageId={FiMsWallet.isSavingRestoring ? 'restoreWallet' : 'aleadyHaveWallet'}
                                onClick={() => {
                                    setPhase(Phase.Retrieve);
                                    setTime(new Date(date).getTime());
                                }}
                            />
                            <div className={css.title}>
                                <FormattedMessage id="or" />
                            </div>
                            <StandardButton
                                messageId={FiMsWallet.isSavingRestoring ? 'saveWallet' : 'createWallet'}
                                onClick={() => setPhase(Phase.Create)}
                            />
                        </div>
                    ) : phase === Phase.Retrieve ? (
                        <>
                            <div className={css.title}>
                                <FormattedMessage id="test5" />
                            </div>
                            <input
                                className={css.Input}
                                id="time"
                                autoFocus
                                type="date"
                                value={date}
                                onKeyUp={(x) => {
                                    if (x.key === 'Enter' && !timeInvalid) goToVerify();
                                }}
                                onInput={(x) => {
                                    setDate(x.currentTarget.value);
                                    setTime(new Date(x.currentTarget.value).getTime() + timezoneOffset);
                                }}
                            />
                            <div className={css.divider}></div>
                            <div className={css.btnWrapper}>
                                <BackButton
                                    messageId="back"
                                    onClick={() => setPhase(Phase.Select)}
                                    style={{ float: 'left' }}
                                />
                                <StandardButton
                                    messageId="next"
                                    onClick={goToVerify}
                                    disabled={timeInvalid}
                                    style={{ float: 'right' }}
                                />
                            </div>
                        </>
                    ) : phase === Phase.Create ? (
                        <>
                            <div className={css.title}>
                                <FormattedMessage id="test" />
                            </div>
                            <input
                                className={css.Input}
                                id="phrase"
                                autoFocus
                                value={phrase}
                                onKeyUp={(x) => {
                                    if (x.key === 'Enter' && !phraseInvalid) generatePhrase();
                                }}
                                onInput={(x) => setPhrase(x.currentTarget.value)}
                                placeholder={enterPhrase}
                                pattern={initPattern} //at least one space
                            />
                            <div className={css.divider}></div>
                            <div className={css.btnWrapper}>
                                <BackButton
                                    messageId="back"
                                    onClick={() => setPhase(Phase.Select)}
                                    style={{ float: 'left' }}
                                />
                                <StandardButton
                                    messageId="next"
                                    onClick={generatePhrase}
                                    disabled={phraseInvalid}
                                    style={{ float: 'right' }}
                                />
                            </div>
                        </>
                    ) : phase === Phase.Store ? (
                        <>
                            <div className={css.title}>
                                <FormattedMessage id="test2" />
                                <br />
                                <br />
                                <FormattedMessage
                                    id="test3"
                                    values={{
                                        date: new Date(currentTime + timezoneOffset).toLocaleDateString(),
                                    }}
                                />
                            </div>
                            <div className={css.divider}></div>
                            <div className={css.btnWrapper}>
                                <BackButton
                                    messageId="back"
                                    onClick={() => setPhase(Phase.Create)}
                                    disabled={loading}
                                    style={{ float: 'left' }}
                                />
                                <StandardButton
                                    messageId="copy"
                                    onClick={() => {
                                        navigator.clipboard.writeText(magic);
                                        setTime(0);
                                        goToVerify();
                                    }}
                                    disabled={phraseInvalid}
                                    loading={loading}
                                    style={{ float: 'right' }}
                                />
                            </div>
                        </>
                    ) : phase === Phase.Verify ? (
                        <>
                            <div className={css.title}>
                                <FormattedMessage id="test4" />
                            </div>
                            <input
                                className={css.Input}
                                id="phrase"
                                autoFocus
                                value={phrase}
                                onKeyUp={(x) => {
                                    if (x.key === 'Enter' && !phraseInvalid) storePhrase();
                                }}
                                onInput={(x) => {
                                    setPhrase(x.currentTarget.value);
                                    verifyPhrase(x.currentTarget.value);
                                }}
                                placeholder={pasteMyPhrase}
                                pattern={phrasePattern}
                            />
                            <div className={css.divider}></div>
                            <div className={css.btnWrapper}>
                                <BackButton
                                    messageId="back"
                                    onClick={() => {
                                        setPhase(time ? Phase.Retrieve : Phase.Create);
                                        setPhrase('');
                                        setPhrasePattern(initPattern);
                                    }}
                                    disabled={loading}
                                    style={{ float: 'left' }}
                                />
                                <StandardButton
                                    messageId="finalized"
                                    onClick={storePhrase}
                                    disabled={phraseInvalid}
                                    loading={loading}
                                    style={{ float: 'right' }}
                                />
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
