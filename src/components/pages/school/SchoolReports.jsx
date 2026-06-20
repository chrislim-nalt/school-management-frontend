import React, { useState } from "react";
import { getDailyReport, getWeeklyReport, getMonthlyReport, getYearlyReport } from "../../services/schoolService";
import DownloadButton from "../../DownloadButton";

export default function SchoolReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState("daily");
  const [dateRange, setDateRange] = useState({
    date: new Date().toISOString().split('T')[0],
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      let res;
      if (reportType === "daily") {
        res = await getDailyReport(dateRange.date);
      } else if (reportType === "weekly") {
        res = await getWeeklyReport(dateRange.startDate, dateRange.endDate);
      } else if (reportType === "monthly") {
        res = await getMonthlyReport(dateRange.month, dateRange.year);
      } else {
        res = await getYearlyReport(dateRange.year);
      }
      setReportData(res.data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReportData = reportData ? (() => {
    if (reportType === "daily") {
      return [{
        date: reportData.date,
        studentPresent: reportData.studentAttendance?.present,
        studentAbsent: reportData.studentAttendance?.absent,
        teacherPresent: reportData.teacherAttendance?.present,
        teacherAbsent: reportData.teacherAttendance?.absent,
        transportTrips: reportData.transport?.totalTrips
      }];
    } else if (reportType === "weekly") {
      return Object.entries(reportData.dailyBreakdown || {}).map(([date, data]) => ({
        date, studentPresent: data.studentPresent, transportTrips: data.transportTrips
      }));
    } else if (reportType === "monthly") {
      return [{
        month: `${dateRange.month}/${dateRange.year}`,
        averageScore: reportData.performance?.averageScore,
        studentAttendance: reportData.attendance?.studentAttendance,
        transportRevenue: reportData.finance?.transportRevenue
      }];
    } else {
      return reportData.monthlyBreakdown || [];
    }
  })() : [];

  const exportColumns = reportType === "daily" ? [
    { key: "date", label: "Date" }, { key: "studentPresent", label: "Students Present" }, { key: "studentAbsent", label: "Students Absent" }, { key: "teacherPresent", label: "Teachers Present" }, { key: "transportTrips", label: "Transport Trips" }
  ] : reportType === "weekly" ? [
    { key: "date", label: "Date" }, { key: "studentPresent", label: "Students Present" }, { key: "transportTrips", label: "Transport Trips" }
  ] : reportType === "monthly" ? [
    { key: "month", label: "Month" }, { key: "averageScore", label: "Avg Score (%)" }, { key: "studentAttendance", label: "Student Attendance" }, { key: "transportRevenue", label: "Transport Revenue (RWF)" }
  ] : [
    { key: "month", label: "Month" }, { key: "averageScore", label: "Avg Score (%)" }, { key: "attendanceRate", label: "Attendance Rate (%)" }
  ];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl">
        <div className="relative px-5 py-6 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">📊 School Reports</h1>
          <p className="text-slate-300 text-sm">Generate daily, weekly, monthly, and yearly operational reports</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="daily">📅 Daily Report</option><option value="weekly">📆 Weekly Report</option><option value="monthly">📊 Monthly Report</option><option value="yearly">📈 Yearly Report</option></select>
          
          {reportType === "daily" && <input type="date" value={dateRange.date} onChange={(e) => setDateRange({...dateRange, date: e.target.value})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />}
          {reportType === "weekly" && (<><input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /><input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /></>)}
          {reportType === "monthly" && (<><select value={dateRange.month} onChange={(e) => setDateRange({...dateRange, month: parseInt(e.target.value)})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value={1}>January</option><option value={2}>February</option><option value={3}>March</option><option value={4}>April</option><option value={5}>May</option><option value={6}>June</option><option value={7}>July</option><option value={8}>August</option><option value={9}>September</option><option value={10}>October</option><option value={11}>November</option><option value={12}>December</option></select><input type="number" value={dateRange.year} onChange={(e) => setDateRange({...dateRange, year: parseInt(e.target.value)})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24" /></>)}
          {reportType === "yearly" && <input type="number" value={dateRange.year} onChange={(e) => setDateRange({...dateRange, year: parseInt(e.target.value)})} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32" />}
          
          <button onClick={generateReport} disabled={loading} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm disabled:opacity-50">📈 Generate Report</button>
        </div>
      </div>

      {reportData && (
        <>
          <div className="bg-white rounded-xl shadow-lg p-4"><div className="flex justify-between items-center"><h3 className="font-semibold text-slate-800">Export Report</h3><DownloadButton data={exportReportData} columns={exportColumns} title={`School Report - ${reportType}`} filename={`school_report_${reportType}_${Date.now()}`} variant="primary" /></div></div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-slate-50 to-slate-100"><h2 className="font-bold text-slate-800">{reportType.toUpperCase()} Report</h2></div>
            <div className="p-5 space-y-4">
              {reportType === "daily" && reportData && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{reportData.studentAttendance?.present}</p><p className="text-sm text-slate-600">Students Present</p></div><div className="bg-rose-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-rose-600">{reportData.studentAttendance?.absent}</p><p className="text-sm text-slate-600">Students Absent</p></div><div className="bg-blue-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-blue-600">{reportData.transport?.totalTrips}</p><p className="text-sm text-slate-600">Transport Trips</p></div></div>)}
              
              {reportType === "weekly" && reportData && (<><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{reportData.summary?.totalStudentAttendance}</p><p className="text-sm text-slate-600">Total Student Attendance</p></div><div className="bg-amber-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-amber-600">{reportData.summary?.totalTransportPayments?.toLocaleString()} RWF</p><p className="text-sm text-slate-600">Transport Payments</p></div></div><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold">Date</th><th className="px-3 py-2 text-left text-xs font-semibold">Students Present</th><th className="px-3 py-2 text-left text-xs font-semibold">Transport Trips</th></tr></thead><tbody>{Object.entries(reportData.dailyBreakdown || {}).map(([date, data]) => (<tr key={date} className="hover:bg-slate-50"><td className="px-3 py-2 text-sm">{date}</td><td className="px-3 py-2 text-sm">{data.studentPresent}</td><td className="px-3 py-2 text-sm">{data.transportTrips}</td></tr>))}</tbody></table></div></>)}
              
              {reportType === "monthly" && reportData && (<><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-purple-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-purple-600">{reportData.performance?.averageScore}%</p><p className="text-sm text-slate-600">Average Score</p></div><div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{reportData.attendance?.studentAttendance}</p><p className="text-sm text-slate-600">Student Attendance</p></div><div className="bg-amber-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-amber-600">{reportData.finance?.transportRevenue?.toLocaleString()} RWF</p><p className="text-sm text-slate-600">Transport Revenue</p></div></div><div><p className="font-semibold text-slate-700 mb-2">Grade Distribution</p><div className="space-y-2">{Object.entries(reportData.performance?.gradeDistribution || {}).map(([grade, count]) => (<div key={grade} className="flex items-center gap-2"><div className="w-8 text-sm font-bold">{grade}</div><div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${grade === "A" ? "bg-emerald-500" : grade === "B" ? "bg-blue-500" : grade === "C" ? "bg-amber-500" : grade === "D" ? "bg-orange-500" : "bg-rose-500"}`} style={{ width: `${(count / (reportData.performance?.totalExams || 1) * 100)}%` }} /></div><div className="w-12 text-sm">{count}</div></div>))}</div></div></>)}
              
              {reportType === "yearly" && reportData && (<><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="bg-indigo-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-indigo-600">{reportData.summary?.totalStudents}</p><p className="text-sm text-slate-600">Total Students</p></div><div className="bg-purple-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-purple-600">{reportData.summary?.averageScore}%</p><p className="text-sm text-slate-600">Avg Score</p></div><div className="bg-emerald-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{reportData.summary?.totalAttendanceRecords}</p><p className="text-sm text-slate-600">Attendance Records</p></div><div className="bg-amber-50 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-amber-600">{reportData.summary?.totalTransportRevenue?.toLocaleString()} RWF</p><p className="text-sm text-slate-600">Transport Revenue</p></div></div><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left text-xs font-semibold">Month</th><th className="px-3 py-2 text-left text-xs font-semibold">Average Score (%)</th><th className="px-3 py-2 text-left text-xs font-semibold">Attendance Rate (%)</th></tr></thead><tbody>{reportData.monthlyBreakdown?.map((month, idx) => (<tr key={idx} className="hover:bg-slate-50"><td className="px-3 py-2 text-sm">Month {month.month}</td><td className="px-3 py-2 text-sm">{month.averageScore}</td><td className="px-3 py-2 text-sm">{month.attendanceRate}</td></tr>))}</tbody></table></div></>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}