import { createAction } from '@reduxjs/toolkit';
import { ActionType } from '../constant-lib';

export type HoverNodeIdAction = ReturnType<typeof hoverNodeId>;

export const hoverNodeId = createAction<string, string>(ActionType.HoverNode);
