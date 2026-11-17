
import React, { useState, useEffect } from "react";
import Api from "../../API/ApiServece";
import ApiServece from "../../API/ApiServece";

const DoctorApprovels = () => {
  const [adminApprovel, setAdminApprovel] = useState([]);

  const getApprovel = async () => {
    try {
      const response = await ApiServece.getDocterList();
      setAdminApprovel(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getApprovel();
  }, []);

  const handleApproved = async (id, status)=>{
        try {
            const response = await ApiServece.approvelStatus(id, status)
            console.log("response.data",response?.data);
            
            getApprovel()
        } catch (error) {
            console.log(error);
            
        }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Doctor Approvals
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review doctor details and verify their certificates.
        </p>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

        {adminApprovel?.map((data) => (
          <div
            key={data?.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >

            {/* Card Header */}
            <div className="border-b border-slate-100 bg-blue-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                  {data?.name?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {data?.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Doctor Application
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Section */}
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">
                  Certificates
                </h3>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {data?.doctorProfile?.certificates?.length || 0} Documents
                </span>
              </div>

              <div className="space-y-3">
                {data?.doctorProfile?.certificates?.length > 0 ? (
                  data.doctorProfile.certificates.map((item) => (
                    <div
                      key={item?.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {item?.certificate_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Verification Document
                        </p>
                      </div>

                      <a
                        href={`http://localhost:3000${item?.certificate_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        View
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-400">
                    No certificates uploaded
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700" onClick={()=> handleApproved(data?.doctorProfile?.id, true)}>
                  Approve
                </button>

                <button className="flex-1 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100" onClick={()=> handleApproved(data?.doctorProfile?.id, false)}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Empty State */}
      {adminApprovel.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-slate-700">
            No doctor applications found
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Doctor applications will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorApprovels;
