import { useState, useEffect } from "react";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
import UserDropdown from "./UserDropdown";
import { Link } from "react-router";

// Dummy data để search + sort
interface Command {
  id: number;
  name: string;
}

const commands: Command[] = [
  { id: 1, name: "Open Dashboard" },
  { id: 2, name: "View Profile" },
  { id: 3, name: "Settings" },
  { id: 4, name: "Logout" },
];

interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClick, onToggle }) => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  // SEARCH & SORT STATES
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // FILTER + SORT DATA
  useEffect(() => {
    let filtered = commands.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (a.name < b.name) return sortAsc ? -1 : 1;
      if (a.name > b.name) return sortAsc ? 1 : -1;
      return 0;
    });
    setFilteredCommands(filtered);
  }, [search, sortAsc]);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="block w-10 h-10 text-gray-500 lg:hidden dark:text-gray-400"
            onClick={onToggle}
          >
            {/* Hamburger Icon */}
            <svg
              className="block"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* SEARCH FORM */}
          <div className="hidden lg:block w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search commands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <ul className="absolute left-0 right-0 mt-1 max-h-60 overflow-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd) => (
                      <li
                        key={cmd.id}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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

          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggleButton />
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
