import { GuardedMap } from '../lib/map';
import { DeepReadonly, DeepReadonlyArray, Nullable } from '../lib/types';
import { Citation } from './citation';

export enum TreeNodeType {
  Root = 'root',
  University = 'university',
  Faculty = 'faculty',
  Department = 'department',
  Person = 'person',
}

interface TreeNodeCommon<T extends TreeNodeType> {
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
}

export interface AnyTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  /**
   * The amount of citations
   */
  value: number;
  children: Nullable<AnyTreeNode<TreeNodeType>[]>;
}

export interface FlatTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  /**
   * The amount of citations.
   */
  value?: number;
  /**
   * The amount of citations in aggregations (to fool vega).
   */
  groupedValue?: number;
}

// type TreeNodes = {
//   [TreeNodeType.Root]: AnyTreeNode<TreeNodeType.Root> & {
//     parent: null;
//     children: TreeNode<TreeNodeType.University>[];
//   };
//   [TreeNodeType.University]: AnyTreeNode<TreeNodeType.University> & {
//     parent: TreeNode<TreeNodeType.Root>;
//     children: TreeNode<TreeNodeType.Faculty>[];
//   };
//   [TreeNodeType.Faculty]: AnyTreeNode<TreeNodeType.Faculty> & {
//     parent: TreeNode<TreeNodeType.University>;
//     children: TreeNode<TreeNodeType.Department>[];
//   };
//   [TreeNodeType.Department]: AnyTreeNode<TreeNodeType.Department> & {
//     parent: TreeNode<TreeNodeType.Faculty>;
//     children: TreeNode<TreeNodeType.Person>[];
//   };
//   [TreeNodeType.Person]: AnyTreeNode<TreeNodeType.Person> & {
//     parent: TreeNode<TreeNodeType.Department>;
//     children: null;
//   };
// };
export type NonLeafTreeNodeType = MiddleTreeNodeType | TreeNodeType.Root;
export type MiddleTreeNodeType = TreeNodeType.University | TreeNodeType.Faculty | TreeNodeType.Department;

// export type TreeNode<T extends TreeNodeType> = TreeNodes[T];

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
  extractId(value: Citation): string;
  extractName(value: Citation): string;
}

export function toSerializableCitationTree(
  citations: Iterable<DeepReadonly<Citation>>
): SerializableTreeNode<TreeNodeType.Root> {
  const extractorRegex = /\((\w+)\)$/i;
  const idExtractors: Record<MiddleTreeNodeType | TreeNodeType.Person, Mappers> = {
    [TreeNodeType.University]: {
      extractId(value: Citation): string {
        return 'u' + (value.university.match(extractorRegex)?.[1] ?? value.university);
      },
      extractName(value: Citation): string {
        return value.university;
      },
    },
    [TreeNodeType.Faculty]: {
      extractId(value: Citation): string {
        return 'f' + (value.faculty.match(extractorRegex)?.[1] ?? value.faculty);
      },
      extractName(value: Citation): string {
        return value.faculty;
      },
    },
    [TreeNodeType.Department]: {
      extractId(value: Citation): string {
        return 'd' + (value.department.match(extractorRegex)?.[1] ?? value.department);
      },
      extractName(value: Citation): string {
        return value.department;
      },
    },
    [TreeNodeType.Person]: {
      extractId(value: Citation): string {
        return `p${value.id}_${value.year}`;
      },
      extractName(value: Citation): string {
        return `${value.name} (${value.year})`;
      },
    },
  };

  const root = createTreeRoot();

  const map = new GuardedMap<string, SerializableTreeNode<MiddleTreeNodeType>>();
  for (const citation of citations) {
    const universityId = idExtractors[TreeNodeType.University].extractId(citation);
    let university: SerializableTreeNode<TreeNodeType.University>;
    if (map.has(universityId)) {
      university = map.get(universityId) as SerializableTreeNode<TreeNodeType.University>;
      university.value += citation.pubs;
    } else {
      university = {
        parent: root.id,
        id: universityId,
        type: TreeNodeType.University,
        name: idExtractors[TreeNodeType.University].extractName(citation),
        value: citation.pubs,
        children: [],
      };
      map.set(university.id, university);
      root.children.push(university);
    }

    const facultyId = idExtractors[TreeNodeType.Faculty].extractId(citation);
    let faculty: SerializableTreeNode<TreeNodeType.Faculty>;
    if (map.has(facultyId)) {
      faculty = map.get(facultyId) as SerializableTreeNode<TreeNodeType.Faculty>;
      faculty.value += citation.pubs;
    } else {
      faculty = {
        parent: university.id,
        id: facultyId,
        type: TreeNodeType.Faculty,
        name: idExtractors[TreeNodeType.Faculty].extractName(citation),
        value: citation.pubs,
        children: [],
      };
      map.set(faculty.id, faculty);
      university.children.push(faculty);
    }

    const departmentId = idExtractors[TreeNodeType.Department].extractId(citation);
    let department: SerializableTreeNode<TreeNodeType.Department>;
    if (map.has(departmentId)) {
      department = map.get(departmentId) as SerializableTreeNode<TreeNodeType.Department>;
      department.value += citation.pubs;
    } else {
      department = {
        parent: faculty.id,
        id: departmentId,
        type: TreeNodeType.Department,
        name: idExtractors[TreeNodeType.Department].extractName(citation),
        value: citation.pubs,
        children: [],
      };
      map.set(department.id, department);
      faculty.children.push(department);
    }
    const node: SerializableTreeNode<TreeNodeType.Person> = {
      parent: department.id,
      id: idExtractors[TreeNodeType.Person].extractId(citation),
      type: TreeNodeType.Person,
      name: idExtractors[TreeNodeType.Person].extractName(citation),
      value: citation.pubs,
      children: null,
    };
    root.value += node.value;
    department.children.push(node);
  }
  return root;
}

export type SerializableTreeNodeMap = Record<string, AnyTreeNode<any>>;

export function toSerializableMap(tree: DeepReadonly<AnyTreeNode<any>>): SerializableTreeNodeMap {
  const map: SerializableTreeNodeMap = {};
  const queue: DeepReadonly<AnyTreeNode<any>>[] = [tree];
  while (queue.length > 0) {
    const node = queue[0];
    const newNode = cloneShallow(node);
    newNode.children = node.children ? [] : node.children;
    map[node.id] = newNode;
    if (typeof node.parent === 'string') {
      const parent = map[node.parent];
      if (!parent.children) {
        throw new Error('Unknown issue with missing children!');
      }
      parent.children.push(newNode);
    }
    queue.shift();
    if (node.children) {
      for (const child of node.children) {
        if (map[child.id]) {
          continue;
        }
        queue.push(child);
      }
    }
  }
  return map;
}

export function toArray(tree: DeepReadonly<AnyTreeNode<any>>): FlatTreeNode<any>[] {
  const array: DeepReadonly<FlatTreeNode<any>>[] = [];
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

// export function toCitationTree(tree: TreeNode<TreeNodeType.Root>) {
//   const root: TreeNode<TreeNodeType.Root> = cloneCommon(tree, []);
//   for (const university of root.children) {
//     const newUniversity = cloneCommon(university, []);
//     root.children.push(newUniversity);
//     newUniversity.parent = root;
//     for (const faculty of university.children) {
//       const newFaculty: TreeNode<TreeNodeType.Faculty> = cloneCommon(faculty, []);
//       newUniversity.children.push(faculty);
//       newFaculty.parent = newUniversity;
//     }
//   }
// }

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
  } as T;
}

export function createTreeRoot(): SerializableTreeNode<TreeNodeType.Root> {
  return {
    parent: null,
    id: '/',
    type: TreeNodeType.Root,
    name: 'Universities',
    value: 0,
    children: [],
  };
}

export function* traverseParents<N extends { readonly parent: Nullable<string> }>(
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
