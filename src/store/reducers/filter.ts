import { createAction } from '@reduxjs/toolkit';
import { ActionType } from '../constant-lib';

export type SetRootAction = ReturnType<typeof setRoot>;

export const setRoot = createAction<string>(ActionType.SetRoot);
