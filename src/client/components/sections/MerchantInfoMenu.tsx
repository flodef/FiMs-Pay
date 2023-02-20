import React, { FC, MouseEvent, useCallback, useState } from 'react';
import css from './MerchantInfoMenu.module.css';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import classNames from 'classnames';
import { CaretDownIcon } from '@radix-ui/react-icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { CURRENCY_LIST } from '../../utils/constants';
import { IS_CUSTOMER_POS, POS_USE_WALLET } from '../../utils/env';
import { merchantImageSrc, MerchantInfo } from './Merchant';
import { SelectImage } from './SelectImage';
import Image from 'next/image';
import { useNavigateToMerchant } from '../../utils/merchant';

export interface MerchantInfoMenuProps {
    merchantInfoList: MerchantInfo[];
}

export const MerchantInfoMenu: FC<MerchantInfoMenuProps> = ({ merchantInfoList }) => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const myShopWalletAddress = useTranslate('myShopWalletAddress');
    const myShopName = useTranslate('myShopName');
    const maximumReceivableValue = useTranslate('maximumReceivableValue');

    const [index, setIndex] = useState(merchantInfoList.length > 0 ? merchantInfoList[0].index.toString() : '');
    const [currency, setCurrency] = useState(
        Object.keys(CURRENCY_LIST).length > 0 ? Object.keys(CURRENCY_LIST)[0] : ''
    );
    const [label, setLabel] = useState('');
    const [recipient, setRecipient] = useState('');
    const [maxValue, setMaxValue] = useState('');

    const navigate = useNavigateToMerchant();
    const handleClick = useCallback(
        (event: MouseEvent) => {
            const merchant =
                event.currentTarget.id === 'selectMerchant'
                    ? merchantInfoList.find((x) => x.index === Number(index))
                    : event.currentTarget.id === 'unregisteredMerchant'
                    ? ({
                          index: 0,
                          address: recipient,
                          company: label,
                          currency,
                          maxValue: Number(maxValue),
                      } as MerchantInfo)
                    : undefined;
            if (merchant) {
                navigate(merchant);
            } else if (merchant === undefined) {
                throw new Error('Unhandled button click');
            }
        },
        [label, maxValue, recipient, index, currency, navigate, merchantInfoList]
    );

    const onInput = useCallback<React.FormEventHandler<HTMLInputElement>>((event) => {
        const a = (x: string) => {
            switch (event.currentTarget.id) {
                case 'label':
                    return () => setLabel(x);
                case 'recipient':
                    return () => setRecipient(x);
                case 'maxValue':
                    return () => setMaxValue(x);
                default:
                    return () => {};
            }
        };
        a(event.currentTarget.value)();
    }, []);

    const getMerchantData = (item: MerchantInfo) => {
        return { key: item.index, value: item.index.toString(), text: item.company };
    };
    const getMerchantImage = (value: string) => (
        <Image className={css.image} src={merchantImageSrc(value)} alt={value} height={32} width={32} priority={true} />
    );
    const getCurrencyImage = (value: string) => React.createElement(CURRENCY_LIST[value].icon);

    return (
        <NavigationMenu.Root className={css.NavigationMenuRoot}>
            <NavigationMenu.List className={css.NavigationMenuList}>
                <NavigationMenu.Item>
                    <NavigationMenu.Trigger
                        className={css.NavigationMenuTrigger}
                        disabled={merchantInfoList.length === 0}
                    >
                        <FormattedMessage id="registeredMerchant" />
                        <CaretDownIcon id="test" className={css.CaretDown} aria-hidden />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className={css.NavigationMenuContent}>
                        <div className={classNames(css.List, css.one)}>
                            <p className={css.Text}>
                                <FormattedMessage id="selectMerchant" />
                            </p>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="id">
                                    <FormattedMessage id="merchant" />
                                </label>
                                <SelectImage
                                    id="id"
                                    value={index}
                                    onValueChange={setIndex}
                                    options={merchantInfoList}
                                    getData={getMerchantData}
                                    getImage={getMerchantImage}
                                />
                            </fieldset>
                            <div className={css.Validation}>
                                <button
                                    id="selectMerchant"
                                    className={classNames(css.Button, css.green)}
                                    onClick={handleClick}
                                >
                                    <FormattedMessage id="letsgo" />
                                </button>
                            </div>
                        </div>
                    </NavigationMenu.Content>
                </NavigationMenu.Item>

                <NavigationMenu.Item>
                    <NavigationMenu.Trigger className={css.NavigationMenuTrigger}>
                        <FormattedMessage id="unregisteredMerchant" />
                        <CaretDownIcon className={css.CaretDown} aria-hidden />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className={css.NavigationMenuContent}>
                        <div className={classNames(css.List, css.two)}>
                            <p className={css.Text}>
                                <FormattedMessage id="enterMerchantInfo" />
                            </p>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="label">
                                    <FormattedMessage id="merchant" />
                                </label>
                                <input
                                    className={css.Input}
                                    id="label"
                                    value={label}
                                    onInput={onInput}
                                    placeholder={myShopName}
                                    pattern=".{0,50}"
                                />
                            </fieldset>
                            {IS_CUSTOMER_POS || !POS_USE_WALLET ? (
                                <fieldset className={css.Fieldset}>
                                    <label className={css.Label} htmlFor="recipient">
                                        <FormattedMessage id="address" />
                                    </label>
                                    <input
                                        className={css.Input}
                                        id="recipient"
                                        value={recipient}
                                        onInput={onInput}
                                        placeholder={myShopWalletAddress}
                                        pattern="^[1-9A-HJ-NP-Za-km-z]{32,44}$"
                                    />
                                </fieldset>
                            ) : null}
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="currency">
                                    <FormattedMessage id="currency" />
                                </label>
                                <SelectImage
                                    id="currency"
                                    value={currency}
                                    onValueChange={setCurrency}
                                    options={Object.keys(CURRENCY_LIST)}
                                    getImage={getCurrencyImage}
                                />
                            </fieldset>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="maxValue">
                                    <FormattedMessage id="maxValue" />
                                </label>
                                <input
                                    className={css.Input}
                                    id="maxValue"
                                    value={maxValue}
                                    onInput={onInput}
                                    placeholder={maximumReceivableValue}
                                    pattern="^$|^[1-9]\d{0,4}(\.\d{1,2})?\s*$"
                                />
                            </fieldset>
                            <div className={css.Validation}>
                                <button
                                    id="unregisteredMerchant"
                                    className={classNames(css.Button, css.green)}
                                    onClick={handleClick}
                                >
                                    <FormattedMessage id="letsgo" />
                                </button>
                            </div>
                        </div>
                    </NavigationMenu.Content>
                </NavigationMenu.Item>

                <NavigationMenu.Item>
                    <NavigationMenu.Link className={css.NavigationMenuLink} href="https://www.fims.fi/pay/inscription">
                        <FormattedMessage id="register" />
                    </NavigationMenu.Link>
                </NavigationMenu.Item>

                <NavigationMenu.Indicator className={css.NavigationMenuIndicator}>
                    <div className={css.Arrow} />
                </NavigationMenu.Indicator>
            </NavigationMenu.List>

            <div className={css.ViewportPosition}>
                <NavigationMenu.Viewport className={css.NavigationMenuViewport} />
            </div>
        </NavigationMenu.Root>
    );
};
