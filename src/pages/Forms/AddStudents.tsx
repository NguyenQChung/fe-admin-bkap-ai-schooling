import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Button from "../../components/ui/button/Button";

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
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch user and classes
  useEffect(() => {
    setIsLoading(true);
    getCurrentUser(setMessage).then((user) => {
      if (!user) {
        navigate("/signin");
        return;
      }
      setCurrentUser(user);

      // Fetch students for duplicate username check
      const token = localStorage.getItem("token");
      const jwtToken = getJwtToken(token);
      if (!jwtToken) {
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }

      // Fetch students
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
            text: `❌ Lỗi: ${err.message || "Không thể tải dữ liệu học sinh!"}`,
          });
        });

      // Fetch classes
      fetch(`${API_URL}/classes`, {
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
            console.log("✅ Dữ liệu classes:", data);
            setClasses(data);
          } else {
            console.error("Unexpected classes API format:", data);
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
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Normalize string for duplicate check
  const normalizeString = (str: string): string => {
    return str.trim().toLowerCase().replace(/\s+/g, " ");
  };

  // Check for duplicate username
  const isDuplicateUsername = (username: string) => {
    const normalizedInput = normalizeString(username);
    if (!normalizedInput) {
      return "Username không được để trống.";
    }
    const isDuplicate = students.some(
      (s) => normalizeString(s.username) === normalizedInput
    );
    return isDuplicate
      ? "Username này đã tồn tại. Vui lòng chọn username khác."
      : null;
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

  // Validate password
  const isValidPassword = (password: string): boolean => {
    return password.trim().length >= 6; // Minimum 6 characters
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
    if (!student.defaultPassword.trim()) {
      setMessage({ type: "error", text: "⚠️ Mật khẩu không được để trống!" });
      return;
    }
    if (!isValidPassword(student.defaultPassword)) {
      setMessage({
        type: "error",
        text: "⚠️ Mật khẩu phải có ít nhất 6 ký tự!",
      });
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

    const duplicateMessage = isDuplicateUsername(student.username);
    if (duplicateMessage) {
      setMessage({ type: "error", text: duplicateMessage });
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
        defaultPassword: student.defaultPassword.trim(),
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
          console.error("❌ Không thể parse lỗi từ server:", jsonErr);
          errorData = { message: "Lỗi server không xác định" };
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
            text: `❌ Lỗi: ${errorData.message || "Thêm mới thất bại"}`,
          });
        }
        return;
      }

      const MySwal = withReactContent(Swal);
      MySwal.fire("Thành công", "Thêm học sinh thành công", "success");
      navigate("/students");
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi gửi request:", error);
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
            <form
              onSubmit={handleSubmit}
              className="p-4 border rounded-lg bg-gray-50 space-y-3"
            >
              <div>
                <label className="block font-medium">Họ tên</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={student.fullName}
                  onChange={(e) =>
                    setStudent({ ...student, fullName: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Nhập họ tên..."
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Username</label>
                <input
                  type="text"
                  value={student.username}
                  onChange={(e) =>
                    setStudent({ ...student, username: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Nhập username..."
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Mật khẩu mặc định</label>
                <input
                  type="password"
                  value={student.defaultPassword}
                  onChange={(e) =>
                    setStudent({ ...student, defaultPassword: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Điện thoại</label>
                <input
                  type="tel"
                  value={student.phone}
                  onChange={(e) =>
                    setStudent({ ...student, phone: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Nhập số điện thoại (VD: 0987654321)"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Ngày sinh</label>
                <input
                  type="date"
                  value={student.birthdate}
                  onChange={(e) =>
                    setStudent({ ...student, birthdate: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Sở thích</label>
                <input
                  type="text"
                  value={student.hobbies}
                  onChange={(e) =>
                    setStudent({ ...student, hobbies: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="Nhập sở thích..."
                />
              </div>
              <div>
                <label className="block font-medium">Lớp học</label>
                <select
                  value={student.classId}
                  onChange={(e) =>
                    setStudent({ ...student, classId: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 mt-1"
                  required
                >
                  <option value="">Chọn lớp học</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium">Người tạo</label>
                <input
                  type="text"
                  value={
                    currentUser.username || currentUser.email || "Unknown User"
                  }
                  className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
                  disabled
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/students")}
                  disabled={isLoading || isSubmitting}
                >
                  Hủy
                </Button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  disabled={isLoading || isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Lưu"}
                </button>
              </div>
            </form>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
