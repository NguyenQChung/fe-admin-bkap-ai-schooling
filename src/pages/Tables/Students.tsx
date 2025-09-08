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

interface Student {
  id: number;
  fullName: string;
  username: string;
  phone: string;
  birthdate: string;
  hobbies: string;
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

export default function Student() {
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [students, setStudents] = useState<Student[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const studentsPerPage = 10;

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
    fetch(`${API_URL}/students`, {
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
          console.log("✅ Dữ liệu students:", data);
          setStudents(data);
        } else if (data && Array.isArray(data.content)) {
          setStudents(data.content);
        } else {
          console.error("Unexpected API format:", data);
          setStudents([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching students:", err);
        setMessage({
          type: "error",
          text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu!"}`,
        });
      })
      .finally(() => setIsLoading(false));
  }, [API_URL, currentUser, navigate]);

  useEffect(() => {
    if (editingStudent && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingStudent]);

  // Tính toán phân trang
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xóa Student
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

        setIsSubmitting(true);
        const res = await fetch(`${API_URL}/students/${id}`, {
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

        setStudents((prev) => prev.filter((s) => s.id !== id));
        MySwal.fire("Đã xóa!", "Học sinh đã được xóa thành công.", "success");
      } catch (err) {
        const error = err as Error;
        console.error("❌ Lỗi khi xóa:", error.message);
        MySwal.fire("Lỗi", "Không thể xóa học sinh.", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Mở dialog chỉnh sửa
  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setMessage(null);
  };

  // Chuẩn hóa chuỗi để kiểm tra trùng lặp
  const normalizeString = (str: string): string => {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  };

  // Kiểm tra trùng lặp username
  const isDuplicateUsername = (username: string, currentId?: number) => {
    const normalizedInput = normalizeString(username);
    if (!normalizedInput) {
      return "Username không được để trống.";
    }
    const isDuplicate = students.some(
      (s) =>
        normalizeString(s.username) === normalizedInput && s.id !== currentId
    );
    return isDuplicate
      ? "Username này đã tồn tại. Vui lòng chọn username khác."
      : null;
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = async () => {
    if (!editingStudent || !currentUser) return;

    // Validate required fields
    if (!editingStudent.fullName.trim()) {
      setMessage({ type: "error", text: "⚠️ Họ tên không được để trống!" });
      return;
    }
    if (!editingStudent.username.trim()) {
      setMessage({ type: "error", text: "⚠️ Username không được để trống!" });
      return;
    }
    if (!editingStudent.phone.trim()) {
      setMessage({ type: "error", text: "⚠️ Điện thoại không được để trống!" });
      return;
    }
    if (!editingStudent.birthdate) {
      setMessage({ type: "error", text: "⚠️ Ngày sinh không được để trống!" });
      return;
    }

    const duplicateMessage = isDuplicateUsername(
      editingStudent.username,
      editingStudent.id
    );
    if (duplicateMessage) {
      setMessage({ type: "error", text: duplicateMessage });
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
        fullName: editingStudent.fullName.trim(),
        username: editingStudent.username.trim(),
        phone: editingStudent.phone.trim(),
        birthdate: editingStudent.birthdate,
        hobbies: editingStudent.hobbies.trim(),
      };
      console.log("📤 Gửi payload:", payload);

      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
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
          text: `❌ Lỗi: ${errorData.message || "Cập nhật thất bại"}`,
        });
        return;
      }

      const updatedStudent = await res.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
      );
      setEditingStudent(null);
      MySwal.fire("Thành công", "Cập nhật học sinh thành công", "success");
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi gửi request:", error.message);
      MySwal.fire("Lỗi", "Không thể cập nhật học sinh", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

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
        title="Danh sách học sinh"
        description="Quản lý học sinh trong hệ thống"
      />
      <PageBreadcrumb pageTitle="Students" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Học sinh">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-student")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Học Sinh
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
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày sinh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sở thích
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((s) => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{s.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(s.birthdate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {s.hobbies}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                              disabled={isSubmitting}
                            >
                              <Edit className="mr-1 h-4 w-4" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="mr-1 h-4 w-4" /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        Không có học sinh nào
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
                    disabled={isLoading || isSubmitting}
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
        open={!!editingStudent}
        onOpenChange={() => {
          setEditingStudent(null);
          setMessage(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Học Sinh</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin học sinh. Vui lòng đảm bảo username là duy
              nhất.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ tên
              </label>
              <input
                ref={inputRef}
                type="text"
                value={editingStudent?.fullName || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    fullName: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={editingStudent?.username || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    username: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Điện thoại
              </label>
              <input
                type="tel"
                value={editingStudent?.phone || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    phone: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày sinh
              </label>
              <input
                type="date"
                value={editingStudent?.birthdate || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    birthdate: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sở thích
              </label>
              <input
                type="text"
                value={editingStudent?.hobbies || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    hobbies: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingStudent(null);
                setMessage(null);
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
