import { createAction } from '@reduxjs/toolkit';
import { Nullable } from '../../lib/types';
import { ActionType } from '../constant-lib';

export type HoverNodeIdAction = ReturnType<typeof hoverNodeId>;

export const hoverNodeId = createAction<Nullable<string>, string>(ActionType.HoverNode);
