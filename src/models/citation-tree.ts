import { GuardedMap } from '../lib/map';
import { DeepReadonly, Nullable } from '../lib/types';
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
   * Name, a university, a department, person's name.
   */
  id: string;
  type: T;
  name: string;
}

interface AnyTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  parent: Nullable<AnyTreeNode<TreeNodeType>>;
  /**
   * The amount of citations
   */
  value: number;
  children: Nullable<AnyTreeNode<TreeNodeType>[]>;
}

export interface FlatTreeNode<T extends TreeNodeType> extends TreeNodeCommon<T> {
  parent: Nullable<string>;
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
export type MiddleTreeNodeType = TreeNodeType.University | TreeNodeType.Faculty | TreeNodeType.Department;

// export type TreeNode<T extends TreeNodeType> = TreeNodes[T];

type SerializableTreeNodes = {
  [TreeNodeType.Root]: AnyTreeNode<TreeNodeType.Root> & {
    parent: null;
    children: SerializableTreeNode<TreeNodeType.University>[];
  };
  [TreeNodeType.University]: AnyTreeNode<TreeNodeType.University> & {
    parent: null;
    children: SerializableTreeNode<TreeNodeType.Faculty>[];
  };
  [TreeNodeType.Faculty]: AnyTreeNode<TreeNodeType.Faculty> & {
    parent: null;
    children: SerializableTreeNode<TreeNodeType.Department>[];
  };
  [TreeNodeType.Department]: AnyTreeNode<TreeNodeType.Department> & {
    parent: null;
    children: SerializableTreeNode<TreeNodeType.Person>[];
  };
  [TreeNodeType.Person]: AnyTreeNode<TreeNodeType.Person> & {
    parent: null;
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
        parent: null,
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
        parent: null,
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
        parent: null,
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
      parent: null,
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

export function toArray(tree: DeepReadonly<SerializableTreeNode<any>>): FlatTreeNode<any>[] {
  const array: DeepReadonly<FlatTreeNode<any>>[] = [];
  const queue: { node: DeepReadonly<AnyTreeNode<any>>; parent: Nullable<DeepReadonly<AnyTreeNode<any>>> }[] = [
    { node: tree, parent: null },
  ];
  const processed = new Set<string>();
  while (queue.length > 0) {
    const { node, parent } = queue[0];
    const newNode = cloneCommon<FlatTreeNode<any>>(node);
    newNode.parent = parent?.id ?? null;
    array.push(newNode);
    queue.shift();
    processed.add(node.id);
    if (node.children) {
      for (const child of node.children) {
        if (!processed.has(child.id)) {
          queue.push({
            node: child,
            parent: node,
          });
        }
      }
      newNode.groupedValue = node.value;
    } else {
      newNode.value = node.value;
    }
  }
  return array;
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

function cloneCommon<T extends TreeNodeCommon<any> = TreeNodeCommon<any>>(node: DeepReadonly<TreeNodeCommon<any>>): T {
  return {
    id: node.id,
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
