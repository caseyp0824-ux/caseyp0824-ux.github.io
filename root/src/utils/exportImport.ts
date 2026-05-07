import type { Item } from '../types';

// ====== EXPORT ======

export function exportToCSV(items: Item[]): void {
  const headers = ['Item ID', 'Location'];
  const rows = items.map(item => [item.itemId, item.location]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escape cells that contain commas, quotes, or newlines
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `item-locations-${formatDateFile()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(items: Item[]): void {
  const data = items.map(item => ({
    itemId: item.itemId,
    location: item.location,
    createdAt: item.createdAt,
  }));
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `item-locations-${formatDateFile()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ====== IMPORT ======

export interface ImportResult {
  success: boolean;
  count: number;
  message: string;
  items?: Array<{ itemId: string; location: string }>;
}

export function parseCSV(content: string): ImportResult {
  const lines = content
    .replace(/^\uFEFF/, '') // Remove BOM
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return { success: false, count: 0, message: 'CSV file is empty or has no data rows' };
  }

  // Detect if first line is a header
  const firstLine = lines[0];
  const hasHeader = firstLine.toLowerCase().includes('item') || firstLine.toLowerCase().includes('location');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const items: Array<{ itemId: string; location: string }> = [];
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parsed = parseCSVLine(line);
    if (parsed.length >= 2) {
      const itemId = parsed[0].trim();
      const location = parsed[1].trim();
      if (itemId && location) {
        items.push({ itemId, location });
      } else {
        errors.push(`Row ${i + (hasHeader ? 2 : 1)}: empty item ID or location`);
      }
    } else if (parsed.length === 1 && parsed[0].includes('\t')) {
      // Try tab-separated
      const tabParts = parsed[0].split('\t');
      if (tabParts.length >= 2) {
        const itemId = tabParts[0].trim();
        const location = tabParts[1].trim();
        if (itemId && location) {
          items.push({ itemId, location });
        }
      } else {
        errors.push(`Row ${i + (hasHeader ? 2 : 1)}: expected at least 2 columns, got ${parsed.length}`);
      }
    } else {
      errors.push(`Row ${i + (hasHeader ? 2 : 1)}: expected at least 2 columns, got ${parsed.length}`);
    }
  }

  if (items.length === 0) {
    return { success: false, count: 0, message: `No valid data found. ${errors.slice(0, 3).join('; ')}` };
  }

  return {
    success: true,
    count: items.length,
    message: errors.length > 0 ? `Imported ${items.length} items. ${errors.length} rows skipped.` : `Successfully imported ${items.length} items.`,
    items,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseJSON(content: string): ImportResult {
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, message: 'JSON must be an array of objects' };
    }

    const items: Array<{ itemId: string; location: string }> = [];
    const errors: string[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const obj = parsed[i];
      const itemId = obj.itemId || obj.itemID || obj['Item ID'] || obj.id || '';
      const location = obj.location || obj.Location || obj.loc || '';
      if (itemId && location) {
        items.push({ itemId: String(itemId).trim(), location: String(location).trim() });
      } else {
        errors.push(`Item ${i + 1}: missing itemId or location`);
      }
    }

    if (items.length === 0) {
      return { success: false, count: 0, message: `No valid data found. ${errors.slice(0, 3).join('; ')}` };
    }

    return {
      success: true,
      count: items.length,
      message: errors.length > 0 ? `Imported ${items.length} items. ${errors.length} rows skipped.` : `Successfully imported ${items.length} items.`,
      items,
    };
  } catch (e) {
    return { success: false, count: 0, message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function formatDateFile(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
