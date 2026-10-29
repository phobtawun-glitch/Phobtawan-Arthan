import AdminLayout from '@/components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Users, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useEffect, useMemo, useState } from 'react';
import { useAdminMembers } from '@/hooks/useAdminMembers';
import axios from '@/connectAPI/axios';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
type Row = { label: string; posts: number; users: number; returned: number; notReturned: number; unclaimed: number };

const sumRows = (rows: Row[]): Omit<Row, 'label'> => ({
  posts: rows.reduce((total, row) => total + row.posts, 0),
  users: rows.reduce((total, row) => total + row.users, 0),
  returned: rows.reduce((total, row) => total + row.returned, 0),
  notReturned: rows.reduce((total, row) => total + row.notReturned, 0),
  unclaimed: rows.reduce((total, row) => total + row.unclaimed, 0),
});

const selectCls = 'h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const AdminDashboard = () => {
  const [yearly, setYearly] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    posts: 0,
    members: 0,
    returned: 0,
    notReturned: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [year, setYear] = useState('');
  const [provMonth, setProvMonth] = useState('');
  const [chartData, setChartData] = useState<Row[]>([]);
  const [provinceData, setProvinceData] = useState<{ province: string; posts: number }[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  const [monthsByYear, setMonthsByYear] = useState<Record<number, number[]>>({});
  const totals = useMemo(() => sumRows(chartData), [chartData]);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoadingStats(true);
        const response = await axios.get('/admin/dashboard/stats');
        console.log('===== ADMIN DASHBOARD STATS =====');
        console.log(response.data);
        if (response.data?.success) {
          setDashboardStats({
            posts: Number(response.data.stats?.posts ?? 0),
            members: Number(response.data.stats?.members ?? 0),
            returned: Number(response.data.stats?.returned ?? 0),
            notReturned: Number(response.data.stats?.notReturned ?? 0),
          });
        }
      } catch (error: any) {console.error('LOAD ADMIN DASHBOARD STATS ERROR:', error?.response?.data || error);
      } finally {
        setLoadingStats(false);
      }
    };
    loadDashboardStats();
  }, []);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        if (yearly) {
          // =========================
          // รายปี
          // =========================
          const response = await axios.get('/admin/dashboard/yearly');

          console.log('===== ADMIN DASHBOARD YEARLY =====');
          console.log(response.data);

          if (response.data?.success) {
            const data: Row[] = response.data.data.map((row: any) => ({
              label: String(row.year),
              posts: Number(row.posts ?? 0),
              users: Number(row.users ?? 0),
              returned: Number(row.returned ?? 0),
              notReturned: Number(row.notReturned ?? 0),
              unclaimed: Number(row.unclaimed ?? 0),
            }));

            // ถ้าเลือก "ทุกปี" → แสดงทุกปี
            // ถ้าเลือกปี → แสดงเฉพาะปีนั้น
            setChartData(
              year
                ? data.filter((row) => row.label === year)
                : data
            );
          }

          return;
        }

        // =========================
        // รายเดือน
        // =========================
        let url = '/admin/dashboard/monthly';

        // ถ้าเลือกปี → ส่งปีไป Backend
        // ถ้า "ทุกปี" → ไม่ส่ง year
        if (year) {
          url += `?year=${year}`;
        }

        console.log('===== ADMIN DASHBOARD MONTHLY URL =====');
        console.log(url);

        const response = await axios.get(url);

        console.log('===== ADMIN DASHBOARD MONTHLY =====');
        console.log(response.data);

        if (response.data?.success) {
          const data: Row[] = response.data.data.map((row: any) => ({
            label: MONTHS[Number(row.month) - 1] ?? '-',
            posts: Number(row.posts ?? 0),
            users: Number(row.users ?? 0),
            returned: Number(row.returned ?? 0),
            notReturned: Number(row.notReturned ?? 0),
            unclaimed: Number(row.unclaimed ?? 0),
          }));

          setChartData(data);
        } else {
          setChartData([]);
        }
      } catch (error: any) {
        console.error(
          'LOAD ADMIN DASHBOARD CHART ERROR:',
          error?.response?.data || error
        );

        setChartData([]);
      }
    };

    loadChartData();
  }, [yearly, year]);

  useEffect(() => {
    const loadProvinceData = async () => {
      try {
        let url = '/admin/dashboard/provinces';
        const params = new URLSearchParams();
        if (year) {
          params.append('year', year);
        }
        if (!yearly && provMonth !== '') {
          params.append('month', String(Number(provMonth)));
        }
        const query = params.toString();
        if (query) {
          url += `?${query}`;
        }
        console.log('===== LOAD PROVINCE DATA =====');
        console.log('URL:', url);
        const response = await axios.get(url);
        console.log('===== ADMIN DASHBOARD PROVINCES =====');
        console.log(response.data);
        if (response.data?.success) {
          setProvinceData(
            response.data.data.map((row: any) => ({
              province: row.province ?? 'ไม่ระบุจังหวัด',
              posts: Number(row.posts ?? 0),
            }))
          );
        }
      } catch (error: any) {
        console.error(
          'LOAD ADMIN DASHBOARD PROVINCE ERROR:',
          error?.response?.data || error
        );
        setProvinceData([]);
      }
    };
    loadProvinceData();
  }, [year, provMonth, yearly]);

  useEffect(() => {
    const loadAvailablePeriods = async () => {
      try {
        const response = await axios.get('/admin/dashboard/periods');
        console.log('===== AVAILABLE PERIODS =====');
        console.log(response.data);
        if (response.data?.success) {
          const years = response.data.years ?? [];
          const monthsByYearData = response.data.monthsByYear ?? {};
          setAvailableYears(years);
          setMonthsByYear(monthsByYearData);
          // เลือกปีล่าสุดอัตโนมัติ
          if (years.length > 0 && !year) {
            setYear(String(years[0]));
          }
        }
      } catch (error: any) {
        console.error(
          'LOAD AVAILABLE PERIODS ERROR:',
          error?.response?.data || error
        );
      }
    };

    loadAvailablePeriods();
  }, []);

  useEffect(() => {
    if (yearly) {
      setAvailableMonths([]);
      setProvMonth('');
      return;
    }

    let months: number[] = [];

    if (year === '') {
      // ทุกปี → รวมเดือนที่มีข้อมูลจากทุกปี
      months = [
        ...new Set(
          Object.values(monthsByYear).flat()
        )
      ];
    } else {
      // เลือกปี → เฉพาะเดือนที่มีข้อมูลในปีนั้น
      months = monthsByYear[Number(year)] ?? [];
    }

    months.sort((a, b) => a - b);

    setAvailableMonths(months);

    // ตรวจว่าเดือนปัจจุบันยังมีอยู่หรือไม่
    if (
      provMonth !== '' &&
      !months.includes(Number(provMonth))
    ) {
      setProvMonth('');
    }
  }, [year, yearly, monthsByYear]);
  
  const period = yearly ? 'รายปี' : 'รายเดือน';
  const stats = [
    { label: 'โพสต์ทั้งหมด', value: dashboardStats.posts, icon: FileText, color: 'text-primary' },
    { label: 'สมาชิก', value: dashboardStats.members, icon: Users, color: 'text-primary' },
    { label: 'ได้รับคืน', value: dashboardStats.returned, icon: CheckCircle, color: 'text-success' },
    { label: 'ไม่ได้รับคืน', value: dashboardStats.notReturned, icon: AlertTriangle, color: 'text-urgent' },
  ];

  const handleExportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const yearLabel = year ? `ปี ${year}` : 'ทุกปี';
    const monthLabel = !yearly && provMonth !== '' ? MONTHS[Number(provMonth) - 1] : 'ทุกเดือน';
    const periodLabel = yearly ? yearLabel : `${yearLabel} / ${monthLabel}`;
    const chartTitle = yearly ? `สรุปรายปี ${yearLabel}` : `สรุปรายเดือน ${periodLabel}`;
    const provinceTitle = `สถิติรายจังหวัด (${periodLabel})`;
    w.document.write(`
      <html><head><title>รายงานสรุป Lost and Found</title>
       <style>:root{--primary:217 91% 60%;--success:142 76% 36%;--border:214 32% 91%;--muted:210 40% 96%}
       @page{size:A4;margin:18mm}body{font-family:Kanit,sans-serif;color:hsl(215 28% 17%)}
       table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}th,td{border:1px solid hsl(var(--border));padding:6px;text-align:left}th{background:hsl(var(--muted))}h1{color:hsl(var(--primary))}
       @media screen{body{max-width:850px;margin:35px auto}}</style>
      </head><body>
      <h1>รายงานสรุป Lost and Found</h1>
      <p>วันที่ออกรายงาน: ${new Date().toLocaleDateString('en-GB')}</p>
      <p>ช่วงข้อมูล: ${periodLabel}</p>
       <h2>${chartTitle}</h2>
      <table><tr><th>${yearly ? 'ปี' : 'เดือน'}</th><th>โพสต์</th><th>ผู้ใช้งาน</th><th>ได้รับคืน</th><th>ไม่ได้รับคืน</th><th>ไม่มีเจ้าของ</th></tr>
      ${chartData.map(d => `<tr><td>${d.label}</td><td>${d.posts}</td><td>${d.users}</td><td>${d.returned}</td><td>${d.notReturned}</td><td>${d.unclaimed}</td></tr>`).join('')}
       <tr><th>รวม</th><th>${totals.posts}</th><th>${totals.users}</th><th>${totals.returned}</th><th>${totals.notReturned}</th><th>${totals.unclaimed}</th></tr>
      </table>
      <h2>${provinceTitle}</h2>
      <table><tr><th>จังหวัด</th><th>โพสต์</th></tr>
       ${provinceData.map(d => `<tr><td>${d.province}</td><td>${d.posts}</td></tr>`).join('')}
      </table>
       <script>window.onload=()=>{document.fonts.ready.then(()=>window.print())}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">แดชบอร์ด</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-lg shadow-card p-4">
              <div className="flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">ข้อมูลของปี {year || 'ทุกปี'}</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <span className={!yearly ? 'font-medium text-primary' : 'text-muted-foreground'}>รายเดือน</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={yearly ? 'font-medium text-primary' : 'text-muted-foreground'}>รายปี</span>
            </label>
            <select aria-label="เลือกปี" value={year} onChange={e => {setYear(e.target.value); setProvMonth('');}}className={selectCls}><option value="">ทุกปี</option>
              {availableYears.map(y => (<option key={y} value={y}> ปี {y}</option>))}
            </select>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4" /> ส่งออกไฟล์ PDF
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg shadow-card p-4">
            <h3 className="font-medium text-foreground mb-4">จำนวนโพสต์{period}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="posts" name="โพสต์" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4">
            <h3 className="font-medium text-foreground mb-4">แนวโน้มผู้ใช้งาน{period}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="users" name="ผู้ใช้งาน" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
          <div className="space-y-4">
            <div className="bg-card rounded-lg shadow-card p-4 overflow-x-auto">
              <h3 className="font-medium text-foreground mb-4">สรุป{period}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[yearly ? 'ปี' : 'เดือน', 'โพสต์', 'ได้รับคืน', 'ไม่ได้รับคืน', 'ไม่มีเจ้าของ', 'ผู้ใช้งาน'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(d => (
                    <tr key={d.label} className="border-b border-border">
                      <td className="py-2 px-3 font-medium">{d.label}</td>
                      <td className="py-2 px-3">{d.posts}</td>
                      <td className="py-2 px-3 text-success">{d.returned}</td>
                      <td className="py-2 px-3 text-urgent">{d.notReturned}</td>
                      <td className="py-2 px-3">{d.unclaimed}</td>
                      <td className="py-2 px-3">{d.users}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border font-semibold bg-secondary/40">
                    <td className="py-2 px-3">รวม</td>
                    <td className="py-2 px-3">{totals.posts}</td>
                    <td className="py-2 px-3 text-success">{totals.returned}</td>
                    <td className="py-2 px-3 text-urgent">{totals.notReturned}</td>
                    <td className="py-2 px-3">{totals.unclaimed}</td>
                    <td className="py-2 px-3">{totals.users}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-card rounded-lg shadow-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-medium text-foreground">สถิติรายจังหวัด</h3>
                <div className="flex gap-2">
                  {!yearly && (
                    <select value={provMonth} onChange={e => setProvMonth(e.target.value)} className={selectCls}><option value="">ทุกเดือน</option>
                      {availableMonths.map(month => (<option key={month} value={month}>{MONTHS[month - 1]}</option>))}
                    </select>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={provinceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="province" tick={{ fontSize: 12 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="โพสต์" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;