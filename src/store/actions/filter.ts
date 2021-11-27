import { createAction } from '@reduxjs/toolkit';
import { ActionType } from '../constant-lib';

export type SetRootIdAction = ReturnType<typeof setRoot>;

export const setRoot = createAction<string>(ActionType.SetTreeRoot);
