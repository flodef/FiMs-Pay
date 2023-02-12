import React, { FC } from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import css from './SelectImage.module.css';

const getDefaultData = (item: string) => {
    return { key: item, value: item, text: item };
};

interface SelectItemProps {
    item: any;
    size: string | number | undefined;
    getData: (item: any) => { key: string | number; value: string; text: string };
    getImage?: (value: string) => JSX.Element;
    imageOnly?: boolean;
}

const SelectItem: FC<SelectItemProps> = ({ item, size, getData, getImage, imageOnly }) => (
    <div className={css.SelectedItem}>
        <div style={{ width: size, height: size }}>{getImage ? getImage(getData(item).value) : null}</div>
        {!imageOnly ? getData(item).text : null}
    </div>
);

export interface SelectImageProps {
    id: string;
    options: Array<any>;
    value: string;
    size?: string | number | undefined;
    onValueChange: (value: string) => void;
    getData?: (item: any) => { key: string | number; value: string; text: string };
    getImage?: (value: string) => JSX.Element;
    imageOnly?: boolean;
}

export const SelectImage: FC<SelectImageProps> = ({
    id,
    options,
    value,
    size = 32,
    onValueChange,
    getData,
    getImage,
    imageOnly,
}) => {
    if (options.length === 0) return null;

    getData ??= getDefaultData;
    const defaultValue = getData(options[0]).value;
    value ??= defaultValue;

    return options.length === 1 ? (
        <SelectItem item={options[0]} size={size} getData={getData} getImage={getImage} imageOnly={imageOnly} />
    ) : (
        <Select.Root onValueChange={onValueChange} value={value} defaultValue={defaultValue}>
            <Select.Trigger className={css.SelectTrigger} style={{ height: Number(size) + 3 }} aria-label={id}>
                <Select.Value />
                <Select.Icon className={css.SelectIcon}>
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal id={id}>
                <Select.Content className={css.SelectContent}>
                    <Select.ScrollUpButton className={css.SelectScrollButton}>
                        <ChevronUpIcon />
                    </Select.ScrollUpButton>
                    <Select.Viewport className={css.SelectViewport}>
                        {options.map((item) => {
                            const { key, value, text } = getData ? getData(item) : getDefaultData(item);
                            return (
                                <Select.Item
                                    className={css.SelectItem}
                                    style={{ height: Number(size) + 13 }}
                                    key={key}
                                    value={value}
                                >
                                    <Select.ItemText>
                                        <SelectItem
                                            item={item}
                                            size={size}
                                            getData={getData ?? getDefaultData}
                                            getImage={getImage}
                                            imageOnly={imageOnly}
                                        />
                                    </Select.ItemText>
                                    <Select.ItemIndicator className={css.SelectItemIndicator}>
                                        <CheckIcon />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            );
                        })}
                    </Select.Viewport>
                    <Select.ScrollDownButton className={css.SelectScrollButton}>
                        <ChevronDownIcon />
                    </Select.ScrollDownButton>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
};
