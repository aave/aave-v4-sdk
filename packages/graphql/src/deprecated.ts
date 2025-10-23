/**
 * @deprecated types from the graphql package
 * All types in this file are deprecated and will be removed in a future release.
 * Removal slated for week commencing 27th October 2025.
 */

import type {
  DecimalNumber,
  HealthFactorWithChange,
  PercentNumber,
  PercentNumberVariation,
  PercentNumberWithChange,
} from './fragments';
import type { ActivityItem } from './transactions';

/**
 * @deprecated Use {@link DecimalNumber} instead. Removal slated for week commencing 27th October 2025.
 */
export type DecimalValue = DecimalNumber;

/**
 * @deprecated Use {@link PercentNumber} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValue = PercentNumber;

/**
 * @deprecated Use {@link PercentNumberWithChange} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValueWithChange = PercentNumberWithChange;

/**
 * @deprecated Use {@link PercentNumberVariation} instead. Removal slated for week commencing 27th October 2025.
 */
export type PercentValueVariation = PercentNumberVariation;

/**
 * @deprecated Use {@link HealthFactorWithChange} instead. Removal slated for week commencing 27th October 2025.
 */
export type HealthFactorChange = HealthFactorWithChange;

/**
 * @deprecated Use {@link ActivityItem} instead. Removal slated for week commencing 27th October 2025.
 */

export type UserHistoryItem = ActivityItem;
/**
 * @deprecated Use {@link Date} instead. Removal slated for week commencing 27th October 2025.
 */
export type DateTime = Date;
