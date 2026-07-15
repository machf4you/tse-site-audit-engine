import { useState, useMemo } from 'react';

/**
 * Reusable hook to handle table sorting logic for all TSE platform modules.
 * Supporting text, numbers, dates, stable sorting fallbacks, custom sorting, and selectors.
 * Empty values are always sorted last.
 *
 * @param {Array} items - The array of items to sort
 * @param {Object} initialConfig - Initial sort settings (e.g. { field: 'name', direction: 'asc' })
 * @param {Object} options - Configuration options (valueSelectors, customSorts)
 */
export const useSortableTable = (items = [], initialConfig = null, options = {}) => {
  const [sortField, setSortField] = useState(initialConfig?.field || null);
  const [sortDirection, setSortDirection] = useState(initialConfig?.direction || 'asc');

  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    // Create a map to preserve stable sorting using the original index
    const originalIndexMap = new Map(items.map((item, idx) => [item, idx]));

    const sorted = [...items].sort((a, b) => {
      // 1. Resolve sorting keys/values
      let valA = a;
      let valB = b;

      // Extract values via selector or property path
      if (typeof options.valueSelectors?.[sortField] === 'function') {
        valA = options.valueSelectors[sortField](a);
        valB = options.valueSelectors[sortField](b);
      } else if (sortField) {
        valA = a[sortField];
        valB = b[sortField];
      }

      // 2. Empty values check - empty values always sort last regardless of direction
      const isAEmpty = valA === null || valA === undefined || valA === "";
      const isBEmpty = valB === null || valB === undefined || valB === "";

      if (isAEmpty && isBEmpty) return 0;
      if (isAEmpty) return 1;  // valA is empty, place it after valB
      if (isBEmpty) return -1; // valB is empty, place it after valA

      // 3. Perform comparison (custom compare or default compare)
      let comp = 0;
      if (typeof options.customSorts?.[sortField] === 'function') {
        comp = options.customSorts[sortField](valA, valB, a, b);
      } else {
        comp = defaultCompare(valA, valB);
      }

      // 4. Stable sort fallback if values are equal (uses original indices)
      if (comp === 0) {
        const idxA = originalIndexMap.get(a) ?? 0;
        const idxB = originalIndexMap.get(b) ?? 0;
        return idxA - idxB;
      }

      return sortDirection === 'asc' ? comp : -comp;
    });

    return sorted;
  }, [items, sortField, sortDirection, options]);

  const requestSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  return {
    sortedItems,
    sortField,
    sortDirection,
    requestSort,
    getSortIndicator,
  };
};

/**
 * Generic comparator supporting text, numeric, and date sorting.
 */
const defaultCompare = (a, b) => {
  // Check if they are numbers
  const numA = Number(a);
  const numB = Number(b);
  const isANum = !isNaN(numA) && typeof a !== 'boolean' && String(a).trim() !== '';
  const isBNum = !isNaN(numB) && typeof b !== 'boolean' && String(b).trim() !== '';

  if (isANum && isBNum) {
    return numA - numB;
  }

  // Check if they are date-like strings
  const isADateString = typeof a === 'string' && (
    /^\d{4}-\d{2}-\d{2}/.test(a) || 
    /^[A-Za-z]{3} \d{1,2}, \d{4}/.test(a) ||
    /^\d{1,2} [A-Za-z]{3,10} \d{4}/.test(a) ||
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(a)
  );
  const isBDateString = typeof b === 'string' && (
    /^\d{4}-\d{2}-\d{2}/.test(b) || 
    /^[A-Za-z]{3} \d{1,2}, \d{4}/.test(b) ||
    /^\d{1,2} [A-Za-z]{3,10} \d{4}/.test(b) ||
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(b)
  );

  if (isADateString || isBDateString) {
    const timeA = Date.parse(a);
    const timeB = Date.parse(b);
    if (!isNaN(timeA) && !isNaN(timeB)) {
      return timeA - timeB;
    }
  }

  // Fallback to text sort
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return strA.localeCompare(strB);
};
