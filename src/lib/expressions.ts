// import { Optional } from './types';

import { Optional } from './types';

export function ifV<T, F, C extends boolean>(
  condition: () => C,
  trueExpression: (condition: true) => T,
  falseExpression: (condition: false) => F
): C extends true ? T : F {
  return (condition() ? trueExpression(true) : falseExpression(false)) as any;
}

// export function whenFull<V, S>(
//   switchV: S,
//   cases: [caseV: S, expression: (breakF: () => void, caseV: S) => V][]
// ): Optional<V>;
// export function whenFull<V, S>(
//   switchV: S,
//   cases: [caseV: S, expression: (breakF: () => void, caseV: S) => V][],
//   defaultE?: (caseV: S) => V
// ): V;
// export function whenFull<V, S>(
//   switchV: S,
//   cases: [caseV: S, expression: (breakF: () => void, caseV: S) => V][],
//   defaultE?: (caseV: S) => V
// ): Optional<V> {
//   let broken = false;
//   let value: Optional<V>;
//   const breakF = () => (broken = true);
//   for (const [caseV, expression] of cases) {
//     if (caseV === switchV) {
//       value = expression(breakF, caseV);
//       if (broken) {
//         break;
//       }
//     }
//   }
//   if (defaultE && !broken) {
//     value = defaultE(switchV);
//   }
//   return value;
// }
//
// const value = whenFull(ActionType.HoverNode, [
//   [
//     ActionType.HoverNode,
//     (breakF) => {
//       breakF();
//       return 'hover';
//     },
//   ],
// ]);

export function when<V, S>(switchV: S, cases: [caseV: S, expression: (caseV: S) => V][]): Optional<V>;
export function when<V, S>(switchV: S, cases: [caseV: S, expression: (caseV: S) => V][], defaultE?: (caseV: S) => V): V;
export function when<V, S>(
  switchV: S,
  cases: [caseV: S, expression: (caseV: S) => V][],
  defaultE?: (caseV: S) => V
): Optional<V> {
  for (const [caseV, expression] of cases) {
    if (caseV === switchV) {
      return expression(caseV);
    }
  }
  if (defaultE) {
    return defaultE(switchV);
  }
}

export function whenT<V>(cases: [caseV: boolean, expression: (caseV: true) => V][]): Optional<V>;
export function whenT<V>(cases: [caseV: boolean, expression: (caseV: true) => V][], defaultE?: (caseV: true) => V): V;
export function whenT<V>(
  cases: [caseV: boolean, expression: (caseV: true) => V][],
  defaultE?: (caseV: true) => V
): Optional<V> {
  return when<V, boolean>(true, cases as any, defaultE as any);
}
