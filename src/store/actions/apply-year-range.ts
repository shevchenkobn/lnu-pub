import { createAction } from '@reduxjs/toolkit';
import { ActionType } from '../constant-lib';

export type ApplyYearRangeAction = ReturnType<typeof applyYearRange>;

export const applyYearRange = createAction<readonly [number, number]>(ActionType.SetYearRange);
