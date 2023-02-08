import React, { FC } from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import css from './SelectImage.module.css';

export interface SelectImageProps {
    id: string;
    options: Array<any>;
    value: string;
    onValueChange: (value: string) => void;
    getData?: (item: any) => { key: string | number; value: string; text: string };
    getImage?: (value: string) => JSX.Element;
}

const getDefaultData = (item: string) => {
    return { key: item, value: item, text: item };
};

export const SelectImage: FC<SelectImageProps> = ({ id, options, value, onValueChange, getData, getImage }) => {
    if (options.length === 0) return null;

    getData ??= getDefaultData;
    const defaultValue = getData(options[0]).value;
    value ??= defaultValue;

    return (
        <Select.Root onValueChange={onValueChange} value={value} defaultValue={defaultValue}>
            <Select.Trigger className={css.SelectTrigger} aria-label={id}>
                <Select.Value />
                <Select.Icon className={css.SelectIcon}>
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal id={id} style={{ zIndex: 1 }}>
                <Select.Content className={css.SelectContent}>
                    <Select.ScrollUpButton className={css.SelectScrollButton}>
                        <ChevronUpIcon />
                    </Select.ScrollUpButton>
                    <Select.Viewport className={css.SelectViewport}>
                        {options.map((item) => {
                            const { key, value, text } = getData ? getData(item) : getDefaultData(item);
                            return (
                                <Select.Item className={css.SelectItem} key={key} value={value}>
                                    <Select.ItemText>
                                        <div className={css.SelectedItem}>
                                            {getImage ? getImage(value) : null}
                                            {text}
                                        </div>
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
