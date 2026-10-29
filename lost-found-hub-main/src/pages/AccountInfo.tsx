import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Calendar, FileText, CheckCircle, XCircle, LogOut } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { mockPosts } from '@/data/mockData';

const AccountInfo = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) { navigate('/login'); return null; }

  const myPosts = mockPosts.filter(p => p.authorId === user?.id);
  const totalPosts = myPosts.length;
  const returnedPosts = myPosts.filter(p => p.status === 'returned').length;
  const notReturnedPosts = myPosts.filter(p => p.status === 'expired').length;

  const isLineAccount = user?.email?.includes('line.me');
  const accountData = isLineAccount
    ? {
        name: 'Somchai Jaidee',
        gender: '-',
        contactLabel: 'Line ID',
        contactValue: '@somchai_jaidee',
        joinDate: '10/03/2026',
      }
    : {
        name: user?.name || 'สมชาย',
        gender: user?.gender || 'ชาย',
        contactLabel: 'Gmail',
        contactValue: user?.email || 'somchai@gmail.com',
        joinDate: '15/01/2026',
      };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">ข้อมูลบัญชี</h1>

        {/* Profile Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{accountData.name}</h2>
              <p className="text-sm text-muted-foreground">{isLineAccount ? 'บัญชี Line' : 'บัญชี Gmail'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">ชื่อ-นามสกุล</p>
                <p className="text-sm font-medium text-foreground">{accountData.name}</p>
              </div>
            </div>
            {accountData.gender !== '-' && (
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">เพศ</p>
                  <p className="text-sm font-medium text-foreground">{accountData.gender}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{accountData.contactLabel}</p>
                <p className="text-sm font-medium text-foreground">{accountData.contactValue}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">วันที่สมัคร</p>
                <p className="text-sm font-medium text-foreground">{accountData.joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">สถิติโพสต์</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">โพสต์ทั้งหมด</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <CheckCircle className="w-5 h-5 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{returnedPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">ได้รับคืน</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <XCircle className="w-5 h-5 text-urgent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{notReturnedPosts}</p>
              <p className="text-xs text-muted-foreground mt-1">ไม่ได้รับคืน</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountInfo;
