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
  schoolId: number;
  schoolName: string;
  schoolAddress: string;
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

export default function ClassPage() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const classesPerPage = 10;
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
            setClasses(data);
            setFilteredClasses(data);
          } else if (data && Array.isArray(data.content)) {
            setClasses(data.content);
            setFilteredClasses(data.content);
          } else {
            console.error("Unexpected API format:", data);
            setClasses([]);
            setFilteredClasses([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching classes:", err);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu lớp!"}`,
          });
        });

      // Fetch schools
      fetch(`${API_URL}/schools`, {
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
          setSchools(Array.isArray(data) ? data : data.content || []);
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
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = filteredClasses.slice(
    indexOfFirstClass,
    indexOfLastClass
  );
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Delete Class
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
        await axios.delete(`${API_URL}/class/${id}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setClasses((prev) => prev.filter((c) => c.id !== id));
        setFilteredClasses((prev) => prev.filter((c) => c.id !== id));
        MySwal.fire("Thành công", "Xóa lớp thành công", "success");
      } catch (err: any) {
        console.error("Error deleting class:", err);
        MySwal.fire(
          "Lỗi",
          `Không thể xóa lớp: ${err.message || "Lỗi không xác định"}`,
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Open edit dialog
  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingClass) return;
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
        name: editingClass.name.trim(),
        schoolId: editingClass.schoolId,
      };
      const res = await axios.put(
        `${API_URL}/class/${editingClass.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setClasses((prev) =>
        prev.map((c) => (c.id === editingClass.id ? res.data : c))
      );
      setFilteredClasses((prev) =>
        prev.map((c) => (c.id === editingClass.id ? res.data : c))
      );
      setEditingClass(null);
      MySwal.fire("Thành công", "Cập nhật lớp thành công", "success");
    } catch (err: any) {
      console.error("Error updating class:", err);
      MySwal.fire(
        "Lỗi",
        `Không thể cập nhật lớp: ${err.message || "Lỗi không xác định"}`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Define sort options for SearchSortTable
  const sortOptions: SortOption<Class>[] = [
    {
      label: "Tên Lớp A-Z",
      value: "nameAsc",
      sorter: (a: Class, b: Class) => a.name.localeCompare(b.name),
    },
    {
      label: "Tên Lớp Z-A",
      value: "nameDesc",
      sorter: (a: Class, b: Class) => b.name.localeCompare(a.name),
    },
    {
      label: "Trường A-Z",
      value: "schoolNameAsc",
      sorter: (a: Class, b: Class) => a.schoolName.localeCompare(b.schoolName),
    },
    {
      label: "Trường Z-A",
      value: "schoolNameDesc",
      sorter: (a: Class, b: Class) => b.schoolName.localeCompare(a.schoolName),
    },
  ];

  // Define search field for SearchSortTable
  const getSearchField = (item: Class) => `${item.name} ${item.schoolName}`;

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
        title="Danh sách Lớp"
        description="Danh sách lớp học kèm thông tin trường"
      />
      <PageBreadcrumb pageTitle="Danh sách Lớp" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Lớp">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Chào, {currentUser.username || currentUser.email}
            </h2>
            <Button
              variant="primary"
              onClick={() => navigate("/add-class")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm Lớp
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
                data={classes}
                onChange={setFilteredClasses}
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
                        Tên Lớp
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
                    {currentClasses.length > 0 ? (
                      currentClasses.map((cls, index) => (
                        <tr key={cls.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {indexOfFirstClass + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {cls.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {cls.schoolName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(cls)}
                                className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                                disabled={isLoading}
                              >
                                <Edit className="mr-1 h-4 w-4" /> Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(cls.id)}
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
                          Không có lớp nào
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

      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Lớp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tên Lớp
              </label>
              <input
                type="text"
                value={editingClass?.name || ""}
                onChange={(e) =>
                  setEditingClass({ ...editingClass!, name: e.target.value })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Nhập tên lớp..."
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Thuộc Trường
              </label>
              <select
                value={editingClass?.schoolId || ""}
                onChange={(e) =>
                  setEditingClass({
                    ...editingClass!,
                    schoolId: e.target.value ? Number(e.target.value) : 0,
                    schoolName:
                      schools.find((s) => s.id === Number(e.target.value))
                        ?.name || editingClass!.schoolName,
                  })
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                disabled={isLoading}
                required
              >
                <option value="">— Chọn trường —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingClass(null)}
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
