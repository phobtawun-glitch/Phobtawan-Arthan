import { useEffect, useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getReportReasons, createReport, ReportReason, } from "@/connectAPI/callPost_Reports.js";

interface ReportDialogProps {
  postId: string;
  onClose: () => void;
}

const ReportDialog = ({ postId, onClose }: ReportDialogProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadReportReasons = async () => {
      try {
        const data = await getReportReasons();
        setReportReasons(data);
      } catch (error) {
        console.error("LOAD REPORT REASONS ERROR =", error);

        toast({
          title: "ไม่สามารถโหลดเหตุผลการรายงานได้",
          variant: "destructive",
        });
      }
    };

    loadReportReasons();
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (!user?.id) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const now = new Date();
      const reportDate =
        now.toISOString().split("T")[0];
      const reportTime =
        now.toTimeString().split(" ")[0];
      await createReport({
        Post_Report_Date: reportDate,
        Post_Report_Time: reportTime,
        // รายละเอียดเพิ่มเติม
        Reason: detail,
        // คนที่รายงาน
        Member_ID: Number(user.id),
        // โพสต์ที่ถูกรายงาน
        Post_ID: Number(postId),
        // เหตุผลจากตาราง reports
        Report_ID: Number(selectedReason),
        // ยังไม่มี Admin
        Admin_ID: null,
      });
      toast({
        title: "ส่งรายงานเรียบร้อย",
        description: "ทีมงานจะตรวจสอบโพสต์นี้โดยเร็ว",
      });
      onClose();
    } catch (error: any) {
      console.error(
        "CREATE REPORT ERROR =",
        error
      );
      toast({
        title: "ไม่สามารถส่งรายงานได้",
        description:
          error?.response?.data?.error ||
          "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-urgent" />
            <h3 className="font-semibold text-foreground">รายงานโพสต์</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {reportReasons.map((reason) => (
            <label
              key={reason.Report_ID}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedReason === String(reason.Report_ID)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-secondary'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={reason.Report_ID}
                checked={
                  selectedReason === String(reason.Report_ID)
                }
                onChange={() =>
                  setSelectedReason(String(reason.Report_ID))
                }
                className="accent-primary"
              />

              <span className="text-sm text-foreground">
                {reason.Report_Name}
              </span>
            </label>
          ))}
          <textarea
            placeholder="รายละเอียดเพิ่มเติม..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full p-3 rounded-lg border border-input bg-background text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!selectedReason || loading}>
            {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ReportDialog;