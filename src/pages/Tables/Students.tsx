import React, { useState, useEffect, useRef } from "react";
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
} from "../../components/ui/dialog";
import Button from "../../components/ui/button/Button";
import SearchSortTable, {
  SortOption,
} from "../../components/tables/SearchSortTable";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface Class {
  id: number;
  name: string;
}

interface Student {
  id: number;
  fullName: string;
  username: string;
  defaultPassword: string;
  code: string;
  classEntity: Class;
  email: string | null;
  phone: string;
  hobbies: string;
  isActive: boolean;
  birthdate: string;
  createdAt: string;
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

export default function Student() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    phone?: string;
  }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const studentsPerPage = 10;
  const inputRef = useRef<HTMLInputElement>(null);
  const MySwal = withReactContent(Swal);

  // Debounced values for validation
  const debouncedUsername = useDebounce(editingStudent?.username || "", 500);
  const debouncedPhone = useDebounce(editingStudent?.phone || "", 500);

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

      // Fetch students
      fetch(`${API_URL}/students`, {
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
            console.log("✅ Tải dữ liệu học sinh thành công");
            setStudents(data);
            setFilteredStudents(data);
          } else if (data && Array.isArray(data.content)) {
            console.log("✅ Tải dữ liệu học sinh thành công");
            setStudents(data.content);
            setFilteredStudents(data.content);
          } else {
            console.error("Unexpected API format for students");
            setStudents([]);
            setFilteredStudents([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching students:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu học sinh!"}`,
          });
        });

      // Fetch classes
      fetch(`${API_URL}/class`, {
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
            console.log("✅ Tải dữ liệu lớp học thành công");
            setClasses(data);
          } else if (data && Array.isArray(data.content)) {
            console.log("✅ Tải dữ liệu lớp học thành công");
            setClasses(data.content);
          } else {
            console.error("Unexpected API format for classes");
            setClasses([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching classes:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu lớp học!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  useEffect(() => {
    if (editingStudent && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingStudent]);

  // Validate uniqueness locally
  useEffect(() => {
    if (!editingStudent) return;

    const usernameError = !debouncedUsername
      ? "Username không được để trống."
      : editingStudent.id
      ? students.find(
          (s) => s.id !== editingStudent.id && s.username === debouncedUsername
        )
        ? "Username đã tồn tại."
        : undefined
      : students.find((s) => s.username === debouncedUsername)
      ? "Username đã tồn tại."
      : undefined;

    const phoneError = !debouncedPhone
      ? "Số điện thoại không được để trống."
      : editingStudent.id
      ? students.find(
          (s) => s.id !== editingStudent.id && s.phone === debouncedPhone
        )
        ? "Số điện thoại đã tồn tại."
        : undefined
      : students.find((s) => s.phone === debouncedPhone)
      ? "Số điện thoại đã tồn tại."
      : undefined;

    setValidationErrors({
      username: usernameError,
      phone: phoneError,
    });
  }, [debouncedUsername, debouncedPhone, editingStudent, students]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Delete Student
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
          setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
          navigate("/signin");
          return;
        }
        setIsLoading(true);
        const res = await fetch(`${API_URL}/students/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            errorData = await res.text();
          }
          console.error("❌ Lỗi từ server:", errorData);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${
              typeof errorData === "object" && errorData.message
                ? errorData.message
                : errorData || "Xóa thất bại"
            }`,
          });
          return;
        }

        setStudents((prev) => prev.filter((s) => s.id !== id));
        setFilteredStudents((prev) => prev.filter((s) => s.id !== id));
        console.log("✅ Xóa học sinh thành công");
        MySwal.fire("Thành công", "Xóa học sinh thành công", "success");
      } catch (err) {
        console.error("❌ Lỗi khi xóa:", (err as Error).message);
        MySwal.fire(
          "Lỗi",
          `Không thể xóa học sinh: ${(err as Error).message}`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const handleEdit = (student: Student) => {
    setEditingStudent({ ...student, classEntity: { ...student.classEntity } });
    setValidationErrors({});
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingStudent) return;

    // Basic validation
    if (!editingStudent.fullName.trim()) {
      setMessage({ type: "error", text: "❌ Họ tên không được để trống!" });
      return;
    }
    if (!editingStudent.username.trim()) {
      setMessage({ type: "error", text: "❌ Username không được để trống!" });
      return;
    }
    if (!editingStudent.defaultPassword.trim()) {
      setMessage({ type: "error", text: "❌ Mật khẩu không được để trống!" });
      return;
    }
    if (!editingStudent.phone.trim()) {
      setMessage({
        type: "error",
        text: "❌ Số điện thoại không được để trống!",
      });
      return;
    }
    if (!editingStudent.classEntity.id) {
      setMessage({ type: "error", text: "❌ Vui lòng chọn lớp học!" });
      return;
    }

    // Check validation errors
    if (Object.values(validationErrors).some((error) => error)) {
      setMessage({
        type: "error",
        text: "❌ Vui lòng sửa các lỗi trong biểu mẫu!",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const jwtToken = getJwtToken(token);
      if (!jwtToken) {
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }
      setIsLoading(true);
      const payload = {
        fullName: editingStudent.fullName.trim(),
        username: editingStudent.username.trim(),
        defaultPassword: editingStudent.defaultPassword.trim(),
        phone: editingStudent.phone.trim(),
        birthdate: editingStudent.birthdate || null,
        hobbies: editingStudent.hobbies.trim() || null,
        classId: editingStudent.classEntity.id,
      };
      const res = await fetch(`${API_URL}/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = await res.text();
        }
        console.error("❌ Lỗi từ server:", errorData);
        setMessage({
          type: "error",
          text: `❌ Lỗi: ${
            typeof errorData === "object" && errorData.message
              ? errorData.message
              : errorData || "Cập nhật thất bại"
          }`,
        });
        return;
      }

      const updatedStudent = await res.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
      );
      setFilteredStudents((prev) =>
        prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
      );
      setEditingStudent(null);
      setValidationErrors({});
      console.log("✅ Cập nhật học sinh thành công");
      MySwal.fire("Thành công", "Cập nhật học sinh thành công", "success");
    } catch (err) {
      console.error("❌ Lỗi khi gửi request:", (err as Error).message);
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${
          (err as Error).message || "Không thể cập nhật học sinh"
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
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

  // Define sort options for SearchSortTable
  const sortOptions: SortOption<Student>[] = [
    {
      label: "Họ tên A-Z",
      value: "fullNameAsc",
      sorter: (a: Student, b: Student) => a.fullName.localeCompare(b.fullName),
    },
    {
      label: "Họ tên Z-A",
      value: "fullNameDesc",
      sorter: (a: Student, b: Student) => b.fullName.localeCompare(a.fullName),
    },
    {
      label: "Tên lớp A-Z",
      value: "classNameAsc",
      sorter: (a: Student, b: Student) =>
        a.classEntity.name.localeCompare(b.classEntity.name),
    },
    {
      label: "Tên lớp Z-A",
      value: "classNameDesc",
      sorter: (a: Student, b: Student) =>
        b.classEntity.name.localeCompare(a.classEntity.name),
    },

    {
      label: "Username A-Z",
      value: "usernameAsc",
      sorter: (a: Student, b: Student) => a.username.localeCompare(b.username),
    },
    {
      label: "Username Z-A",
      value: "usernameDesc",
      sorter: (a: Student, b: Student) => b.username.localeCompare(a.username),
    },
    {
      label: "Mã HS A-Z",
      value: "codeAsc",
      sorter: (a: Student, b: Student) => a.code.localeCompare(b.code),
    },
    {
      label: "Mã HS Z-A",
      value: "codeDesc",
      sorter: (a: Student, b: Student) => b.code.localeCompare(a.code),
    },
  ];

  // Define search field for SearchSortTable
  const getSearchField = (item: Student) =>
    `${item.fullName} ${item.username} ${item.code} ${item.phone} ${item.classEntity.name}`;

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
        title="Danh sách Học sinh | TailAdmin - Next.js Admin Dashboard Template"
        description="Quản lý học sinh trong hệ thống"
      />
      <PageBreadcrumb pageTitle="Danh sách Học sinh" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Học sinh">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-students")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Học sinh
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
                data={students}
                onChange={setFilteredStudents}
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
                        Mã HS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Lớp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {currentStudents.length > 0 ? (
                      currentStudents.map((student, index) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {indexOfFirstStudent + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {student.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {student.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {student.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {student.classEntity.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {student.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                disabled={isLoading}
                              >
                                <Edit className="mr-1 h-4 w-4" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
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
                          colSpan={7}
                          className="text-center py-4 text-sm text-gray-900 dark:text-gray-100"
                        >
                          Không có học sinh nào
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
        open={!!editingStudent}
        onOpenChange={() => setEditingStudent(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Học sinh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Mã HS
              </label>
              <input
                type="text"
                value={editingStudent?.code || ""}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập họ tên..."
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập username..."
                disabled={isLoading}
                required
              />
              {validationErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.username}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Mật khẩu
              </label>
              <input
                type="password"
                value={editingStudent?.defaultPassword || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    defaultPassword: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập mật khẩu..."
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <input
                type="email"
                value={editingStudent?.email || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    email: e.target.value || null,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập email (không bắt buộc)..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Điện thoại
              </label>
              <input
                type="text"
                value={editingStudent?.phone || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    phone: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập số điện thoại..."
                disabled={isLoading}
                required
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập sở thích..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lớp học
              </label>
              <select
                value={editingStudent?.classEntity.id || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    classEntity: {
                      ...editingStudent!.classEntity,
                      id: Number(e.target.value),
                      name:
                        classes.find((c) => c.id === Number(e.target.value))
                          ?.name || editingStudent!.classEntity.name,
                    },
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
                required
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Trạng thái
              </label>
              <select
                value={editingStudent?.isActive ? "true" : "false"}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent!,
                    isActive: e.target.value === "true",
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Không hoạt động</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Ngày tạo
              </label>
              <input
                type="text"
                value={
                  editingStudent ? formatDate(editingStudent.createdAt) : ""
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStudent(null)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={
                isLoading ||
                Object.values(validationErrors).some((error) => error)
              }
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
