import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";

// Export SortOption để sử dụng ở các file khác
export type SortOption<T> = {
  label: string;
  value: string;
  sorter: (a: T, b: T) => number;
};

type SearchSortTableProps<T> = {
  data: T[];
  onChange: (filtered: T[]) => void;
  getSearchField: (item: T) => string;
  sortOptions: SortOption<T>[];
};

export default function SearchSortTable<T>({
  data,
  onChange,
  getSearchField,
  sortOptions,
}: SearchSortTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("");

  // Debounced search và sort để tối ưu hiệu suất
  useEffect(() => {
    const timer = setTimeout(() => {
      let result = [...data];
      if (query) {
        result = result.filter((item) =>
          getSearchField(item).toLowerCase().includes(query.toLowerCase())
        );
      }
      if (sort) {
        const sorter = sortOptions.find((opt) => opt.value === sort)?.sorter;
        if (sorter) result.sort(sorter);
      }
      onChange(result);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, sort, data, onChange, getSearchField, sortOptions]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Ô tìm kiếm */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Dropdown sắp xếp */}
      <div className="relative w-full sm:w-48">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer transition-all"
        >
          <option value="">Sắp xếp</option>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
