import interpolate from 'color-interpolate';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import css from './Progress.module.css';
import { Box, CircularProgress, LinearProgress } from '@mui/material';

export enum ProgresShape {
    Linear,
    Circular,
}

export interface ProgressProps {
    value: number;
    text: string | undefined;
    shape: ProgresShape;
    isError?: boolean;
}

export const Progress: FC<ProgressProps> = ({ value, text, shape, isError = false }) => {
    const interpolated = useMemo(() => interpolate(['#8752f3', '#5497d5', '#43b4ca', '#28e0b9', '#19fb9b']), []);
    const color = useMemo(() => (!isError ? interpolated(value) : '#FF0000'), [interpolated, value, isError]);
    const backgroundColor = 'rgba(0, 0, 0, 0.1)';

    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const dist = value - progress;
        const timer = setInterval(() => {
            setProgress((prevProgress) => prevProgress + dist / 2);
        }, 80);
        return () => {
            clearInterval(timer);
        };
    }, [value, progress]);

    return (
        <div className={css.root}>
            {shape === ProgresShape.Linear ? (
                <LinearProgress
                    variant="determinate"
                    value={Math.min(value * 100, 100)}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: backgroundColor,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: color,
                            transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        },
                    }}
                />
            ) : (
                <Box sx={{ position: 'relative' }}>
                    <CircularProgress size={200} variant="determinate" sx={{ color: backgroundColor }} value={100} />
                    <CircularProgress
                        size={200}
                        variant="determinate"
                        sx={{
                            color: color,
                            position: 'absolute',
                            left: '0',
                            strokeLinecap: 'round',
                        }}
                        value={Math.min(progress * 100, 100)}
                    />
                </Box>
            )}
            <div className={css.text}>
                {text ? (
                    <FormattedMessage id={text} />
                ) : value !== 0 ? (
                    <FormattedNumber value={value} style="percent" />
                ) : null}
            </div>
        </div>
    );
};
