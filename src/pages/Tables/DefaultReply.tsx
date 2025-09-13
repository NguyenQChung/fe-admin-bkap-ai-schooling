import { useEffect, useState, useRef } from "react";
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

interface DefaultReply {
  id: number;
  replyText: string;
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
    setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
    return null;
  }
  const jwtToken = getJwtToken(token);
  if (!jwtToken) {
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
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${
          errorData.message || "Không thể lấy thông tin người dùng"
        }`,
      });
      if (response.status === 401) localStorage.removeItem("token");
      return null;
    }
    const userData = await response.json();
    return {
      id: userData.id,
      username: userData.username || userData.email,
      email: userData.email,
    };
  } catch (err) {
    setMessage({
      type: "error",
      text: `❌ Lỗi: ${(err as Error).message || "Không thể kết nối server!"}`,
    });
    return null;
  }
};

export default function DefaultReplyPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [defaultReplies, setDefaultReplies] = useState<DefaultReply[]>([]);
  const [filteredReplies, setFilteredReplies] = useState<DefaultReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [editingDefaultReply, setEditingDefaultReply] =
    useState<DefaultReply | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
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
      fetch(`${API_URL}/default-replies`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const replies = Array.isArray(data) ? data : data.content || [];
          setDefaultReplies(replies);
          setFilteredReplies(replies);
        })
        .catch((err) => {
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  useEffect(() => {
    if (editingDefaultReply && inputRef.current) inputRef.current.focus();
  }, [editingDefaultReply]);

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
        const jwtToken = getJwtToken(token);
        if (!jwtToken) {
          navigate("/signin");
          return;
        }
        setIsLoading(true);
        const res = await fetch(`${API_URL}/default-replies/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error("Xóa thất bại");
        setDefaultReplies((prev) => prev.filter((r) => r.id !== id));
        setFilteredReplies((prev) => prev.filter((r) => r.id !== id));
        MySwal.fire("Thành công", "Xóa default reply thành công", "success");
      } catch (err) {
        MySwal.fire("Lỗi", "Không thể xóa default reply", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (defaultReply: DefaultReply) => {
    setEditingDefaultReply(defaultReply);
    setDuplicateWarning(null);
  };

  const checkDuplicateReplyText = (replyText: string, currentId?: number) => {
    const normalizedInput = replyText.trim().toLowerCase();
    if (!normalizedInput) return "Từ khóa không được để trống.";
    return defaultReplies.some(
      (reply) =>
        reply.replyText.trim().toLowerCase() === normalizedInput &&
        reply.id !== currentId
    )
      ? "Từ khóa này đã tồn tại. Vui lòng chọn từ khóa khác."
      : null;
  };

  const handleSaveEdit = async () => {
    if (!editingDefaultReply || !currentUser) return;
    const duplicateMessage = checkDuplicateReplyText(
      editingDefaultReply.replyText,
      editingDefaultReply.id
    );
    if (duplicateMessage) {
      setDuplicateWarning(duplicateMessage);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const jwtToken = getJwtToken(token);
      if (!jwtToken) {
        navigate("/signin");
        return;
      }
      setIsLoading(true);
      const payload = {
        replyText: editingDefaultReply.replyText.trim(),
        createdById: currentUser.id,
      };
      const res = await fetch(
        `${API_URL}/default-replies/${editingDefaultReply.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Cập nhật thất bại");
      const updatedReply = await res.json();
      setDefaultReplies((prev) =>
        prev.map((r) => (r.id === updatedReply.id ? updatedReply : r))
      );
      setFilteredReplies((prev) =>
        prev.map((r) => (r.id === updatedReply.id ? updatedReply : r))
      );
      setEditingDefaultReply(null);
      MySwal.fire("Thành công", "Cập nhật default reply thành công", "success");
    } catch (err) {
      MySwal.fire("Lỗi", "Không thể cập nhật default reply", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const sortOptions: SortOption<DefaultReply>[] = [
    {
      label: "Từ khóa A-Z",
      value: "replyTextAsc",
      sorter: (a: DefaultReply, b: DefaultReply) =>
        a.replyText.localeCompare(b.replyText),
    },
    {
      label: "Từ khóa Z-A",
      value: "replyTextDesc",
      sorter: (a: DefaultReply, b: DefaultReply) =>
        b.replyText.localeCompare(a.replyText),
    },
    {
      label: "Người tạo A-Z",
      value: "createdByAsc",
      sorter: (a: DefaultReply, b: DefaultReply) => {
        const nameA = a.createdBy?.username || a.createdBy?.email || "";
        const nameB = b.createdBy?.username || b.createdBy?.email || "";
        return nameA.localeCompare(nameB);
      },
    },
    {
      label: "Người tạo Z-A",
      value: "createdByDesc",
      sorter: (a: DefaultReply, b: DefaultReply) => {
        const nameA = a.createdBy?.username || a.createdBy?.email || "";
        const nameB = b.createdBy?.username || b.createdBy?.email || "";
        return nameB.localeCompare(nameB);
      },
    },
  ];

  const getSearchField = (item: DefaultReply) =>
    `${item.replyText} ${item.createdBy?.username || ""} ${
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
        title="Danh sách Default Replies"
        description="Trang danh sách Default Replies"
      />
      <PageBreadcrumb pageTitle="Danh sách Default Replies" />

      <div className="space-y-6">
        <ComponentCard title="">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-default-reply")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Default Reply
            </Button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md border ${
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
                data={defaultReplies}
                onChange={setFilteredReplies}
                getSearchField={getSearchField}
                sortOptions={sortOptions}
              />
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        STT
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Từ khóa
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Người tạo
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReplies.map((reply) => (
                      <tr
                        key={reply.id}
                        className="border-t dark:border-gray-600"
                      >
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {reply.id}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {reply.replyText}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {reply.createdBy?.username ||
                            reply.createdBy?.email ||
                            "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(reply)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 flex items-center"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ComponentCard>
      </div>

      <Dialog
        open={!!editingDefaultReply}
        onOpenChange={() => setEditingDefaultReply(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Default Reply</DialogTitle>
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
                value={editingDefaultReply?.replyText || ""}
                onChange={(e) => {
                  const newReplyText = e.target.value;
                  setEditingDefaultReply({
                    ...editingDefaultReply!,
                    replyText: newReplyText,
                  });
                  setDuplicateWarning(
                    checkDuplicateReplyText(
                      newReplyText,
                      editingDefaultReply?.id
                    )
                  );
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập từ khóa..."
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
                  editingDefaultReply?.createdBy
                    ? editingDefaultReply.createdBy.username ||
                      editingDefaultReply.createdBy.email ||
                      "Unknown"
                    : "Unknown"
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDefaultReply(null)}
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
