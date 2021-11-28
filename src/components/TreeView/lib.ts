import { Nullable } from '../../lib/types';
import { getAssertedNode, RootState } from '../../store/constant-lib';

export function getHoveredNode(state: RootState, hoveredNodeId: Nullable<string>) {
  return hoveredNodeId ? getAssertedNode(state, hoveredNodeId) : null;
}
