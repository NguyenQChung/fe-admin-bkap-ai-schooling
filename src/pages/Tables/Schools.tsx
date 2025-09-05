import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Edit, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";




export default function School() {

  interface School {
    id: number;
    name: string;
    address: string;
  }

  const [schools, setSchools] = useState<School[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [currentPage, setCurrentPage] = useState(1);
  const schoolsPerPage = 10;

  useEffect(() => {
    fetch(`${API_URL}/schools`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API /schools response:", data);

        // Nếu backend trả về { data: [...] }
        if (Array.isArray(data)) {
          setSchools(data);
        } else if (data && Array.isArray(data.content)) {
          // Ví dụ backend có phân trang: { content: [...], totalPages: 2 }
          setSchools(data.content);
        } else {
          console.error("Unexpected API format:", data);
          setSchools([]); // fallback an toàn
        }
      })
      .catch((err) => console.error("Error fetching schools:", err));
  }, []);

  // Tính toán phân trang
  const indexOfLastSchool = currentPage * schoolsPerPage;
  const indexOfFirstSchool = indexOfLastSchool - schoolsPerPage;
  const currentSchools = schools.slice(indexOfFirstSchool, indexOfLastSchool);
  const totalPages = Math.ceil(schools.length / schoolsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Xoa School
  const MySwal = withReactContent(Swal);
  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Bạn có chắc muốn xoá?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/schools/${id}`);
        setSchools((prev) => prev.filter((s) => s.id !== id));
        MySwal.fire("Đã xoá!", "Trường đã được xoá thành công.", "success");
      } catch (err: any) {
        MySwal.fire("Thất bại", "Không thể xoá trường.", "error");
      }
    }
  };

  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Basic Tables" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Trường">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Trường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="w-1/4 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSchools.length > 0 ? (
                currentSchools.map((school, index) => (
                  <tr key={school.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{indexOfFirstSchool + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{school.address}</td>
                    <td className="px-2 py-4 text-left">
                      <div className="flex space-x-2">
                        <button className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
                          <Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(school.id)}
                          className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    Không có trường nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-blue-500"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
