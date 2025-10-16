import React, { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Swal from "sweetalert2";

// ----------------------
// 🔹 Interface định nghĩa kiểu dữ liệu
// ----------------------
interface PricingItem {
    id: number;
    actionCode: string;
    actionName: string;
    tokenCost: number;
    creditCost: number;
    vndCost: number;
    newTokenCost: number;
    newCreditCost: number;
    newVndCost: number;
    effectiveFrom: string;
}

interface RowErrors {
    tokenCost?: string;
    creditCost?: string;
    vndCost?: string;
}

type ErrorMap = Record<number, RowErrors>;

// ----------------------
// 🔹 Component chính
// ----------------------
export default function EditPricing() {
    const API_URL = import.meta.env.VITE_API_URL || "";

    const [pricingList, setPricingList] = useState<PricingItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errors, setErrors] = useState<ErrorMap>({});

    // ----------------------
    // 🔸 Lấy dữ liệu từ backend
    // ----------------------
    const fetchPricing = async () => {
        try {
            const res = await fetch(`${API_URL}/pricing`);
            if (!res.ok) throw new Error("Không thể tải dữ liệu pricing");
            const data: PricingItem[] = await res.json();

            const mappedData = data.map((item) => ({
                ...item,
                newTokenCost: item.tokenCost,
                newCreditCost: item.creditCost,
                newVndCost: item.vndCost,
                effectiveFrom: "",
            }));
            setPricingList(mappedData);
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể tải dữ liệu bảng giá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, []);

    // ----------------------
    // 🔸 Validate từng dòng
    // ----------------------
    const validateRow = (row: PricingItem): RowErrors => {
        const rowErrors: RowErrors = {};
        if (Number(row.newTokenCost) < 0) rowErrors.tokenCost = "Token cost ≥ 0";
        if (Number(row.newCreditCost) < 0) rowErrors.creditCost = "Credit cost ≥ 0";
        if (Number(row.newVndCost) < 0) rowErrors.vndCost = "VNĐ cost ≥ 0";
        return rowErrors;
    };

    // ----------------------
    // 🔸 Gửi cập nhật version mới
    // ----------------------
    const handleSave = async (pricingId: number) => {
        const row = pricingList.find((p) => p.id === pricingId);
        if (!row) return;

        const rowErrors = validateRow(row);
        if (Object.keys(rowErrors).length > 0) {
            setErrors((prev) => ({ ...prev, [pricingId]: rowErrors }));
            return;
        }

        const body = {
            pricingId,
            tokenCost: Number(row.newTokenCost),
            creditCost: Number(row.newCreditCost),
            vndCost: Number(row.newVndCost),
            effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom) : null,
        };

        try {
            const res = await fetch(`${API_URL}/pricing-version`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Tạo phiên bản mới thất bại");
            const data = await res.json();

            Swal.fire({
                icon: "success",
                title: "Đã lưu phiên bản mới!",
                html: `
          <p><b>Thao tác:</b> ${data.actionName}</p>
          <p><b>Áp dụng từ:</b> ${data.effectiveFrom
                        ? new Date(data.effectiveFrom).toLocaleString("vi-VN")
                        : "Ngay lập tức"
                    }</p>
        `,
            });

            // Reset lỗi sau khi lưu thành công
            setErrors((prev) => {
                const newErr = { ...prev };
                delete newErr[pricingId];
                return newErr;
            });
        } catch (err) {
            console.error(err);
            Swal.fire("Lỗi", "Không thể lưu cấu hình mới!", "error");
        }
    };

    // ----------------------
    // 🔸 Khi dữ liệu đang tải
    // ----------------------
    if (loading) return <p className="text-center py-10">Đang tải...</p>;

    // ----------------------
    // 🔸 Giao diện hiển thị
    // ----------------------
    return (
        <>
            <PageMeta title="Cấu hình Chi phí" description="Chỉnh sửa chi phí từng thao tác AI" />
            <PageBreadcrumb pageTitle="Cấu hình Chi phí" />

            <ComponentCard title="Chỉnh sửa bảng giá thao tác">
                <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Thao tác</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Token cost</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Credit cost</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">VNĐ cost</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Hiệu lực từ</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pricingList.map((p: PricingItem) => (
                                <tr key={p.id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium">{p.actionName}</td>

                                    {/* Token Cost */}
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={p.newTokenCost}
                                            onChange={(e) =>
                                                setPricingList((prev) =>
                                                    prev.map((item) =>
                                                        item.id === p.id
                                                            ? { ...item, newTokenCost: Number(e.target.value) }
                                                            : item
                                                    )
                                                )
                                            }
                                            className="w-24 border rounded px-2 py-1"
                                        />
                                        {errors[p.id]?.tokenCost && (
                                            <p className="text-sm text-red-500">{errors[p.id].tokenCost}</p>
                                        )}
                                    </td>

                                    {/* Credit Cost */}
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={p.newCreditCost}
                                            onChange={(e) =>
                                                setPricingList((prev) =>
                                                    prev.map((item) =>
                                                        item.id === p.id
                                                            ? { ...item, newCreditCost: Number(e.target.value) }
                                                            : item
                                                    )
                                                )
                                            }
                                            className="w-24 border rounded px-2 py-1"
                                        />
                                        {errors[p.id]?.creditCost && (
                                            <p className="text-sm text-red-500">{errors[p.id].creditCost}</p>
                                        )}
                                    </td>

                                    {/* VNĐ Cost */}
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={p.newVndCost}
                                            onChange={(e) =>
                                                setPricingList((prev) =>
                                                    prev.map((item) =>
                                                        item.id === p.id
                                                            ? { ...item, newVndCost: Number(e.target.value) }
                                                            : item
                                                    )
                                                )
                                            }
                                            className="w-24 border rounded px-2 py-1"
                                        />
                                        {errors[p.id]?.vndCost && (
                                            <p className="text-sm text-red-500">{errors[p.id].vndCost}</p>
                                        )}
                                    </td>

                                    {/* Effective From */}
                                    <td className="px-4 py-2">
                                        <input
                                            type="datetime-local"
                                            value={p.effectiveFrom}
                                            onChange={(e) =>
                                                setPricingList((prev) =>
                                                    prev.map((item) =>
                                                        item.id === p.id
                                                            ? { ...item, effectiveFrom: e.target.value }
                                                            : item
                                                    )
                                                )
                                            }
                                            className="border rounded px-2 py-1"
                                        />
                                    </td>

                                    {/* Button Lưu */}
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleSave(p.id)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                            Lưu
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ComponentCard>
        </>
    );
}
