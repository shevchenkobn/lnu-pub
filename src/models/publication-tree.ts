import { GuardedMap } from '../lib/map';
import { objectKeys } from '../lib/object';
import { DeepReadonly, DeepReadonlyArray, Nullable } from '../lib/types';
import { Publications, getDefaultYearRange } from './publications';

export enum TreeNodeType {
  Root = 'root',
  University = 'university',
  Faculty = 'faculty',
  Department = 'department',
  Person = 'person',
}

export interface TreeNodeParentable {
  readonly parent: Nullable<string>;
}

interface TreeNodeCommon<T extends TreeNodeType> extends TreeNodeParentable {
  /**
   * Parent node ID.
   */
  parent: Nullable<string>;
  /**
   * Name, a university, a department, person's name.
   */
  id: string;
  type: T;
  name: string;
  /**
   * Years in format [min, max].
   */
  years: [number, number];
}

export interface AnyTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  /**
   * The amount of publications.
   */
  value: number;
  children: Nullable<AnyTreeNode<TreeNodeType>[]>;
}

export interface FlatTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  /**
   * The amount of publications.
   */
  value?: number;
  /**
   * The amount of publications in aggregations (to fool vega).
   */
  groupedValue?: number;
}

export type NonLeafTreeNodeType = MiddleTreeNodeType | TreeNodeType.Root;
export type MiddleTreeNodeType = TreeNodeType.University | TreeNodeType.Faculty | TreeNodeType.Department;

type SerializableTreeNodes = {
  [TreeNodeType.Root]: AnyTreeNode<TreeNodeType.Root> & {
    parent: null;
    children: SerializableTreeNode<TreeNodeType.University>[];
  };
  [TreeNodeType.University]: AnyTreeNode<TreeNodeType.University> & {
    parent: string;
    children: SerializableTreeNode<TreeNodeType.Faculty>[];
  };
  [TreeNodeType.Faculty]: AnyTreeNode<TreeNodeType.Faculty> & {
    parent: string;
    children: SerializableTreeNode<TreeNodeType.Department>[];
  };
  [TreeNodeType.Department]: AnyTreeNode<TreeNodeType.Department> & {
    parent: string;
    children: SerializableTreeNode<TreeNodeType.Person>[];
  };
  [TreeNodeType.Person]: AnyTreeNode<TreeNodeType.Person> & {
    parent: string;
    children: null;
  };
};
export type SerializableTreeNode<T extends TreeNodeType> = SerializableTreeNodes[T];

interface Mappers {
  extractId(value: Publications): string;
  extractName(value: Publications): string;
}

export function toSerializablePublicationTree(
  publications: Iterable<DeepReadonly<Publications>>,
  idMap: SerializableTreeNodeMap = {}
): SerializableTreeNode<TreeNodeType.Root> {
  const extractorRegex = /\((\w+)\)$/i;
  const idExtractors: Record<MiddleTreeNodeType | TreeNodeType.Person, Mappers> = {
    [TreeNodeType.University]: {
      extractId(value: Publications): string {
        return 'u' + (value.university.match(extractorRegex)?.[1] ?? value.university);
      },
      extractName(value: Publications): string {
        return value.university;
      },
    },
    [TreeNodeType.Faculty]: {
      extractId(value: Publications): string {
        return 'f' + (value.faculty.match(extractorRegex)?.[1] ?? value.faculty);
      },
      extractName(value: Publications): string {
        return value.faculty;
      },
    },
    [TreeNodeType.Department]: {
      extractId(value: Publications): string {
        return 'd' + (value.department.match(extractorRegex)?.[1] ?? value.department);
      },
      extractName(value: Publications): string {
        return value.department;
      },
    },
    [TreeNodeType.Person]: {
      extractId(value: Publications): string {
        return `p${value.id}_${value.year}`;
      },
      extractName(value: Publications): string {
        return `${value.name} (${value.year})`;
      },
    },
  };
  for (const key of objectKeys(idMap)) {
    delete idMap[key];
  }

  const root = createTreeRoot();
  root.years = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
  idMap[root.id] = root;

  for (const publicationsEntry of publications) {
    const universityId = idExtractors[TreeNodeType.University].extractId(publicationsEntry);
    let university: SerializableTreeNode<TreeNodeType.University>;
    if (idMap[universityId]) {
      university = idMap[universityId] as SerializableTreeNode<TreeNodeType.University>;
      university.value += publicationsEntry.pubs;
      updateYears(university.years, publicationsEntry.year);
    } else {
      university = {
        parent: root.id,
        id: universityId,
        type: TreeNodeType.University,
        name: idExtractors[TreeNodeType.University].extractName(publicationsEntry),
        years: [publicationsEntry.year, publicationsEntry.year],
        value: publicationsEntry.pubs,
        children: [],
      };
      idMap[university.id] = university;
      root.children.push(university);
    }

    const facultyId = idExtractors[TreeNodeType.Faculty].extractId(publicationsEntry);
    let faculty: SerializableTreeNode<TreeNodeType.Faculty>;
    if (idMap[facultyId]) {
      faculty = idMap[facultyId] as SerializableTreeNode<TreeNodeType.Faculty>;
      faculty.value += publicationsEntry.pubs;
      updateYears(faculty.years, publicationsEntry.year);
    } else {
      faculty = {
        parent: university.id,
        id: facultyId,
        type: TreeNodeType.Faculty,
        name: idExtractors[TreeNodeType.Faculty].extractName(publicationsEntry),
        years: [publicationsEntry.year, publicationsEntry.year],
        value: publicationsEntry.pubs,
        children: [],
      };
      idMap[faculty.id] = faculty;
      university.children.push(faculty);
    }

    const departmentId = idExtractors[TreeNodeType.Department].extractId(publicationsEntry);
    let department: SerializableTreeNode<TreeNodeType.Department>;
    if (idMap[departmentId]) {
      department = idMap[departmentId] as SerializableTreeNode<TreeNodeType.Department>;
      department.value += publicationsEntry.pubs;
      updateYears(department.years, publicationsEntry.year);
    } else {
      department = {
        parent: faculty.id,
        id: departmentId,
        type: TreeNodeType.Department,
        name: idExtractors[TreeNodeType.Department].extractName(publicationsEntry),
        years: [publicationsEntry.year, publicationsEntry.year],
        value: publicationsEntry.pubs,
        children: [],
      };
      idMap[department.id] = department;
      faculty.children.push(department);
    }
    const node: SerializableTreeNode<TreeNodeType.Person> = {
      parent: department.id,
      id: idExtractors[TreeNodeType.Person].extractId(publicationsEntry),
      type: TreeNodeType.Person,
      name: idExtractors[TreeNodeType.Person].extractName(publicationsEntry),
      years: [publicationsEntry.year, publicationsEntry.year],
      value: publicationsEntry.pubs,
      children: null,
    };
    root.value += node.value;
    updateYears(root.years, publicationsEntry.year);
    department.children.push(node);
    idMap[node.id] = node;
  }
  return root;
}

export type SerializableTreeNodeMap = Record<string, AnyTreeNode<any>>;

// export function toSerializableMap(tree: DeepReadonly<AnyTreeNode<any>>): SerializableTreeNodeMap {
//   const map: SerializableTreeNodeMap = {};
//   const queue: DeepReadonly<AnyTreeNode<any>>[] = [tree];
//   while (queue.length > 0) {
//     const node = queue[0];
//     const newNode = cloneShallow(node);
//     newNode.children = node.children ? [] : node.children;
//     map[node.id] = newNode;
//     if (typeof node.parent === 'string') {
//       const parent = map[node.parent];
//       if (!parent.children) {
//         throw new Error('Unknown issue with missing children!');
//       }
//       parent.children.push(newNode);
//     }
//     queue.shift();
//     if (node.children) {
//       for (const child of node.children) {
//         if (map[child.id]) {
//           continue;
//         }
//         queue.push(child);
//       }
//     }
//   }
//   return map;
// }

export function toArray(tree: DeepReadonly<AnyTreeNode<any>>): FlatTreeNode<any>[] {
  const array: FlatTreeNode<any>[] = [];
  const queue: DeepReadonly<AnyTreeNode<any>>[] = [tree];
  const processed = new Set<string>();
  while (queue.length > 0) {
    const node = queue[0];
    const newNode = cloneCommon<FlatTreeNode<any>>(node);
    array.push(newNode);
    queue.shift();
    processed.add(node.id);
    if (node.children) {
      for (const child of node.children) {
        if (!processed.has(child.id)) {
          queue.push(child);
        }
      }
      newNode.groupedValue = node.value;
    } else {
      newNode.value = node.value;
    }
  }
  return array;
}

export function toFlatNode(node: DeepReadonly<AnyTreeNode<any>>): FlatTreeNode<any> {
  const newNode = cloneCommon<FlatTreeNode<any>>(node);
  if (node.children) {
    newNode.groupedValue = node.value;
  } else {
    newNode.value = node.value;
  }
  return newNode;
}

export function cloneShallow(node: DeepReadonly<AnyTreeNode<any>>): AnyTreeNode<any> {
  const newNode = cloneCommon<AnyTreeNode<any>>(node);
  newNode.value = node.value;
  newNode.children = null;
  return newNode;
}

function cloneCommon<T extends TreeNodeCommon<any> = TreeNodeCommon<any>>(node: DeepReadonly<TreeNodeCommon<any>>): T {
  return {
    id: node.id,
    parent: node.parent,
    type: node.type,
    name: node.name,
    years: node.years.slice(),
  } as T;
}

interface QueueEntry {
  parentChildren: AnyTreeNode<any>[];
  node: DeepReadonly<AnyTreeNode<any>>;
}

export function* traversePostOrder<T extends DeepReadonly<AnyTreeNode<any>>>(tree: T): Generator<T, void, unknown> {
  // const stack: DeepReadonly<AnyTreeNode<any>>[] = [tree];
  // const visited = new Set<string>();
  // while () {
  //   const node = stack[0];
  //   if (visited.has(node.id)) {
  //     continue;
  //   }
  //   if (node.children) {
  //     stack.unshift(...node.children);
  //   } else {
  //     stack.shift();
  //   }
  //   visited.add(node.id);
  // }
  if (tree.children) {
    for (const node of tree.children) {
      for (const child of traversePostOrder(node)) {
        yield child as T;
      }
    }
  }
  yield tree;
}

export function getFilteredTree(
  tree: DeepReadonly<AnyTreeNode<any>>,
  predicate: (node: DeepReadonly<AnyTreeNode<any>>) => boolean
): Nullable<AnyTreeNode<any>> {
  if (!predicate(tree)) {
    return null;
  }
  const root = cloneShallow(tree);
  if (!tree.children) {
    return root;
  }
  root.children = [];
  const queue: QueueEntry[] = tree.children.map((node) => ({ parentChildren: root.children!, node }));
  while (queue.length > 0) {
    const { parentChildren, node } = queue[0];
    queue.shift();
    if (!predicate(node)) {
      continue;
    }
    const newNode = cloneShallow(node);
    if (node.children) {
      const children: AnyTreeNode<any>[] = [];
      newNode.children = children;
      for (const child of node.children) {
        queue.push({ parentChildren: children, node: child });
      }
    } else {
      newNode.children = null;
    }
    parentChildren.push(newNode);
  }
  return root;
}

export function* traversePreOrder<T extends DeepReadonly<AnyTreeNode<any>>>(tree: T): Generator<T, void, unknown> {
  const queue: DeepReadonly<AnyTreeNode<any>>[] = [tree];
  while (queue.length > 0) {
    const node = queue[0];
    yield node as T;
    if (node.children) {
      queue.push(...node.children);
    }
    queue.shift();
  }
}

export function* traverseParents<N extends TreeNodeParentable>(
  node: Nullable<N>,
  getNode: (id: string) => Nullable<N>
) {
  if (!node) {
    return;
  }
  let currentId = node.parent;
  while (currentId !== null) {
    const current = getNode(currentId);
    if (current) {
      yield current;
      currentId = current.parent;
    } else {
      console.error(`Failed parent traversal: node with id ${currentId} not found!`);
      break;
    }
  }
}

export function createTreeRoot(): SerializableTreeNode<TreeNodeType.Root> {
  return {
    parent: null,
    id: '/',
    type: TreeNodeType.Root,
    name: 'Universities',
    years: getDefaultYearRange(),
    value: 0,
    children: [],
  };
}

export function updateYears(range: [number, number], year: number): typeof range {
  range[1] = Math.max(range[1], year);
  range[0] = Math.min(range[0], year);
  return range;
}
