import React, { useState, useEffect } from 'react';
import { getExpenseReport, getExpenseReportPdf, emailExpenseReport } from './services/api';
import toast from 'react-hot-toast';

const ExpenseReportSection = () => {
  const today = new Date();

  // Format date as yyyy-mm-dd adjusted for India Standard Time (+5:30)
  function formatDateIST(date) {
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const todayISO = formatDateIST(today);
  const firstDayCurrentMonth = formatDateIST(new Date(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [startDate, setStartDate] = useState(firstDayCurrentMonth);
  const [endDate, setEndDate] = useState(todayISO);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // Ensure endDate never goes before startDate
  useEffect(() => {
    if (startDate && endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    setReport([]);
    const toastId = toast.loading('Fetching report...');
    try {
      const res = await getExpenseReport({ startDate, endDate });
      setReport(res.data);
      toast.success('Report fetched successfully', { id: toastId });
    } catch (e) {
      toast.error('Could not fetch report: ' + (e.response?.data?.error || e.message), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    const toastId = toast.loading('Generating PDF...');
    try {
      const response = await getExpenseReportPdf({ startDate, endDate });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Expense_Report_${startDate}_to_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to download PDF: ' + (error.response?.data?.error || error.message), { id: toastId });
    }
  };

  const handleEmailPdf = async () => {
    setEmailLoading(true);
    const toastId = toast.loading('Sending email...');
    try {
      await emailExpenseReport({ startDate, endDate });
      toast.success('PDF Report sent to your email successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to send email: ' + (error.response?.data?.error || error.message), { id: toastId });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-4">
      <h2 className="text-lg font-semibold mb-4 text-white">Expense Report (By Category)</h2>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="text-gray-300 mr-2">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={todayISO}
            className="bg-gray-900 text-white p-2 rounded"
          />
        </div>
        <div>
          <label className="text-gray-300 mr-2">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            max={todayISO}
            className="bg-gray-900 text-white p-2 rounded"
          />
        </div>
        <button
          className="bg-emerald-500 text-white py-2 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors"
          onClick={fetchReport}
          disabled={loading || !startDate}
        >
          {loading ? 'Fetching…' : 'Generate'}
        </button>

        <button
          aria-label="Download PDF"
          title="Download PDF"
          className="bg-blue-600 text-white py-2 px-4 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          onClick={downloadPdf}
          disabled={!startDate || !endDate}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8" />
          </svg>
        </button>

        <button
          aria-label="Email PDF"
          title="Email PDF"
          className="bg-purple-600 text-white py-2 px-4 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          onClick={handleEmailPdf}
          disabled={!startDate || !endDate || emailLoading}
        >
          {emailLoading ? (
            <span>Sending...</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Email PDF
            </>
          )}
        </button>

      </div>

      {!loading && report.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white font-medium mb-2">Category Totals:</h3>
          <ul className="divide-y divide-gray-700">
            {report.map((r) => (
              <li key={r._id} className="py-3 flex justify-between items-center">
                <span className="text-gray-200 font-semibold">{r._id}</span>
                <span className="text-emerald-400 font-bold">
                  ₹{Number(r.totalAmount).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && report.length === 0 && (
        <p className="text-gray-400 mt-4">No data to display for selected range.</p>
      )}
    </div>
  );
};

export default ExpenseReportSection;
