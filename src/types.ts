// src/types/index.ts

/**
 * Represents the type of a column in a data table.
 */
export type ColumnType = "text" | "number" | "select" | "multi-select" | "boolean" | "date";

/**
 * Represents a filter for a data table.
 */
export interface Filter<TData> {
  id: string;
  operator: FilterOperator;
  value: string | number | boolean | Date | string[] | null | undefined;
}

/**
 * Represents the available filter operators.
 */
export type FilterOperator =
  | "eq" // Equal
  | "neq" // Not equal
  | "ne" // Not equal (alias for neq)
  | "gt" // Greater than
  | "gte" // Greater than or equal
  | "lt" // Less than
  | "lte" // Less than or equal
  | "iLike" // Case-insensitive like
  | "notILike" // Case-insensitive not like
  | "isEmpty" // Is empty
  | "isNotEmpty" // Is not empty
  | "isBetween" // Is between
  | "isRelativeToToday" // Is relative to today
  | "and" // Logical AND
  | "or"; // Logical OR

/**
 * Represents an enriched chapter with additional metadata.
 */
export type EnrichedChapter = {
  _id: string;
  chapterTitle: string; // Ensure this property is included
  content: string;
  createdAt: string;
  updatedAt: string;
  storyTitle: string;
  authorName: string;
  wordCount?: number; // Optional
  isDraft?: boolean;  // Optional
};

export type ReactionType = "heart" | "thumbs_up" | "thumbs_down"; // Add more as needed