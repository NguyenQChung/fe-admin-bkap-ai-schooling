import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
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
  } catch {
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
      { headers: { Authorization: `Bearer ${jwtToken}` } }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Lỗi khi lấy user:`, errorData);
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
    console.error("❌ Lỗi khi lấy thông tin user:", err);
    setMessage({ type: "error", text: "❌ Không thể kết nối server!" });
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

  const debouncedUsername = useDebounce(student.username, 500);
  const debouncedPhone = useDebounce(student.phone, 500);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getCurrentUser(setMessage).then((user) => {
      if (!user) return navigate("/signin");
      setCurrentUser(user);

      const token = localStorage.getItem("token");
      const jwtToken = getJwtToken(token);
      if (!jwtToken) return navigate("/signin");

      fetch(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      })
        .then((res) => res.json())
        .then((data) =>
          setStudents(Array.isArray(data) ? data : data.content || [])
        )
        .catch((err) => console.error("❌ Lỗi khi tải học sinh:", err));

      fetch(`${API_URL}/class`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      })
        .then((res) => res.json())
        .then((data) => setClasses(Array.isArray(data) ? data : []))
        .finally(() => setIsLoading(false));
    });
  }, [navigate]);

  useEffect(() => {
    const usernameError = !debouncedUsername
      ? "Username không được để trống."
      : students.find(
          (s) => normalize(s.username) === normalize(debouncedUsername)
        )
      ? "Username đã tồn tại."
      : undefined;

    const phoneError =
      debouncedPhone && !isValidPhone(debouncedPhone)
        ? "Số điện thoại không hợp lệ."
        : debouncedPhone &&
          students.find((s) => normalize(s.phone) === normalize(debouncedPhone))
        ? "Số điện thoại đã tồn tại."
        : undefined;

    setValidationErrors({ username: usernameError, phone: phoneError });
  }, [debouncedUsername, debouncedPhone, students]);

  const normalize = (str: string) => str.trim().toLowerCase();
  const isValidPhone = (phone: string) =>
    /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone.trim());
  const isValidBirthdate = (birthdate: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthdate)) return false;
    const date = new Date(birthdate);
    return !isNaN(date.getTime()) && date <= new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!student.fullName.trim())
      return setMessage({
        type: "error",
        text: "⚠️ Họ tên không được để trống!",
      });
    if (!student.username.trim())
      return setMessage({
        type: "error",
        text: "⚠️ Username không được để trống!",
      });
    if (student.phone && !isValidPhone(student.phone))
      return setMessage({
        type: "error",
        text: "⚠️ Số điện thoại không hợp lệ!",
      });
    if (!student.birthdate)
      return setMessage({
        type: "error",
        text: "⚠️ Ngày sinh không được để trống!",
      });
    if (!isValidBirthdate(student.birthdate))
      return setMessage({ type: "error", text: "⚠️ Ngày sinh không hợp lệ!" });
    if (!student.classId)
      return setMessage({ type: "error", text: "⚠️ Vui lòng chọn lớp học!" });

    if (Object.values(validationErrors).some((e) => e)) {
      return setMessage({
        type: "error",
        text: "⚠️ Vui lòng sửa các lỗi trong biểu mẫu!",
      });
    }

    const token = localStorage.getItem("token");
    const jwtToken = getJwtToken(token);
    if (!jwtToken) return navigate("/signin");

    try {
      setIsSubmitting(true);
      const payload = {
        fullName: student.fullName.trim(),
        username: student.username.trim(),
        defaultPassword: student.defaultPassword.trim() || "123456",
        phone: student.phone.trim() || null,
        birthdate: student.birthdate,
        hobbies: student.hobbies.trim() || null,
        classId: Number(student.classId),
      };

      const res = await fetch(`${API_URL}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      withReactContent(Swal).fire({
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
      console.error("❌ Lỗi khi gửi request:", err);
      setMessage({ type: "error", text: "❌ Không thể kết nối server!" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser)
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

  return (
    <>
      <PageMeta title="Thêm Học Sinh" description="Trang thêm mới học sinh" />
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
              {/* Họ tên */}
              <input
                ref={inputRef}
                type="text"
                value={student.fullName}
                onChange={(e) =>
                  setStudent({ ...student, fullName: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Nhập họ tên..."
                disabled={isSubmitting}
                required
              />

              {/* Username */}
              <input
                type="text"
                value={student.username}
                onChange={(e) =>
                  setStudent({ ...student, username: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Nhập username..."
                disabled={isSubmitting}
                required
              />
              {validationErrors.username && (
                <p className="text-red-500 text-sm">
                  {validationErrors.username}
                </p>
              )}

              {/* Mật khẩu */}
              <input
                type="password"
                value={student.defaultPassword}
                onChange={(e) =>
                  setStudent({ ...student, defaultPassword: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Mật khẩu (trống = 123456)"
                disabled={isSubmitting}
              />

              {/* Điện thoại (không bắt buộc) */}
              <input
                type="tel"
                value={student.phone}
                onChange={(e) =>
                  setStudent({ ...student, phone: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Nhập số điện thoại (có thể bỏ trống)"
                disabled={isSubmitting}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm">{validationErrors.phone}</p>
              )}

              {/* Ngày sinh */}
              <input
                type="date"
                value={student.birthdate}
                onChange={(e) =>
                  setStudent({ ...student, birthdate: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isSubmitting}
                required
              />

              {/* Sở thích */}
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

              {/* Lớp học */}
              <select
                value={student.classId}
                onChange={(e) =>
                  setStudent({ ...student, classId: e.target.value })
                }
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isSubmitting}
                required
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              {/* Người tạo */}
              <input
                type="text"
                value={currentUser.username || currentUser.email || "Unknown"}
                className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-100"
                disabled
              />

              {/* Nút hành động */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => navigate("/students")}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  disabled={
                    isSubmitting ||
                    Object.values(validationErrors).some((e) => e)
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
