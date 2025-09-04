import React, { useEffect, useState } from "react";

interface ForbiddenKeyword {
  id: number;
  keyword: string;
  createdBy: number;
}

export default function ForbiddenKeywordTable() {
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [data, setData] = useState<ForbiddenKeyword[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ForbiddenKeyword | null>(null);
  const [newKeyword, setNewKeyword] = useState({ keyword: "", createdBy: 1 });
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Load dữ liệu
  useEffect(() => {
    fetch(`${API_URL}/forbidden-keywords`)
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error("❌ Error fetching data:", err));
  }, [API_URL]);

  // Hàm check trùng lặp
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

    if (isDuplicateKeyword(newKeyword.keyword, editing?.id)) {
      setMessage({ type: "error", text: "⚠️ Từ khóa này đã tồn tại!" });
      return;
    }

    try {
      if (editing) {
        // === Cập nhật ===
        const res = await fetch(`${API_URL}/forbidden-keywords/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newKeyword),
        });

        if (res.ok) {
          const updated = await res.json();
          setData(data.map((r) => (r.id === updated.id ? updated : r)));
          setMessage({ type: "success", text: "✅ Cập nhật thành công!" });
        } else {
          setMessage({ type: "error", text: "❌ Lỗi khi cập nhật!" });
        }
      } else {
        // === Thêm mới ===
        const res = await fetch(`${API_URL}/forbidden-keywords`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newKeyword),
        });

        if (res.ok) {
          const added = await res.json();
          setData([...data, added]);
          setMessage({ type: "success", text: "✅ Thêm thành công!" });
        } else {
          setMessage({ type: "error", text: "❌ Lỗi khi thêm mới!" });
        }
      }

      // Reset form
      setEditing(null);
      setNewKeyword({ keyword: "", createdBy: 1 });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Không thể kết nối server!" });
    }
  };

  // Hàm xóa
  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa?")) return;

    try {
      const res = await fetch(`${API_URL}/forbidden-keywords/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setData(data.filter((r) => r.id !== id));
        setMessage({ type: "success", text: "✅ Xóa thành công!" });
      } else {
        setMessage({ type: "error", text: "❌ Lỗi khi xóa!" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Không thể kết nối server!" });
    }
  };

  // Mở form sửa
  const handleEdit = (keyword: ForbiddenKeyword) => {
    setEditing(keyword);
    setNewKeyword({ keyword: keyword.keyword, createdBy: keyword.createdBy });
    setShowForm(true);
    setMessage(null);
  };

  return (
    <div className="space-y-4">
      {/* Nút mở form */}
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditing(null);
          setNewKeyword({ keyword: "", createdBy: 1 });
          setMessage(null);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
      >
        {editing ? "✏️ Chỉnh sửa" : "+ Thêm từ khóa mới"}
      </button>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 border rounded-lg bg-gray-50 space-y-3"
        >
          <div>
            <label className="block font-medium">Keyword</label>
            <input
              type="text"
              value={newKeyword.keyword}
              onChange={(e) =>
                setNewKeyword({ ...newKeyword, keyword: e.target.value })
              }
              className="w-full border rounded px-3 py-2 mt-1"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Created By</label>
            <input
              type="number"
              value={newKeyword.createdBy}
              onChange={(e) =>
                setNewKeyword({
                  ...newKeyword,
                  createdBy: Number(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2 mt-1"
              required
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
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {editing ? "Cập nhật" : "Lưu"}
          </button>
        </form>
      )}

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Keyword</th>
              <th className="border px-4 py-2">Created By</th>
              <th className="border px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.map((kw) => (
              <tr key={kw.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{kw.id}</td>
                <td className="border px-4 py-2">{kw.keyword}</td>
                <td className="border px-4 py-2">{kw.createdBy}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
