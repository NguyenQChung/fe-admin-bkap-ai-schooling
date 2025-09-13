import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react";
import axios from "axios";
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
} from "../../components/ui/dialog";
import Button from "../../components/ui/button/Button";

interface School {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  code: string;
  isActive: boolean;
  classId?: number;
  schoolId?: number;
  homeroomClassName?: string;
  schoolName?: string;
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

export default function TeachersPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const teachersPerPage = 10;
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

      // Fetch teachers
      axios
        .get(`${API_URL}/teachers`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setTeachers(res.data);
            setFilteredTeachers(res.data);
          } else if (res.data && Array.isArray(res.data.content)) {
            setTeachers(res.data.content);
            setFilteredTeachers(res.data.content);
          } else {
            console.error("Unexpected API format for teachers:", res.data);
            setTeachers([]);
            setFilteredTeachers([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching teachers:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            setMessage({
              type: "error",
              text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
            });
            navigate("/signin");
          } else {
            setMessage({
              type: "error",
              text: `❌ Lỗi: ${
                err.message || "Không thể tải dữ liệu giáo viên!"
              }`,
            });
          }
        });

      // Fetch classes
      axios
        .get(`${API_URL}/class`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setClasses(res.data);
          } else if (res.data && Array.isArray(res.data.content)) {
            setClasses(res.data.content);
          } else {
            console.error("Unexpected API format for classes:", res.data);
            setClasses([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching classes:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu lớp học!"}`,
          });
        });

      // Fetch schools
      axios
        .get(`${API_URL}/schools`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setSchools(res.data);
          } else if (res.data && Array.isArray(res.data.content)) {
            setSchools(res.data.content);
          } else {
            console.error("Unexpected API format for schools:", res.data);
            setSchools([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching schools:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu trường!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  // Pagination
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = filteredTeachers.slice(
    indexOfFirstTeacher,
    indexOfLastTeacher
  );
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Delete Teacher
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
        await axios.delete(`${API_URL}/teachers/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        setFilteredTeachers((prev) => prev.filter((t) => t.id !== id));
        MySwal.fire("Thành công", "Xóa giáo viên thành công", "success");
      } catch (err: any) {
        console.error("Error deleting teacher:", err);
        MySwal.fire(
          "Lỗi",
          `Không thể xóa giáo viên: ${
            err.response?.data?.message || err.message || "Lỗi không xác định"
          }`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingTeacher) return;

    // Basic validation
    if (!editingTeacher.fullName.trim()) {
      setMessage({ type: "error", text: "❌ Họ tên không được để trống!" });
      return;
    }
    if (!editingTeacher.email.trim()) {
      setMessage({ type: "error", text: "❌ Email không được để trống!" });
      return;
    }
    if (!editingTeacher.phone.trim()) {
      setMessage({
        type: "error",
        text: "❌ Số điện thoại không được để trống!",
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
        fullName: editingTeacher.fullName.trim(),
        email: editingTeacher.email.trim(),
        phone: editingTeacher.phone.trim(),
        classId: editingTeacher.classId || null,
        schoolId: editingTeacher.schoolId || null,
      };
      const res = await axios.put(
        `${API_URL}/teachers/${editingTeacher.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? res.data : t))
      );
      setFilteredTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? res.data : t))
      );
      setEditingTeacher(null);
      MySwal.fire("Thành công", "Cập nhật giáo viên thành công", "success");
    } catch (err: any) {
      console.error("Error updating teacher:", err);
      MySwal.fire(
        "Lỗi",
        `Không thể cập nhật giáo viên: ${
          err.response?.data?.message || err.message || "Lỗi không xác định"
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Define sort options for SearchSortTable
  const sortOptions: SortOption<Teacher>[] = [
    {
      label: "Họ tên A-Z",
      value: "fullNameAsc",
      sorter: (a: Teacher, b: Teacher) => a.fullName.localeCompare(b.fullName),
    },
    {
      label: "Họ tên Z-A",
      value: "fullNameDesc",
      sorter: (a: Teacher, b: Teacher) => b.fullName.localeCompare(a.fullName),
    },
    {
      label: "Email A-Z",
      value: "emailAsc",
      sorter: (a: Teacher, b: Teacher) => a.email.localeCompare(b.email),
    },
    {
      label: "Email Z-A",
      value: "emailDesc",
      sorter: (a: Teacher, b: Teacher) => b.email.localeCompare(a.email),
    },
    {
      label: "Mã GV A-Z",
      value: "codeAsc",
      sorter: (a: Teacher, b: Teacher) => a.code.localeCompare(b.code),
    },
    {
      label: "Mã GV Z-A",
      value: "codeDesc",
      sorter: (a: Teacher, b: Teacher) => b.code.localeCompare(a.code),
    },
  ];

  // Define search field for SearchSortTable
  const getSearchField = (item: Teacher) =>
    `${item.fullName} ${item.email} ${item.code} ${item.phone} ${
      item.homeroomClassName || ""
    } ${item.schoolName || ""}`;

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
        title="Danh sách Giáo viên"
        description="Quản lý giáo viên trong hệ thống"
      />
      <PageBreadcrumb pageTitle="Danh sách Giáo viên" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Giáo viên">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-teachers")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Giáo viên
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
                data={teachers}
                onChange={setFilteredTeachers}
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
                        Mã GV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Số điện thoại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Lớp chủ nhiệm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Trường
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {currentTeachers.length > 0 ? (
                      currentTeachers.map((teacher, index) => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {indexOfFirstTeacher + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.homeroomClassName || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {teacher.schoolName || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(teacher)}
                                className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                disabled={isLoading}
                              >
                                <Edit className="mr-1 h-4 w-4" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id)}
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
                          colSpan={8}
                          className="text-center py-4 text-sm text-gray-900 dark:text-gray-100"
                        >
                          Không có giáo viên nào
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
        open={!!editingTeacher}
        onOpenChange={() => setEditingTeacher(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Giáo viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Mã GV
              </label>
              <input
                type="text"
                value={editingTeacher?.code || ""}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Họ tên
              </label>
              <input
                type="text"
                value={editingTeacher?.fullName || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
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
                Email
              </label>
              <input
                type="email"
                value={editingTeacher?.email || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
                    email: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập email..."
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Số điện thoại
              </label>
              <input
                type="text"
                value={editingTeacher?.phone || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
                    phone: e.target.value,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập số điện thoại..."
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lớp chủ nhiệm
              </label>
              <select
                value={editingTeacher?.classId || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
                    classId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    homeroomClassName:
                      classes.find((c) => c.id === Number(e.target.value))
                        ?.name || editingTeacher!.homeroomClassName,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Trường
              </label>
              <select
                value={editingTeacher?.schoolId || ""}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
                    schoolId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                    schoolName:
                      schools.find((s) => s.id === Number(e.target.value))
                        ?.name || editingTeacher!.schoolName,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
              >
                <option value="">— Chọn trường —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Trạng thái
              </label>
              <select
                value={editingTeacher?.isActive ? "true" : "false"}
                onChange={(e) =>
                  setEditingTeacher({
                    ...editingTeacher!,
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTeacher(null)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isLoading}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
