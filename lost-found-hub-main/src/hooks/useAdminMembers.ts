import { useEffect, useState } from 'react';
import axios from '@/connectAPI/axios';

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  gender: string;
  postCount: number;

  // สถานะจาก Login ล่าสุด
  status: 'online' | 'offline';
  loginState: string | null;

  // ข้อมูลการระงับ
  suspended: boolean;
  suspendedDate: string | null;
  suspendedTime: string | null;
  reasonSuspended?: string | null;
  adminId: number | null;

  lastLoginDate: string | null;
  lastLoginTime: string | null;
}

// ==========================================
// ดึงสมาชิกที่ยังไม่ถูกระงับจาก Database
// ==========================================
export const useAdminMembers = () => {
  const [members, setMembers] = useState<AdminMember[]>([]);

  const loadMembers = async () => {
    try {
      const response = await axios.get('/admin/members');

      if (response.data?.success) {
        setMembers(response.data.data ?? []);
      }
    } catch (error: any) {
      console.error(
        'LOAD ADMIN MEMBERS ERROR:',
        error?.response?.data || error
      );

      setMembers([]);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return members;
};

// ==========================================
// ระงับสมาชิก
// ส่ง Member_ID, Admin_ID และเหตุผลไป Backend
// ==========================================
export const setMemberSuspended = async (
  memberId: string,
  reason: string
) => {
  const admin = JSON.parse(
    localStorage.getItem('admin') || '{}'
  );

  if (!admin.Admin_ID) {
    throw new Error(
      'ไม่พบ Admin_ID กรุณาเข้าสู่ระบบ Admin ใหม่'
    );
  }

  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    throw new Error('กรุณาระบุเหตุผลในการระงับสมาชิก');
  }

  const response = await axios.put(
    `/admin/members/${memberId}/suspend`,
    {
      adminId: admin.Admin_ID,
      reason: trimmedReason,
    }
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'ไม่สามารถระงับสมาชิกได้'
    );
  }

  return response.data;
};

// ==========================================
// ดึงสมาชิกที่ถูกระงับ
// ==========================================
export const useAdminSuspendedMembers = () => {
  const [members, setMembers] = useState<AdminMember[]>([]);

  const loadMembers = async () => {
    try {
      const response = await axios.get(
        '/admin/suspended-members'
      );

      if (response.data?.success) {
        setMembers(response.data.data ?? []);
      }
    } catch (error: any) {
      console.error(
        'LOAD SUSPENDED MEMBERS ERROR:',
        error?.response?.data || error
      );

      setMembers([]);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return members;
};

// ==========================================
// ปลดระงับสมาชิก
// ==========================================
export const setMemberUnsuspended = async (
  memberId: string,
  reason: string
) => {
  const admin = JSON.parse(
    localStorage.getItem('admin') || '{}'
  );

  if (!admin.Admin_ID) {
    throw new Error('ไม่พบ Admin_ID กรุณาเข้าสู่ระบบใหม่');
  }

  if (!reason.trim()) {
    throw new Error('กรุณาระบุเหตุผลในการปลดระงับ');
  }

  const response = await axios.put(
    `/admin/suspended-members/${memberId}/unsuspend`,
    {
      adminId: admin.Admin_ID,
      reason: reason.trim(),
    }
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || 'ไม่สามารถปลดระงับสมาชิกได้'
    );
  }

  return response.data;
};