// Segment and Filter Type Definitions

export type FilterType = 'INPUT' | 'RADIO' | 'CHECK_BOX' | 'DROP_DOWN';
export type FilterDataType = 'string' | 'number' | 'boolean' | 'timestamp';
export type MatchOperator = 'AND' | 'OR';
export type MatchType = 'all' | 'any';

export interface Filter {
  _id: string;
  filterKey: string;
  filterLabel: string;
  filterType: FilterType;
  filterDataType: FilterDataType;
  filterValues?: string[];
}

export interface FilterCondition {
  conditionType: string;
  value?: string | number;
  fromValue?: string | Date;
  toValue?: string | Date;
  duration?: string;
}

export interface SegmentFilter {
  _id?: string;
  fieldId: string;
  key: string;
  name: string;
  values: Array<string | number>;
  conditions?: FilterCondition[];
  operator?: MatchOperator;
  count?: number;
  invalidEmailCount?: number;
  unSubscribedUserCount?: number;
  segmentCount?: number;
  segmentInvalidEmailCount?: number;
  segmentUnSubscribedUserCount?: number;
  type?: FilterType;
}

export interface Segment {
  _id: string;
  name: string;
  filters: SegmentFilter[];
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  _id: string;
  groupName: string;
  contentCount?: number;
  type?: 'CAMPAIGN' | 'TEMPLATE';
}

export interface FilterCountResponse {
  count: number;
  invalidEmailCount: number;
  unSubscribedUserCount: number;
  segmentCount: number;
  segmentInvalidEmailCount: number;
  segmentUnSubscribedUserCount: number;
  fieldValues?: any[];
}

export interface ConditionOption {
  label: string;
  value: string;
  dataType: string | string[];
  dataType2?: string;
  dataType3?: string;
  category: string;
}

export interface FilterValue {
  value: string | number;
  label?: string;
}

export interface FilterValuesResponse {
  filterValues: FilterValue[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
}
