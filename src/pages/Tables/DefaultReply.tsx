import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Edit, Trash2, Plus } from "lucide-react";
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

export default function DefaultReply() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [defaultReplies, setDefaultReplies] = useState<DefaultReply[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const defaultRepliesPerPage = 10;
  const [editingDefaultReply, setEditingDefaultReply] =
    useState<DefaultReply | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

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

      fetch(`${API_URL}/default-replies`, {
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
            console.log("✅ Tải dữ liệu default-replies thành công");
            setDefaultReplies(data);
          } else if (data && Array.isArray(data.content)) {
            console.log("✅ Tải dữ liệu default-replies thành công");
            setDefaultReplies(data.content);
          } else {
            console.error("Unexpected API format:", data);
            setDefaultReplies([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching default replies:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  useEffect(() => {
    if (editingDefaultReply && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingDefaultReply]);

  // Pagination
  const indexOfLastDefaultReply = currentPage * defaultRepliesPerPage;
  const indexOfFirstDefaultReply =
    indexOfLastDefaultReply - defaultRepliesPerPage;
  const currentDefaultReplies = defaultReplies.slice(
    indexOfFirstDefaultReply,
    indexOfLastDefaultReply
  );
  const totalPages = Math.ceil(defaultReplies.length / defaultRepliesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Delete DefaultReply
  const MySwal = withReactContent(Swal);
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
        const res = await fetch(`${API_URL}/default-replies/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
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

        setDefaultReplies((prev) => prev.filter((r) => r.id !== id));
        MySwal.fire("Thành công", "Xóa default reply thành công", "success");
      } catch (err) {
        const error = err as Error;
        console.error("❌ Lỗi khi xóa:", error.message);
        MySwal.fire(
          "Lỗi",
          `Không thể xóa default reply: ${error.message}`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const handleEdit = (defaultReply: DefaultReply) => {
    setEditingDefaultReply(defaultReply);
    setDuplicateWarning(null);
  };

  // Check duplicate replyText
  const checkDuplicateReplyText = (replyText: string, currentId?: number) => {
    const normalizedInput = replyText.trim().toLowerCase();
    if (!normalizedInput) {
      return "Từ khóa không được để trống.";
    }
    const isDuplicate = defaultReplies.some(
      (reply) =>
        reply.replyText.trim().toLowerCase() === normalizedInput &&
        reply.id !== currentId
    );
    return isDuplicate
      ? "Từ khóa này đã tồn tại. Vui lòng chọn từ khóa khác."
      : null;
  };

  // Save edit
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
        replyText: editingDefaultReply.replyText.trim(),
        createdById: currentUser.id,
      };
      console.log(
        "📤 Yêu cầu PUT tới:",
        `${API_URL}/default-replies/${editingDefaultReply.id}`
      );
      console.log("📤 Payload:", JSON.stringify(payload, null, 2));
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

      const updatedReply = await res.json();
      setDefaultReplies((prev) =>
        prev.map((r) => (r.id === updatedReply.id ? updatedReply : r))
      );
      setEditingDefaultReply(null);
      setDuplicateWarning(null);
      MySwal.fire("Thành công", "Cập nhật default reply thành công", "success");
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi gửi request:", error.message);
      MySwal.fire(
        "Lỗi",
        `Không thể cập nhật default reply: ${error.message}`,
        "error"
      );
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
        title="Danh sách Default Replies | TailAdmin - Next.js Admin Dashboard Template"
        description="Trang danh sách Default Replies cho TailAdmin"
      />
      <PageBreadcrumb pageTitle="Danh sách Default Replies" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Default Replies">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-default-reply")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Default Reply
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
                      Từ khóa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDefaultReplies.length > 0 ? (
                    currentDefaultReplies.map((reply, index) => (
                      <tr key={reply.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {indexOfFirstDefaultReply + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reply.replyText}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reply.createdBy
                            ? reply.createdBy.username ||
                              reply.createdBy.email ||
                              "Unknown User"
                            : "Unknown User"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(reply)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                              disabled={isLoading}
                            >
                              <Edit className="mr-1 h-4 w-4" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
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
                      <td colSpan={4} className="text-center py-4">
                        Không có default reply nào
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
        open={!!editingDefaultReply}
        onOpenChange={() => {
          setEditingDefaultReply(null);
          setDuplicateWarning(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Default Reply</DialogTitle>
            <DialogDescription>
              Chỉnh sửa nội dung của default reply. Vui lòng đảm bảo từ khóa là
              duy nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                className="w-full border rounded px-3 py-2"
                placeholder="Nhập từ khóa..."
                disabled={isLoading}
                required
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
                  editingDefaultReply?.createdBy
                    ? editingDefaultReply.createdBy.username ||
                      editingDefaultReply.createdBy.email ||
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
                setEditingDefaultReply(null);
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
