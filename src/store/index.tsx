import { createReducer, createStore, Store } from '@reduxjs/toolkit';
import { Context, createContext, FunctionComponent, useContext, useEffect, useMemo } from 'react';
import { createStoreHook, Provider, ReactReduxContextValue } from 'react-redux';
import { Observable, Subject } from 'rxjs';
import { createTreeRoot, toSerializableCitationTree, toSerializableMap } from '../models/citation-tree';
import type { RootState, AppStore } from './constant-lib';
import { setRoot, SetRootAction } from './reducers/filter';
import { loadRaw, LoadRawAction } from './reducers/loader';

const initialState: RootState = {
  data: {
    raw: [],
    fullTree: createTreeRoot(),
    tree: createTreeRoot(),
    idMap: {},
  },
};

type AppAction = LoadRawAction | SetRootAction;

export function createAppStore() {
  return createStore(
    createReducer(initialState, (builder) => {
      builder
        .addCase(loadRaw.type, (state, action: LoadRawAction) => {
          state.data.raw = action.payload;
          state.data.fullTree = toSerializableCitationTree(state.data.raw);
          state.data.tree = state.data.fullTree;
          state.data.idMap = toSerializableMap(state.data.fullTree);
          console.log(state.data.idMap);
        })
        .addCase(setRoot.type, (state, action: SetRootAction) => {
          const subTree = state.data.idMap[action.payload];
          if (!subTree) {
            throw new TypeError(`Tree with ID ${action.payload} does not exist!`);
          }
          state.data.tree = subTree;
        });
    })
  );
}

export function selectGrouped(state: RootState) {
  return state.data.tree;
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
