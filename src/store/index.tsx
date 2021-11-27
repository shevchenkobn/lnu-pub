import { createReducer, createStore, Store } from '@reduxjs/toolkit';
import { Context, createContext, FunctionComponent, useContext, useEffect, useMemo } from 'react';
import { createStoreHook, Provider, ReactReduxContextValue } from 'react-redux';
import { Observable, Subject } from 'rxjs';
import type { AppStore, RootState } from './constant-lib';
import { getInitialState } from './constant-lib';
import { AppAction, buildReducers } from './reducers';

export function createAppStore() {
  return createStore(
    createReducer(getInitialState(), (builder) => {
      buildReducers(builder);
    })
  );
}

interface AppStateContextValue extends ReactReduxContextValue<RootState, AppAction> {
  state$: Observable<RootState>;
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
          state$: store$,
          storeState: store.getState(),
        }}
      >
        {children}
      </context.Provider>
    </Provider>
  );
};

export const useAppStore = createStoreHook(context as any);

export function useRxAppStore() {
  const value = useContext<AppStateContextValue>(context);
  const { store, state$ } = value;
  return { store, state$ };
}
