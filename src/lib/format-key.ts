// Format key names for display
export const formatKeyName = (key: string): string => {
  // Remove common prefixes
  let formatted = key
    .replace(/^public_circles_/i, '')
    .replace(/^_/, '');

  // Convert snake_case and camelCase to Title Case
  formatted = formatted
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  // Capitalize first letter of each word
  return formatted
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
