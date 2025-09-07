import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  let jwtToken: string;
  try {
    const parsedToken = JSON.parse(token);
    if (parsedToken.token) {
      jwtToken = parsedToken.token;
      console.log("🔍 Đã lấy chuỗi JWT từ JSON:", jwtToken);
    } else {
      console.error("❌ Không tìm thấy trường 'token' trong JSON");
      setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
      return null;
    }
  } catch (e) {
    console.log("🔍 Token không phải JSON, sử dụng trực tiếp:", token);
    jwtToken = token;
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

export default function ForbiddenKeywordTable() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  const [data, setData] = useState<ForbiddenKeyword[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ForbiddenKeyword | null>(null);
  const [newKeyword, setNewKeyword] = useState({ keyword: "", createdById: 0 });
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Load current user
  useEffect(() => {
    console.log("🔍 Kiểm tra token:", localStorage.getItem("token"));
    getCurrentUser(setMessage).then((user) => {
      if (!user) {
        navigate("/signin");
        return;
      }
      setCurrentUser(user);
      setNewKeyword({ keyword: "", createdById: user.id });
    });
  }, [navigate]);

  // Load keywords
  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
      navigate("/signin");
      return;
    }

    let jwtToken: string;
    try {
      const parsedToken = JSON.parse(token);
      if (parsedToken.token) {
        jwtToken = parsedToken.token;
      } else {
        console.error("❌ Không tìm thấy trường 'token' trong JSON");
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }
    } catch (e) {
      console.log("🔍 Token không phải JSON, sử dụng trực tiếp:", token);
      jwtToken = token;
    }

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
          setData(data);
        } else {
          console.error("❌ Dữ liệu forbidden-keywords không phải mảng:", data);
          setMessage({ type: "error", text: "❌ Dữ liệu không hợp lệ!" });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        const error = err as Error;
        console.error("❌ Lỗi khi lấy dữ liệu:", error.message);
        setMessage({
          type: "error",
          text: `❌ Lỗi: ${error.message || "Không thể tải dữ liệu!"}`,
        });
        setIsLoading(false);
      });
  }, [API_URL, currentUser, navigate]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Check for duplicate keywords
  const isDuplicateKeyword = (text: string, excludeId?: number) => {
    return data.some(
      (r) =>
        r.keyword.trim().toLowerCase() === text.trim().toLowerCase() &&
        r.id !== excludeId
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập để tiếp tục!" });
      navigate("/signin");
      return;
    }

    if (!newKeyword.keyword.trim()) {
      setMessage({ type: "error", text: "⚠️ Từ khóa không được để trống!" });
      return;
    }

    if (isDuplicateKeyword(newKeyword.keyword, editing?.id)) {
      setMessage({ type: "error", text: "⚠️ Từ khóa này đã tồn tại!" });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
      navigate("/signin");
      return;
    }

    let jwtToken: string;
    try {
      const parsedToken = JSON.parse(token);
      if (parsedToken.token) {
        jwtToken = parsedToken.token;
      } else {
        console.error("❌ Không tìm thấy trường 'token' trong JSON");
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }
    } catch (e) {
      console.log("🔍 Token không phải JSON, sử dụng trực tiếp:", token);
      jwtToken = token;
    }

    try {
      const payload = {
        keyword: newKeyword.keyword.trim(),
      }; // Backend sets createdBy from authentication
      console.log("📤 Gửi payload:", payload);

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      };

      const res = await fetch(
        editing
          ? `${API_URL}/forbidden-keywords/${editing.id}`
          : `${API_URL}/forbidden-keywords`,
        {
          method: editing ? "PUT" : "POST",
          headers,
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
          text: `❌ Lỗi: ${
            errorData.message ||
            (editing ? "Cập nhật thất bại" : "Thêm mới thất bại")
          }`,
        });
        return;
      }

      const result = await res.json();
      if (editing) {
        setData(data.map((r) => (r.id === result.id ? result : r)));
        setMessage({ type: "success", text: "✅ Cập nhật thành công!" });
      } else {
        setData([...data, result]);
        setMessage({ type: "success", text: "✅ Thêm thành công!" });
      }

      setEditing(null);
      setNewKeyword({ keyword: "", createdById: currentUser.id });
      setShowForm(false);
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

  // Delete keyword
  const handleDelete = async (id: number) => {
    if (!currentUser) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập để tiếp tục!" });
      navigate("/signin");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập lại!" });
      navigate("/signin");
      return;
    }

    let jwtToken: string;
    try {
      const parsedToken = JSON.parse(token);
      if (parsedToken.token) {
        jwtToken = parsedToken.token;
      } else {
        console.error("❌ Không tìm thấy trường 'token' trong JSON");
        setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
        navigate("/signin");
        return;
      }
    } catch (e) {
      console.log("🔍 Token không phải JSON, sử dụng trực tiếp:", token);
      jwtToken = token;
    }

    try {
      const res = await fetch(`${API_URL}/forbidden-keywords/${id}`, {
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

      setData(data.filter((r) => r.id !== id));
      setMessage({ type: "success", text: "✅ Xóa thành công!" });
    } catch (err) {
      const error = err as Error;
      console.error("❌ Lỗi khi xóa:", error.message);
      setMessage({
        type: "error",
        text: `❌ Lỗi: ${error.message || "Không thể kết nối server!"}`,
      });
    }
  };

  // Edit keyword
  const handleEdit = (keyword: ForbiddenKeyword) => {
    if (!currentUser) {
      setMessage({ type: "error", text: "❌ Vui lòng đăng nhập để tiếp tục!" });
      navigate("/signin");
      return;
    }

    setEditing(keyword);
    setNewKeyword({
      keyword: keyword.keyword,
      createdById: currentUser.id,
    });
    setShowForm(true);
    setMessage(null);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setData([]);
    setNewKeyword({ keyword: "", createdById: 0 });
    setMessage({ type: "success", text: "✅ Đăng xuất thành công!" });
    navigate("/signin");
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
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Chào, {currentUser.username || currentUser.email}
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Đăng xuất
        </button>
      </div>

      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditing(null);
          setNewKeyword({ keyword: "", createdById: currentUser.id });
          setMessage(null);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
      >
        {showForm
          ? "Đóng form"
          : editing
          ? "✏️ Chỉnh sửa"
          : "+ Thêm từ khóa mới"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border rounded-lg bg-gray-50 space-y-3"
        >
          <div>
            <label className="block font-medium">Từ khóa</label>
            <input
              type="text"
              value={newKeyword.keyword}
              onChange={(e) =>
                setNewKeyword({ ...newKeyword, keyword: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mt-1"
              placeholder="Nhập từ khóa..."
              required
            />
          </div>

          <div>
            <label className="block font-medium">Người tạo</label>
            <input
              type="text"
              value={currentUser.username || currentUser.email}
              className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
              disabled
            />
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

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : editing ? "Cập nhật" : "Lưu"}
          </button>
        </form>
      )}

      {isLoading && <div className="text-center">Đang tải...</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Từ khóa</th>
              <th className="border px-4 py-2">Người tạo</th>
              <th className="border px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="border px-4 py-2 text-gray-600">
                  Không có dữ liệu để hiển thị
                </td>
              </tr>
            ) : (
              data.map((kw) => (
                <tr key={kw.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{kw.id}</td>
                  <td className="border px-4 py-2">{kw.keyword}</td>
                  <td className="border px-4 py-2">
                    {kw.createdBy
                      ? kw.createdBy.username ||
                        kw.createdBy.email ||
                        "Unknown User"
                      : "Unknown User"}
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(kw)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(kw.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
