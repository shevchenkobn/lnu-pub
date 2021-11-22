import { createReducer, createStore, Store } from '@reduxjs/toolkit';
import { Context, createContext, FunctionComponent, useContext, useEffect, useMemo } from 'react';
import { Provider, ReactReduxContextValue } from 'react-redux';
import { Observable, Subject } from 'rxjs';
import type { RootState, AppStore } from './constant-lib';
import { loadRaw, LoadRawAction } from './reducers/loader';

const initialState: RootState = {
  data: {
    raw: [],
  },
};

type AppAction = LoadRawAction;

export function createAppStore() {
  return createStore(
    createReducer(initialState, (builder) => {
      builder.addCase(loadRaw.type, (state, action: LoadRawAction) => {
        state.data.raw = action.payload;
      });
    })
  );
}

interface AppStateContextValue extends ReactReduxContextValue<RootState, AppAction> {
  store$: Observable<RootState>;
}
const context = createContext<AppStateContextValue>(null as any);

export const AppProvider: FunctionComponent<{ store: AppStore }> = ({ store, children }) => {
  const subject = useMemo(() => {
    const subject = new Subject<RootState>();
    store.subscribe(() => {
      if (subject) {
        subject.next(store.getState());
      } else {
        console.error('State subject is not initialized!');
      }
    });
    return subject;
  }, [store]);
  const store$ = useMemo(() => {
    return subject.asObservable();
  }, [subject]);
  useEffect(() => () => subject.complete(), [subject]);

  return (
    <Provider store={store} context={context as Context<any>}>
      <context.Provider
        value={{
          store: store as Store<RootState, any>,
          store$,
          storeState: store.getState(),
        }}
      >
        {children}
      </context.Provider>
    </Provider>
  );
};

export function useRxAppStore() {
  const value = useContext<AppStateContextValue>(context);
  const { store, store$ } = value;
  console.log(value);
  return { store, store$ };
}
