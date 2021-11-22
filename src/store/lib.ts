import { AnyAction, AsyncThunkAction, Store } from '@reduxjs/toolkit';
import { deserializeError } from 'serialize-error';
import type { RootState } from './constant-lib';

export function dispatchWithError<Returned>(
  store: Store<RootState>,
  action: AsyncThunkAction<Returned, any, Record<string, any>>
): Promise<Returned> {
  return store.dispatch(action as any).then((action: AnyAction) => {
    const error =
      action.meta && 'rejectedWithValue' in action.meta && action.meta.rejectedWithValue
        ? action.payload
        : 'error' in action
        ? action.error
        : null;
    if (error) {
      throw deserializeError(error);
    }
    return action.payload as Returned;
  });
}
