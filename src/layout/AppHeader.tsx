import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // 👈 sửa react-router-dom
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

import { navItems, othersItems } from "./AppSidebar"; // 👈 lấy menu từ Sidebar

interface Command {
  id: string;
  name: string;
  path: string;
}

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  // SEARCH states
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Gom tất cả route từ navItems + othersItems
  const extractCommands = (items: any[], prefix: string): Command[] =>
    items.flatMap((nav, idx) => {
      if (nav.subItems) {
        return nav.subItems.map((sub: any, sIdx: number) => ({
          id: `${prefix}-${idx}-${sIdx}`,
          name: sub.name,
          path: sub.path,
        }));
      }
      return nav.path
        ? [{ id: `${prefix}-${idx}`, name: nav.name, path: nav.path }]
        : [];
    });

  const allCommands: Command[] = [
    ...extractCommands(navItems, "main"),
    ...extractCommands(othersItems, "others"),
  ];

  // Sidebar toggle
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // Toggle app menu
  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // Search filter + sort
  useEffect(() => {
    let filtered = allCommands.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (a.name < b.name) return sortAsc ? -1 : 1;
      if (a.name > b.name) return sortAsc ? 1 : -1;
      return 0;
    });
    setFilteredCommands(filtered);
  }, [search, sortAsc]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Xử lý Enter trong search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredCommands.length > 0) {
      const first = filteredCommands[0];
      if (first.path) {
        navigate(first.path);
        setSearch("");
      }
    }
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        {/* LEFT AREA */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Toggle Sidebar */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-50 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              // Close (X) icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.22 7.28c-.29-.29-.29-.76 0-1.06.29-.29.76-.29 1.06 0L12 10.94l4.72-4.72c.29-.29.76-.29 1.06 0 .29.29.29.76 0 1.06L13.06 12l4.72 4.72c.29.29.29.76 0 1.06-.29.29-.76.29-1.06 0L12 13.06l-4.72 4.72c-.29.29-.76.29-1.06 0-.29-.29-.29-.76 0-1.06L10.94 12 6.22 7.28Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              // Hamburger icon
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M.58 1c0-.41.34-.75.75-.75h13.33c.41 0 .75.34.75.75s-.34.75-.75.75H1.33c-.41 0-.75-.34-.75-.75Zm0 10c0-.41.34-.75.75-.75h13.33c.41 0 .75.34.75.75s-.34.75-.75.75H1.33c-.41 0-.75-.34-.75-.75Zm.75-5.75c-.41 0-.75.34-.75.75s.34.75.75.75h6.67c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H1.33Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="lg:hidden">
            <img
              className="dark:hidden"
              src="./images/logo/logo.svg"
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src="./images/logo/logo-dark.svg"
              alt="Logo"
            />
          </Link>

          {/* Toggle Application Menu (mobile) */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-50 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 10.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S4.5 12.83 4.5 12s.67-1.5 1.5-1.5Zm12 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5Zm-6 1.5c0-.83.67-1.5 1.5-1.5S15 11.17 15 12s-.67 1.5-1.5 1.5S12 12.83 12 12Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* SEARCH */}
          <div className="hidden lg:block w-full max-w-md">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent pl-4 pr-12 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-gray-100 px-2 py-1 text-xs"
              >
                {sortAsc ? "↑" : "↓"}
              </button>

              {/* SEARCH DROPDOWN */}
              {search && (
                <ul className="absolute left-0 right-0 mt-1 max-h-60 overflow-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                  {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd) => (
                      <li
                        key={cmd.id}
                        onClick={() => {
                          if (cmd.path) {
                            navigate(cmd.path);
                            setSearch("");
                          }
                        }}
                        className={`cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          location.pathname === cmd.path
                            ? "font-semibold text-brand-500"
                            : ""
                        }`}
                      >
                        {cmd.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No results
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT AREA */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
