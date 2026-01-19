import type { ConditionOption } from '@/types/segment';

export const CONDITIONS: ConditionOption[] = [
  {
    label: 'is equal to',
    value: 'equals',
    dataType: 'string',
    dataType2: 'boolean',
    dataType3: 'number',
    category: 'Basic',
  },
  {
    label: 'is not equal to',
    value: 'not_equals',
    dataType: 'string',
    dataType2: 'boolean',
    dataType3: 'number',
    category: 'Basic',
  },
  { label: 'contains', value: 'contains', dataType: 'string', category: 'Basic' },
  { label: 'does not contain', value: 'not_contains', dataType: 'string', category: 'Basic' },
  { label: 'is greater than', value: 'greater_than', dataType: 'number', category: 'Number' },
  { label: 'is less than', value: 'less_than', dataType: 'number', category: 'Number' },
  { label: 'is between', value: 'between', dataType: 'number', category: 'Number' },
  {
    label: 'is a timestamp',
    value: 'is_timestamp',
    dataType: 'timestamp',
    category: 'Date & Time',
  },
  {
    label: 'is not a timestamp',
    value: 'is_not_timestamp',
    dataType: 'timestamp',
    category: 'Date & Time',
  },
  {
    label: 'is a timestamp after',
    value: 'timestamp_after',
    dataType: 'timestamp',
    category: 'Date & Time',
  },
  {
    label: 'is a timestamp before',
    value: 'timestamp_before',
    dataType: 'timestamp',
    category: 'Date & Time',
  },
  {
    label: 'is a timestamp between',
    value: 'timestamp_between',
    dataType: 'timestamp',
    category: 'Date & Time',
  },
  {
    label: 'more than in past',
    value: 'more_than_in_past',
    dataType: 'timestamp',
    category: 'Relative Time',
  },
  {
    label: 'less than in past',
    value: 'less_than_in_past',
    dataType: 'timestamp',
    category: 'Relative Time',
  },
  {
    label: 'less than in future',
    value: 'less_than_in_future',
    dataType: 'timestamp',
    category: 'Relative Time',
  },
  {
    label: 'more than in future',
    value: 'more_than_in_future',
    dataType: 'timestamp',
    category: 'Relative Time',
  },
];

export const FILTER_TYPES = [
  { name: 'Input', value: 'INPUT', id: 1 },
  { name: 'Radio Buttons', value: 'RADIO', id: 2 },
  { name: 'DropDown', value: 'DROP_DOWN', id: 3 },
  { name: 'Check Boxes', value: 'CHECK_BOX', id: 4 },
] as const;

export const DURATION_UNITS = [
  { label: 'Minute(s)', value: 'minute' },
  { label: 'Hour(s)', value: 'hour' },
  { label: 'Day(s)', value: 'day' },
  { label: 'Week(s)', value: 'week' },
  { label: 'Month(s)', value: 'month' },
  { label: 'Year(s)', value: 'year' },
] as const;
