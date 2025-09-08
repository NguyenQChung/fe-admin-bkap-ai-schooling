import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

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

interface Student {
  id: number;
  fullName: string;
  username: string;
  defaultPassword: string;
  phone: string;
  birthdate: string;
  hobbies: string;
  classId: number;
}

interface User {
  id: number;
  username: string | null;
  email: string;
}

interface Class {
  id: number;
  name: string;
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

export default function AddStudent() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [student, setStudent] = useState({
    fullName: "",
    username: "",
    defaultPassword: "",
    phone: "",
    birthdate: "",
    hobbies: "",
    classId: "",
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    phone?: string;
  }>({});
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced values for validation
  const debouncedUsername = useDebounce(student.username, 500);
  const debouncedPhone = useDebounce(student.phone, 500);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Focus on first input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Fetch user and data
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

      // Fetch students for duplicate checks
      fetch(`${API_URL}/students`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("token");
              setMessage({
                type: "error",
                text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
              });
              navigate("/signin");
            }
            const errorData = await res.text();
            throw new Error(
              `HTTP error! status: ${res.status}, message: ${
                errorData || "Unknown error"
              }`
            );
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("✅ Tải dữ liệu học sinh thành công");
            setStudents(data);
          } else if (data && Array.isArray(data.content)) {
            console.log("✅ Tải dữ liệu học sinh thành công");
            setStudents(data.content);
          } else {
            console.error("Unexpected API format for students");
            setStudents([]);
          }
        })
        .catch((err) => {
          console.error("❌ Lỗi khi tải học sinh:", err.message);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu học sinh!"}`,
          });
        });

      // Fetch classes
      fetch(`${API_URL}/class`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("token");
              setMessage({
                type: "error",
                text: "❌ Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
              });
              navigate("/signin");
            }
            const errorData = await res.text();
            throw new Error(
              `HTTP error! status: ${res.status}, message: ${
                errorData || "Unknown error"
              }`
            );
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("✅ Tải dữ liệu lớp học thành công");
            setClasses(data);
          } else {
            console.error("Unexpected API format for classes");
            setClasses([]);
          }
        })
        .catch((err) => {
          console.error("❌ Lỗi khi tải lớp học:", err.message);
          setMessage({
            type: "error",
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu lớp học!"}`,
          });
        })
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  // Validate username and phone
  useEffect(() => {
    const usernameError = !debouncedUsername
      ? "Username không được để trống."
      : students.find(
          (s) =>
            normalizeString(s.username) === normalizeString(debouncedUsername)
        )
      ? "Username đã tồn tại."
      : undefined;

    const phoneError = !debouncedPhone
      ? "Số điện thoại không được để trống."
      : !isValidPhone(debouncedPhone)
      ? "Số điện thoại không hợp lệ."
      : students.find(
          (s) => normalizeString(s.phone) === normalizeString(debouncedPhone)
        )
      ? "Số điện thoại đã tồn tại."
      : undefined;

    setValidationErrors({
      username: usernameError,
      phone: phoneError,
    });
  }, [debouncedUsername, debouncedPhone, students]);

  // Normalize string for duplicate check
  const normalizeString = (str: string): string => {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  };

  // Validate phone number format (Vietnamese phone numbers)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone.trim());
  };

  // Validate birthdate format (YYYY-MM-DD)
  const isValidBirthdate = (birthdate: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthdate)) return false;
    const date = new Date(birthdate);
    return !isNaN(date.getTime()) && date <= new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập để tiếp tục!" });
      navigate("/signin");
      return;
    }

    // Validate required fields
    if (!student.fullName.trim()) {
      setMessage({ type: "error", text: "⚠️ Họ tên không được để trống!" });
      return;
    }
    if (!student.username.trim()) {
      setMessage({ type: "error", text: "⚠️ Username không được để trống!" });
      return;
    }
    if (!student.phone.trim()) {
      setMessage({ type: "error", text: "⚠️ Điện thoại không được để trống!" });
      return;
    }
    if (!isValidPhone(student.phone)) {
      setMessage({
        type: "error",
        text: "⚠️ Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam hợp lệ (bắt đầu bằng 03, 05, 07, 08, 09 và 10 chữ số).",
      });
      return;
    }
    if (!student.birthdate) {
      setMessage({ type: "error", text: "⚠️ Ngày sinh không được để trống!" });
      return;
    }
    if (!isValidBirthdate(student.birthdate)) {
      setMessage({
        type: "error",
        text: "⚠️ Ngày sinh không hợp lệ! Vui lòng nhập định dạng YYYY-MM-DD và không được là ngày trong tương lai.",
      });
      return;
    }
    if (!student.classId) {
      setMessage({ type: "error", text: "⚠️ Vui lòng chọn lớp học!" });
      return;
    }

    if (Object.values(validationErrors).some((error) => error)) {
      setMessage({
        type: "error",
        text: "⚠️ Vui lòng sửa các lỗi trong biểu mẫu!",
      });
      return;
    }

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

    try {
      setIsSubmitting(true);
      const payload = {
        fullName: student.fullName.trim(),
        username: student.username.trim(),
        defaultPassword: student.defaultPassword.trim() || "123456",
        phone: student.phone.trim(),
        birthdate: student.birthdate,
        hobbies: student.hobbies.trim() || null,
        classId: Number(student.classId),
      };
      console.log("📤 Yêu cầu POST tới:", `${API_URL}/students`);
      console.log("📤 Payload:", JSON.stringify(payload, null, 2));
      console.log("📤 Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      });

      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
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
          console.error(
            "❌ Lỗi từ server:",
            JSON.stringify(errorData, null, 2)
          );
        } catch (jsonErr) {
          errorData = await res.text();
          console.error("❌ Lỗi từ server:", errorData);
        }
        if (res.status === 401) {
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
              typeof errorData === "object" && errorData.message
                ? errorData.message
                : errorData || "Thêm mới thất bại"
            }`,
          });
        }
        return;
      }

      const MySwal = withReactContent(Swal);
      MySwal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Thêm học sinh thành công!",
        timer: 2000,
        showConfirmButton: false,
      });
      setStudent({
        fullName: "",
        username: "",
        defaultPassword: "",
        phone: "",
        birthdate: "",
        hobbies: "",
        classId: "",
      });
      navigate("/students");
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi gửi request:", error.message);
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${error.message || "Không thể kết nối server!"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center text-red-600">
        Vui lòng đăng nhập để sử dụng tính năng này!
        <button
          onClick={() => navigate("/signin")}
          className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Thêm Học Sinh | TailAdmin - Next.js Admin Dashboard Template"
        description="Trang thêm mới học sinh cho TailAdmin"
      />
      <PageBreadcrumb pageTitle="Thêm Học Sinh" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Học Sinh">
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Họ tên *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={student.fullName}
                  onChange={(e) =>
                    setStudent({ ...student, fullName: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="Nhập họ tên..."
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <input
                  type="text"
                  value={student.username}
                  onChange={(e) =>
                    setStudent({ ...student, username: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="Nhập username..."
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.username}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mật khẩu mặc định
                </label>
                <input
                  type="password"
                  value={student.defaultPassword}
                  onChange={(e) =>
                    setStudent({ ...student, defaultPassword: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="Nhập mật khẩu (để trống sẽ dùng 123456)"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Điện thoại *
                </label>
                <input
                  type="tel"
                  value={student.phone}
                  onChange={(e) =>
                    setStudent({ ...student, phone: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="Nhập số điện thoại (VD: 0987654321)"
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngày sinh *
                </label>
                <input
                  type="date"
                  value={student.birthdate}
                  onChange={(e) =>
                    setStudent({ ...student, birthdate: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sở thích
                </label>
                <input
                  type="text"
                  value={student.hobbies}
                  onChange={(e) =>
                    setStudent({ ...student, hobbies: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="Nhập sở thích..."
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lớp học *
                </label>
                <select
                  value={student.classId}
                  onChange={(e) =>
                    setStudent({ ...student, classId: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  required
                  disabled={isSubmitting}
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
                <label className="block text-sm font-medium text-gray-700">
                  Người tạo
                </label>
                <input
                  type="text"
                  value={
                    currentUser.username || currentUser.email || "Unknown User"
                  }
                  className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-100"
                  disabled
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => navigate("/students")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                  disabled={isLoading || isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={
                    isLoading ||
                    isSubmitting ||
                    Object.values(validationErrors).some((error) => error)
                  }
                >
                  {isSubmitting ? "Đang xử lý..." : "Thêm Học Sinh"}
                </button>
              </div>
            </form>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
