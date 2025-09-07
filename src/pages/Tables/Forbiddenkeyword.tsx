import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Edit, Trash2, Plus } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
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
      `${import.meta.env.VITE_API_URL || ""}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
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
    console.log("✅ User lấy được:", userData);
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
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [forbiddenKeywords, setForbiddenKeywords] = useState<
    ForbiddenKeyword[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const forbiddenKeywordsPerPage = 10;
  const [editingForbiddenKeyword, setEditingForbiddenKeyword] =
    useState<ForbiddenKeyword | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("🔍 Kiểm tra token:", localStorage.getItem("token"));
    setIsLoading(true);
    getCurrentUser(setMessage).then((user) => {
      setIsLoading(false);
      if (!user) {
        navigate("/signin");
        return;
      }
      setCurrentUser(user);
    });
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

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
    fetch(`${API_URL}/forbidden-keywords`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
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
          console.log("✅ Dữ liệu forbidden-keywords:", data);
          setForbiddenKeywords(data);
        } else if (data && Array.isArray(data.content)) {
          setForbiddenKeywords(data.content);
        } else {
          console.error("Unexpected API format:", data);
          setForbiddenKeywords([]);
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
  }, [API_URL, currentUser, navigate]);

  useEffect(() => {
    if (editingForbiddenKeyword && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingForbiddenKeyword]);

  // Tính toán phân trang
  const indexOfLastKeyword = currentPage * forbiddenKeywordsPerPage;
  const indexOfFirstKeyword = indexOfLastKeyword - forbiddenKeywordsPerPage;
  const currentForbiddenKeywords = forbiddenKeywords.slice(
    indexOfFirstKeyword,
    indexOfLastKeyword
  );
  const totalPages = Math.ceil(
    forbiddenKeywords.length / forbiddenKeywordsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xóa ForbiddenKeyword
  const MySwal = withReactContent(Swal);
  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Bạn có chắc muốn xoá?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
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
        await axios.delete(`${API_URL}/forbidden-keywords/${id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        setForbiddenKeywords((prev) => prev.filter((r) => r.id !== id));
        MySwal.fire(
          "Đã xoá!",
          "Forbidden keyword đã được xoá thành công.",
          "success"
        );
      } catch (err: any) {
        MySwal.fire("Thất bại", "Không thể xoá forbidden keyword.", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Mở modal edit
  const handleEdit = (forbiddenKeyword: ForbiddenKeyword) => {
    setEditingForbiddenKeyword(forbiddenKeyword);
    setDuplicateWarning(null);
  };

  // Kiểm tra trùng lặp keyword
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

  // Lưu thay đổi
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

      const payload = {
        keyword: editingForbiddenKeyword.keyword,
      };

      setIsLoading(true);
      const res = await axios.put(
        `${API_URL}/forbidden-keywords/${editingForbiddenKeyword.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      setForbiddenKeywords((prev) =>
        prev.map((r) => (r.id === editingForbiddenKeyword.id ? res.data : r))
      );
      setEditingForbiddenKeyword(null);
      setDuplicateWarning(null);
      MySwal.fire(
        "Thành công",
        "Cập nhật forbidden keyword thành công",
        "success"
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Không thể cập nhật";
      MySwal.fire("Lỗi", errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

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
        title="Forbidden Keywords Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is Forbidden Keywords Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Forbidden Keywords" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Forbidden Keywords">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-forbidden-keyword")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Forbidden Keyword
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentForbiddenKeywords.length > 0 ? (
                    currentForbiddenKeywords.map((keyword, index) => (
                      <tr key={keyword.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {indexOfFirstKeyword + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {keyword.keyword}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {keyword.createdBy
                            ? keyword.createdBy.username ||
                              keyword.createdBy.email ||
                              "Unknown User"
                            : "Unknown User"}
                        </td>
                        <td className="px-2 py-4 text-left">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(keyword)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                              disabled={isLoading}
                            >
                              <Edit />
                            </button>
                            <button
                              onClick={() => handleDelete(keyword.id)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                              disabled={isLoading}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Không có forbidden keyword nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white"
                        : "bg-white text-blue-500"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Forbidden Keyword</DialogTitle>
            <DialogDescription>
              Chỉnh sửa nội dung của forbidden keyword. Vui lòng đảm bảo từ khóa
              là duy nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Keyword
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
                className="w-full border rounded px-3 py-2"
                disabled={isLoading}
              />
              {duplicateWarning && (
                <p className="text-red-500 text-sm mt-1">{duplicateWarning}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                className="w-full border rounded px-3 py-2 bg-gray-100"
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
