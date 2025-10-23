import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";

interface PricingItem {
    id?: number;
    actionCode: string;
    actionName: string;
    tokenCost: number;
    creditCost: number;
    vndCost: number;
}

export default function UserPricingPage() {
    const API_URL = import.meta.env.VITE_API_URL || "";

    const [pricingList, setPricingList] = useState<PricingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState<PricingItem>({
        actionCode: "",
        actionName: "",
        tokenCost: 0,
        creditCost: 0,
        vndCost: 0,
    });

    // ----------------------
    // 🔸 Lấy danh sách Pricing
    // ----------------------
    const fetchPricing = async () => {
        try {
            const res = await fetch(`${API_URL}/pricing`);
            if (!res.ok) throw new Error("Không thể tải dữ liệu");
            const data = await res.json();
            setPricingList(data);
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể tải dữ liệu!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    // ----------------------
    // 🔸 Thêm mới Pricing
    // ----------------------
    const handleAdd = async () => {
        if (!newItem.actionName || !newItem.actionCode) {
            Swal.fire("Thiếu dữ liệu", "Vui lòng nhập đầy đủ tên và mã thao tác", "warning");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/pricing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });

            if (!res.ok) throw new Error("Thêm mới thất bại");
            Swal.fire("Thành công", "Đã thêm bảng giá mới!", "success");
            setNewItem({
                actionCode: "",
                actionName: "",
                tokenCost: 0,
                creditCost: 0,
                vndCost: 0,
            });
            fetchPricing();
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể thêm mới!", "error");
        }
    };

    // ----------------------
    // 🔸 Xóa Pricing
    // ----------------------
    const handleDelete = async (id?: number) => {
        if (!id) return;
        const confirm = await Swal.fire({
            title: "Bạn có chắc muốn xóa?",
            text: "Hành động này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`${API_URL}/pricing/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xóa thất bại");
            Swal.fire("Đã xóa!", "Mục đã được xóa thành công.", "success");
            setPricingList((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể xóa mục này!", "error");
        }
    };

    if (loading) return <p className="text-center py-10">Đang tải...</p>;

    // ----------------------
    // 🔸 Giao diện
    // ----------------------
    return (
        <>
            <PageMeta title="Bảng giá thao tác" description="Xem và quản lý bảng giá AI" />
            <PageBreadcrumb pageTitle="Bảng giá thao tác" />

            <ComponentCard title="Danh sách bảng giá">
                <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">Mã thao tác</th>
                                <th className="px-4 py-2 text-left">Tên thao tác</th>
                                <th className="px-4 py-2 text-left">Token cost</th>
                                <th className="px-4 py-2 text-left">Credit cost</th>
                                <th className="px-4 py-2 text-left">VNĐ cost</th>
                                <th className="px-4 py-2 text-left">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricingList.map((p) => (
                                <tr key={p.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">{p.actionCode}</td>
                                    <td className="px-4 py-2">{p.actionName}</td>
                                    <td className="px-4 py-2">{p.tokenCost}</td>
                                    <td className="px-4 py-2">{p.creditCost}</td>
                                    <td className="px-4 py-2">{p.vndCost.toLocaleString("vi-VN")}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Form thêm mới */}
                            <tr className="border-t bg-gray-50">
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={newItem.actionCode}
                                        onChange={(e) => setNewItem({ ...newItem, actionCode: e.target.value })}
                                        className="w-full border rounded px-2 py-1"
                                        placeholder="VD: IMAGE_GEN"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="text"
                                        value={newItem.actionName}
                                        onChange={(e) => setNewItem({ ...newItem, actionName: e.target.value })}
                                        className="w-full border rounded px-2 py-1"
                                        placeholder="VD: Tạo hình ảnh"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={newItem.tokenCost}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, tokenCost: Number(e.target.value) })
                                        }
                                        className="w-24 border rounded px-2 py-1"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={newItem.creditCost}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, creditCost: Number(e.target.value) })
                                        }
                                        className="w-24 border rounded px-2 py-1"
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        value={newItem.vndCost}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, vndCost: Number(e.target.value) })
                                        }
                                        className="w-32 border rounded px-2 py-1"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={handleAdd}
                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    >
                                        Thêm
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </ComponentCard>
        </>
    );
}
