import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import SearchSortTable, {
  SortOption,
} from "../../components/tables/SearchSortTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../components/ui/dialog";
import Button from "../../components/ui/button/Button";

interface ForbiddenKeyword {
  id: number;
  keyword: string;
  createdBy: {
    id: number;
    username: string | null;
    email: string | null;
  } | null;
}

interface User {
  id: number;
  username: string | null;
  email: string;
}

const getJwtToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const parsedToken = JSON.parse(token);
    return parsedToken.token || token;
  } catch (e) {
    return token;
  }
};

const getCurrentUser = async (
  setMessage: (
    message: { type: "error" | "success"; text: string } | null
  ) => void
): Promise<User | null> => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ Không tìm thấy token. Vui lòng đăng nhập lại.");
    setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
    return null;
  }

  const jwtToken = getJwtToken(token);
  if (!jwtToken) {
    console.error("❌ Token không hợp lệ.");
    setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
    return null;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/auth/me`,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        `❌ Lỗi khi lấy user, status: ${response.status} ${response.statusText}`,
        errorData
      );
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${
          errorData.message || "Không thể lấy thông tin người dùng"
        }`,
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        setMessage({
          type: "error",
          text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
        });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const userData = await response.json();
    console.log("✅ Lấy thông tin user thành công");
    return {
      id: userData.id,
      username: userData.username || userData.email,
      email: userData.email,
    };
  } catch (err) {
    const error = err as Error;
    console.error("❌ Lỗi khi lấy thông tin user:", error.message);
    setMessage({
      type: "error",
      text: `❌ Lỗi: ${error.message || "Không thể kết nối server!"}`,
    });
    return null;
  }
};

export default function ForbiddenKeyword() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [forbiddenKeywords, setForbiddenKeywords] = useState<
    ForbiddenKeyword[]
  >([]);
  const [filteredKeywords, setFilteredKeywords] = useState<ForbiddenKeyword[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [editingForbiddenKeyword, setEditingForbiddenKeyword] =
    useState<ForbiddenKeyword | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const forbiddenKeywordsPerPage = 10;
  const MySwal = withReactContent(Swal);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    setIsLoading(true);
    getCurrentUser(setMessage).then((user) => {
      setIsLoading(false);
      if (!user) {
        navigate("/signin");
        return;
      }
      setCurrentUser(user);

      const token = localStorage.getItem("token");
      const jwtToken = getJwtToken(token);
      if (!jwtToken) {
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }

      fetch(`${API_URL}/forbidden-keywords`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("token");
              setMessage({
                type: "error",
                text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
              });
              navigate("/signin");
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("✅ Tải dữ liệu forbidden-keywords thành công");
            setForbiddenKeywords(data);
            setFilteredKeywords(data);
          } else if (data && Array.isArray(data.content)) {
            console.log("✅ Tải dữ liệu forbidden-keywords thành công");
            setForbiddenKeywords(data.content);
            setFilteredKeywords(data.content);
          } else {
            console.error("Unexpected API format:", data);
            setForbiddenKeywords([]);
            setFilteredKeywords([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching forbidden keywords:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  useEffect(() => {
    if (editingForbiddenKeyword && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingForbiddenKeyword]);

  // Pagination
  const indexOfLastKeyword = currentPage * forbiddenKeywordsPerPage;
  const indexOfFirstKeyword = indexOfLastKeyword - forbiddenKeywordsPerPage;
  const currentForbiddenKeywords = filteredKeywords.slice(
    indexOfFirstKeyword,
    indexOfLastKeyword
  );
  const totalPages = Math.ceil(
    filteredKeywords.length / forbiddenKeywordsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Delete ForbiddenKeyword
  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Bạn có chắc muốn xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
          navigate("/signin");
          return;
        }

        const jwtToken = getJwtToken(token);
        if (!jwtToken) {
          setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
          navigate("/signin");
          return;
        }

        setIsLoading(true);
        const res = await fetch(`${API_URL}/forbidden-keywords/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("❌ Lỗi từ server:", errorData);
          if (res.status === 401) {
            localStorage.removeItem("token");
            setMessage({
              type: "error",
              text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
            });
            navigate("/signin");
          }
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${errorData.message || "Xóa thất bại"}`,
          });
          return;
        }

        setForbiddenKeywords((prev) => prev.filter((r) => r.id !== id));
        setFilteredKeywords((prev) => prev.filter((r) => r.id !== id));
        console.log("✅ Xóa forbidden keyword thành công");
        MySwal.fire(
          "Thành công",
          "Xóa forbidden keyword thành công",
          "success"
        );
      } catch (err) {
        const error = err as Error;
        console.error("❌ Lỗi khi xóa:", error.message);
        MySwal.fire(
          "Lỗi",
          `Không thể xóa forbidden keyword: ${error.message}`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const handleEdit = (forbiddenKeyword: ForbiddenKeyword) => {
    setEditingForbiddenKeyword(forbiddenKeyword);
    setDuplicateWarning(null);
  };

  // Check duplicate keyword
  const checkDuplicateKeyword = (keyword: string, currentId?: number) => {
    const normalizedInput = keyword.trim().toLowerCase().replace(/\s+/g, " ");
    if (!normalizedInput) {
      return "Từ khóa không được để trống.";
    }
    const isDuplicate = forbiddenKeywords.some(
      (kw) =>
        kw.keyword.trim().toLowerCase().replace(/\s+/g, " ") ===
          normalizedInput && kw.id !== currentId
    );
    return isDuplicate
      ? "Từ khóa này đã tồn tại. Vui lòng chọn từ khóa khác."
      : null;
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingForbiddenKeyword || !currentUser) return;

    const duplicateMessage = checkDuplicateKeyword(
      editingForbiddenKeyword.keyword,
      editingForbiddenKeyword.id
    );
    if (duplicateMessage) {
      setDuplicateWarning(duplicateMessage);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
        navigate("/signin");
        return;
      }

      const jwtToken = getJwtToken(token);
      if (!jwtToken) {
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }

      setIsLoading(true);
      const payload = {
        keyword: editingForbiddenKeyword.keyword.trim(),
      };
      const res = await fetch(
        `${API_URL}/forbidden-keywords/${editingForbiddenKeyword.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Lỗi từ server:", errorData);
        if (res.status === 401) {
          localStorage.removeItem("token");
          setMessage({
            type: "error",
            text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
          });
          navigate("/signin");
        }
        setMessage({
          type: "error",
          text: `❌ Lỗi: ${errorData.message || "Cập nhật thất bại"}`,
        });
        return;
      }

      const updatedKeyword = await res.json();
      setForbiddenKeywords((prev) =>
        prev.map((r) => (r.id === updatedKeyword.id ? updatedKeyword : r))
      );
      setFilteredKeywords((prev) =>
        prev.map((r) => (r.id === updatedKeyword.id ? updatedKeyword : r))
      );
      setEditingForbiddenKeyword(null);
      setDuplicateWarning(null);
      console.log("✅ Cập nhật forbidden keyword thành công");
      MySwal.fire(
        "Thành công",
        "Cập nhật forbidden keyword thành công",
        "success"
      );
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi gửi request:", error.message);
      MySwal.fire(
        "Lỗi",
        `Không thể cập nhật forbidden keyword: ${error.message}`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Define sort options for SearchSortTable
  const sortOptions: SortOption<ForbiddenKeyword>[] = [
    {
      label: "Từ khóa A-Z",
      value: "keywordAsc",
      sorter: (a: ForbiddenKeyword, b: ForbiddenKeyword) =>
        a.keyword.localeCompare(b.keyword),
    },
    {
      label: "Từ khóa Z-A",
      value: "keywordDesc",
      sorter: (a: ForbiddenKeyword, b: ForbiddenKeyword) =>
        b.keyword.localeCompare(a.keyword),
    },
    {
      label: "Người tạo A-Z",
      value: "createdByAsc",
      sorter: (a: ForbiddenKeyword, b: ForbiddenKeyword) => {
        const nameA = a.createdBy?.username || a.createdBy?.email || "";
        const nameB = b.createdBy?.username || b.createdBy?.email || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      label: "Người tạo Z-A",
      value: "createdByDesc",
      sorter: (a: ForbiddenKeyword, b: ForbiddenKeyword) => {
        const nameA = a.createdBy?.username || a.createdBy?.email || "";
        const nameB = b.createdBy?.username || b.createdBy?.email || "";
        return nameB.localeCompare(nameA);
      },
    },
  ];

  // Define search field for SearchSortTable
  const getSearchField = (item: ForbiddenKeyword) =>
    `${item.keyword} ${item.createdBy?.username || ""} ${
      item.createdBy?.email || ""
    }`;

  if (!currentUser) {
    return (
      <div className="text-center text-red-600">
        Vui lòng đăng nhập để sử dụng tính năng này!
        <button
          onClick={() => navigate("/signin")}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Danh sách Từ khóa Cấm | TailAdmin - Next.js Admin Dashboard Template"
        description="Trang danh sách Từ khóa Cấm cho TailAdmin"
      />
      <PageBreadcrumb pageTitle="Danh sách Từ khóa Cấm" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Từ khóa Cấm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-forbidden-keyword")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Từ khóa Cấm
            </Button>
          </div>
          {message && (
            <div
              className={`p-2 rounded-md border ${
                message.type === "error"
                  ? "text-red-700 bg-red-100 border-red-300"
                  : "text-green-700 bg-green-100 border-green-300"
              }`}
            >
              {message.text}
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <>
              <SearchSortTable
                data={forbiddenKeywords}
                onChange={setFilteredKeywords}
                getSearchField={getSearchField}
                sortOptions={sortOptions}
              />
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Từ khóa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Người tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {currentForbiddenKeywords.length > 0 ? (
                      currentForbiddenKeywords.map((keyword, index) => (
                        <tr key={keyword.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {indexOfFirstKeyword + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {keyword.keyword}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {keyword.createdBy
                              ? keyword.createdBy.username ||
                                keyword.createdBy.email ||
                                "Unknown User"
                              : "Unknown User"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(keyword)}
                                className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                disabled={isLoading}
                              >
                                <Edit className="mr-1 h-4 w-4" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(keyword.id)}
                                className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
                                disabled={isLoading}
                              >
                                <Trash2 className="mr-1 h-4 w-4" /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-sm text-gray-900 dark:text-gray-100"
                        >
                          Không có từ khóa cấm nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white"
                        : "bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={isLoading}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </ComponentCard>
      </div>

      <Dialog
        open={!!editingForbiddenKeyword}
        onOpenChange={() => {
          setEditingForbiddenKeyword(null);
          setDuplicateWarning(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Từ khóa Cấm</DialogTitle>
            <DialogDescription>
              Vui lòng đảm bảo từ khóa là duy nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Từ khóa
              </label>
              <input
                ref={inputRef}
                type="text"
                value={editingForbiddenKeyword?.keyword || ""}
                onChange={(e) => {
                  const newKeyword = e.target.value;
                  setEditingForbiddenKeyword({
                    ...editingForbiddenKeyword!,
                    keyword: newKeyword,
                  });
                  setDuplicateWarning(
                    checkDuplicateKeyword(
                      newKeyword,
                      editingForbiddenKeyword?.id
                    )
                  );
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập từ khóa cấm..."
                disabled={isLoading}
                required
              />
              {duplicateWarning && (
                <p className="text-red-500 text-sm mt-1">{duplicateWarning}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Người tạo
              </label>
              <input
                type="text"
                value={
                  editingForbiddenKeyword?.createdBy
                    ? editingForbiddenKeyword.createdBy.username ||
                      editingForbiddenKeyword.createdBy.email ||
                      "Unknown User"
                    : "Unknown User"
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingForbiddenKeyword(null);
                setDuplicateWarning(null);
              }}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isLoading || !!duplicateWarning}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
