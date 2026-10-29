import postWallet from '@/assets/post-wallet.jpg';
import postIphone from '@/assets/post-iphone.jpg';
import postUmbrella from '@/assets/post-umbrella.jpg';
import postCarkey from '@/assets/post-carkey.jpg';
import postRayban from '@/assets/post-rayban.jpg';
import postNotebook from '@/assets/post-notebook.jpg';
import postAirpods from '@/assets/post-airpods.jpg';
import postRing from '@/assets/post-ring.jpg';
import postBackpack from '@/assets/post-backpack.jpg';
import postIdcard from '@/assets/post-idcard.jpg';
import postWatch from '@/assets/post-watch.jpg';
import postPomeranian from '@/assets/post-pomeranian.jpg';
import postPassport from '@/assets/post-passport.jpg';
import postLaptop from '@/assets/post-laptop.jpg';
import postPinkwallet from '@/assets/post-pinkwallet.jpg';
import postBriefcase from '@/assets/post-briefcase.jpg';
import postSuitcase from '@/assets/post-suitcase.jpg';
import postUmbrellaMulti from '@/assets/post-umbrella-multi.jpg';
import returnPhoto1 from '@/assets/return-photo-1.jpg';
import returnPhoto2 from '@/assets/return-photo-2.jpg';
import returnPhoto3 from '@/assets/return-photo-3.jpg';

export interface Post {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  province: string;
  district: string;
  subdistrict: string;
  gpsCoords?: string;
  gpsPoints?: string[]; // multiple GPS points
  images: string[];
  lostDate: string;
  createdAt: string;
  postedTime: string;
  daysLeft: number;
  status: 'searching' | 'returned' | 'expired' | 'suspended';
  type: 'lost' | 'found';
  authorId: string;
  authorName: string;
  comments: Comment[];
  returnImage?: string;
  returnDate?: string;
  returnTime?: string;
  receiverName?: string;
  receiverContact?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  replyToMemberId?: string;
}

export interface Report {
  id: string;
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  detail: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'suspended';
}

export interface Member {
  id: string;
  name: string;
  email: string;
  gender: string;
  joinedAt: string;
  status: 'active' | 'suspended';
  postCount: number;
  province: string;
}

export const categories = [
  { id: 1, name: 'อิเล็กทรอนิกส์' },
  { id: 2, name: 'กระเป๋า/ของมีค่า' },
  { id: 3, name: 'เอกสารสำคัญ' },
  { id: 4, name: 'กุญแจ' },
  { id: 5, name: 'เสื้อผ้า/เครื่องประดับ' },
  { id: 6, name: 'สัตว์เลี้ยง' },
  { id: 7, name: 'อื่นๆ' },
];

export const provinces = [
  'กรุงเทพมหานคร', 'เชียงใหม่', 'ภูเก็ต', 'ขอนแก่น', 'ชลบุรี',
  'นครราชสีมา', 'สงขลา', 'เชียงราย', 'นนทบุรี', 'ปทุมธานี'
];

// Thai location data (districts and subdistricts for provinces used in posts)
export const locationData: Record<string, Record<string, string[]>> = {
  'กรุงเทพมหานคร': {
    'เขตปทุมวัน': ['แขวงปทุมวัน', 'แขวงรองเมือง', 'แขวงลุมพินี', 'แขวงวังใหม่'],
    'เขตวัฒนา': ['แขวงคลองเตยเหนือ', 'แขวงคลองตันเหนือ', 'แขวงพระโขนงเหนือ'],
    'เขตพระนคร': ['แขวงพระบรมมหาราชวัง', 'แขวงวังบูรพาภิรมย์', 'แขวงวัดราชบพิธ', 'แขวงสำราญราษฎร์', 'แขวงศาลเจ้าพ่อเสือ', 'แขวงเสาชิงช้า', 'แขวงบวรนิเวศ', 'แขวงตลาดยอด', 'แขวงชนะสงคราม', 'แขวงบ้านพานถม', 'แขวงบางขุนพรหม', 'แขวงวัดสามพระยา'],
    'เขตจตุจักร': ['แขวงลาดยาว', 'แขวงเสนานิคม', 'แขวงจันทรเกษม', 'แขวงจอมพล', 'แขวงจตุจักร'],
    'เขตบางรัก': ['แขวงมหาพฤฒาราม', 'แขวงสีลม', 'แขวงสุริยวงศ์', 'แขวงบางรัก', 'แขวงสี่พระยา'],
    'เขตราชเทวี': ['แขวงทุ่งพญาไท', 'แขวงถนนพญาไท', 'แขวงถนนเพชรบุรี', 'แขวงมักกะสัน'],
    'เขตบางเขน': ['แขวงอนุสาวรีย์', 'แขวงท่าแร้ง'],
    'เขตสวนหลวง': ['แขวงสวนหลวง'],
    'เขตคลองเตย': ['แขวงคลองเตย', 'แขวงคลองตัน', 'แขวงพระโขนง'],
    'เขตสัมพันธวงศ์': ['แขวงจักรวรรดิ', 'แขวงสัมพันธวงศ์', 'แขวงตลาดน้อย'],
    'เขตพญาไท': ['แขวงสามเสนใน'],
    'เขตดินแดง': ['แขวงดินแดง'],
    'เขตห้วยขวาง': ['แขวงห้วยขวาง', 'แขวงบางกะปิ', 'แขวงสามเสนนอก'],
    'เขตลาดกระบัง': ['แขวงลาดกระบัง', 'แขวงคลองสองต้นนุ่น', 'แขวงคลองสามประเวศ', 'แขวงลำปลาทิว', 'แขวงทับยาว', 'แขวงขุมทอง'],
    'เขตสาทร': ['แขวงทุ่งวัดดอน', 'แขวงยานนาวา', 'แขวงทุ่งมหาเมฆ'],
    'เขตบางนา': ['แขวงบางนาเหนือ', 'แขวงบางนาใต้'],
  },
  'เชียงใหม่': {
    'อำเภอเมืองเชียงใหม่': ['ตำบลศรีภูมิ', 'ตำบลพระสิงห์', 'ตำบลหายยา', 'ตำบลช้างม่อย', 'ตำบลช้างคลาน', 'ตำบลวัดเกต', 'ตำบลช้างเผือก', 'ตำบลสุเทพ', 'ตำบลแม่เหียะ', 'ตำบลป่าแดด', 'ตำบลหนองหอย', 'ตำบลท่าศาลา', 'ตำบลหนองป่าครั่ง', 'ตำบลฟ้าฮ่าม', 'ตำบลป่าตัน', 'ตำบลสันผีเสื้อ'],
    'อำเภอจอมทอง': ['ตำบลบ้านหลวง', 'ตำบลข่วงเปา', 'ตำบลสบเตี๊ยะ', 'ตำบลดอยแก้ว'],
    'อำเภอแม่แจ่ม': ['ตำบลช่างเคิ่ง', 'ตำบลท่าผา', 'ตำบลบ้านทับ'],
    'อำเภอเชียงดาว': ['ตำบลเชียงดาว', 'ตำบลเมืองนะ', 'ตำบลเมืองคอง'],
    'อำเภอสันทราย': ['ตำบลสันทรายหลวง', 'ตำบลสันทรายน้อย', 'ตำบลสันพระเนตร', 'ตำบลสันนาเม็ง', 'ตำบลสันป่าเปา'],
    'อำเภอหางดง': ['ตำบลหางดง', 'ตำบลหนองแก๋ว', 'ตำบลหารแก้ว', 'ตำบลหนองตอง'],
  },
  'ปทุมธานี': {
    'อำเภอเมืองปทุมธานี': ['ตำบลบางปรอก', 'ตำบลบ้านใหม่', 'ตำบลบ้านกลาง', 'ตำบลบ้านฉาง', 'ตำบลบ้านกระแชง', 'ตำบลบางขะแยง', 'ตำบลบางคูวัด', 'ตำบลบางหลวง'],
    'อำเภอคลองหลวง': ['ตำบลคลองหนึ่ง', 'ตำบลคลองสอง', 'ตำบลคลองสาม', 'ตำบลคลองสี่', 'ตำบลคลองห้า', 'ตำบลคลองหก', 'ตำบลคลองเจ็ด'],
    'อำเภอธัญบุรี': ['ตำบลประชาธิปัตย์', 'ตำบลบึงยี่โถ', 'ตำบลรังสิต', 'ตำบลลำผักกูด', 'ตำบลบึงสนั่น', 'ตำบลบึงน้ำรักษ์'],
    'อำเภอลำลูกกา': ['ตำบลคูคต', 'ตำบลลาดสวาย', 'ตำบลบึงคำพร้อย', 'ตำบลลำลูกกา', 'ตำบลบึงทองหลาง', 'ตำบลลำไทร', 'ตำบลบึงคอไห', 'ตำบลพืชอุดม'],
  },
  'ภูเก็ต': {
    'อำเภอเมืองภูเก็ต': ['ตำบลตลาดใหญ่', 'ตำบลตลาดเหนือ', 'ตำบลเกาะแก้ว', 'ตำบลรัษฎา', 'ตำบลวิชิต', 'ตำบลฉลอง', 'ตำบลราไวย์', 'ตำบลกะรน'],
    'อำเภอกะทู้': ['ตำบลกะทู้', 'ตำบลป่าตอง', 'ตำบลกมลา'],
    'อำเภอถลาง': ['ตำบลเทพกระษัตรี', 'ตำบลศรีสุนทร', 'ตำบลเชิงทะเล', 'ตำบลป่าคลอก', 'ตำบลไม้ขาว', 'ตำบลสาคู'],
  },
  'ขอนแก่น': {
    'อำเภอเมืองขอนแก่น': ['ตำบลในเมือง', 'ตำบลเมืองเก่า', 'ตำบลพระลับ', 'ตำบลสาวะถี', 'ตำบลบ้านทุ่ม', 'ตำบลเมืองเพีย', 'ตำบลบ้านค้อ', 'ตำบลแดงใหญ่'],
    'อำเภอบ้านฝาง': ['ตำบลบ้านฝาง', 'ตำบลป่ามะนาว', 'ตำบลบ้านเหล่า'],
    'อำเภอน้ำพอง': ['ตำบลน้ำพอง', 'ตำบลวังชัย', 'ตำบลหนองกุง'],
  },
  'ชลบุรี': {
    'อำเภอเมืองชลบุรี': ['ตำบลบางปลาสร้อย', 'ตำบลมะขามหย่ง', 'ตำบลบ้านโขด', 'ตำบลแสนสุข', 'ตำบลบ้านสวน', 'ตำบลหนองรี', 'ตำบลนาป่า', 'ตำบลหนองข้างคอก'],
    'อำเภอบางละมุง': ['ตำบลบางละมุง', 'ตำบลหนองปรือ', 'ตำบลหนองปลาไหล', 'ตำบลโป่ง', 'ตำบลเขาไม้แก้ว', 'ตำบลห้วยใหญ่', 'ตำบลตะเคียนเตี้ย', 'ตำบลนาเกลือ'],
    'อำเภอศรีราชา': ['ตำบลศรีราชา', 'ตำบลสุรศักดิ์', 'ตำบลทุ่งสุขลา', 'ตำบลบึง', 'ตำบลหนองขาม', 'ตำบลเขาคันทรง', 'ตำบลบ่อวิน', 'ตำบลบางพระ'],
  },
  'นครราชสีมา': {
    'อำเภอเมืองนครราชสีมา': ['ตำบลในเมือง', 'ตำบลโพธิ์กลาง', 'ตำบลหนองจะบก', 'ตำบลโคกสูง', 'ตำบลมะเริง', 'ตำบลหนองระเวียง', 'ตำบลปรุใหญ่', 'ตำบลหมื่นไวย'],
    'อำเภอปากช่อง': ['ตำบลปากช่อง', 'ตำบลกลางดง', 'ตำบลจันทึก', 'ตำบลวังกะทะ'],
  },
  'สงขลา': {
    'อำเภอเมืองสงขลา': ['ตำบลบ่อยาง', 'ตำบลเขารูปช้าง', 'ตำบลเกาะแต้ว', 'ตำบลพะวง', 'ตำบลทุ่งหวัง'],
    'อำเภอหาดใหญ่': ['ตำบลหาดใหญ่', 'ตำบลควนลัง', 'ตำบลคูเต่า', 'ตำบลคอหงส์', 'ตำบลคลองแห', 'ตำบลคลองอู่ตะเภา', 'ตำบลฉลุง', 'ตำบลทุ่งใหญ่', 'ตำบลทุ่งตำเสา', 'ตำบลท่าข้าม', 'ตำบลน้ำน้อย', 'ตำบลบ้านพรุ', 'ตำบลพะตง'],
  },
  'เชียงราย': {
    'อำเภอเมืองเชียงราย': ['ตำบลเวียง', 'ตำบลรอบเวียง', 'ตำบลบ้านดู่', 'ตำบลนางแล', 'ตำบลแม่ข้าวต้ม', 'ตำบลแม่ยาว', 'ตำบลสันทราย'],
    'อำเภอแม่สาย': ['ตำบลแม่สาย', 'ตำบลห้วยไคร้', 'ตำบลเวียงพางคำ', 'ตำบลโป่งผา', 'ตำบลศรีเมืองชุม', 'ตำบลเกาะช้าง', 'ตำบลโป่งงาม', 'ตำบลบ้านด้าย'],
  },
  'นนทบุรี': {
    'อำเภอเมืองนนทบุรี': ['ตำบลสวนใหญ่', 'ตำบลตลาดขวัญ', 'ตำบลบางเขน', 'ตำบลบางกระสอ', 'ตำบลท่าทราย', 'ตำบลบางไผ่'],
    'อำเภอปากเกร็ด': ['ตำบลปากเกร็ด', 'ตำบลบางตลาด', 'ตำบลบ้านใหม่', 'ตำบลบางพูด', 'ตำบลบางตะไนย์', 'ตำบลคลองพระอุดม', 'ตำบลท่าอิฐ', 'ตำบลเกาะเกร็ด', 'ตำบลอ้อมเกร็ด', 'ตำบลคลองข่อย', 'ตำบลบางพลับ', 'ตำบลคลองเกลือ'],
    'อำเภอบางบัวทอง': ['ตำบลโสนลอย', 'ตำบลบางบัวทอง', 'ตำบลบางรักใหญ่', 'ตำบลบางคูรัด', 'ตำบลลำโพ', 'ตำบลบางรักพัฒนา', 'ตำบลพิมลราช', 'ตำบลบางบัวทอง'],
  },
};

export const reportReasons = [
  'เนื้อหาไม่เหมาะสม',
  'ความปลอดภัยของผู้เยาว์',
  'เนื้อหาทางเพศและความเปลือย',
  'พฤติกรรมการแสดงความเกลียดชัง',
  'เนื้อหาที่รุนแรงและสยดสยอง',
  'สแปมและการหลอกลวง',
];

export const mockPosts: Post[] = [
  {
    id: '1', title: 'กระเป๋าสตางค์สีน้ำตาล', category: 'กระเป๋า/ของมีค่า',
    description: 'กระเป๋าสตางค์หนังสีน้ำตาลเข้ม ยี่ห้อ Coach มีบัตรประชาชนและบัตรเครดิตอยู่ภายใน',
    location: 'ห้างสยามพารากอน ชั้น 3', gpsCoords: '13.7461,100.5347',
    images: [postWallet], lostDate: '10/03/2026',
    createdAt: '12/03/2026', postedTime: '14:30', daysLeft: 26, status: 'searching', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: [
      { id: 'c1', authorId: 'u2', authorName: 'สมหญิง', text: 'เห็นกระเป๋าคล้ายๆ ที่ชั้น 2 ค่ะ ตรงร้านกาแฟ Starbucks ชั้น 2 ฝั่งทิศเหนือ', createdAt: '13/03/2026' }
    ]
  },
  {
    id: '2', title: 'พบโทรศัพท์ iPhone 15', category: 'อิเล็กทรอนิกส์',
    description: 'พบ iPhone 15 สีดำ มีเคสใส ที่ม้านั่งหน้าร้านกาแฟ',
    location: 'ร้านกาแฟ Cafe Amazon สาขา MBK', gpsCoords: '13.7444,100.5300',
    images: [postIphone], lostDate: '11/03/2026',
    createdAt: '11/03/2026', postedTime: '09:15', daysLeft: 25, status: 'searching', type: 'found',
    authorId: 'u2', authorName: 'สมหญิง',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: []
  },
  {
    id: '3', title: 'ร่มสีชมพูลายดอกไม้', category: 'อื่นๆ',
    description: 'ร่มพับสีชมพูลายดอกไม้ ลืมไว้ที่รถไฟฟ้า',
    location: 'สถานีรถไฟฟ้า BTS สยาม', gpsCoords: '13.7453,100.5342',
    images: [postUmbrella], lostDate: '10/03/2026',
    createdAt: '10/03/2026', postedTime: '17:45', daysLeft: 5, status: 'searching', type: 'lost',
    authorId: 'u3', authorName: 'พิมพ์',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: []
  },
  {
    id: '4', title: 'พบกุญแจรถยนต์ Honda', category: 'กุญแจ',
    description: 'พบกุญแจรถ Honda พร้อมพวงกุญแจรูปหมี ที่ลานจอดรถ',
    location: 'ลานจอดรถเซ็นทรัลพลาซา เชียงใหม่', gpsCoords: '18.7883,98.9930',
    images: [postCarkey], lostDate: '09/03/2026',
    createdAt: '09/03/2026', postedTime: '11:20', daysLeft: 3, status: 'searching', type: 'found',
    authorId: 'u4', authorName: 'วิชัย',
    province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', subdistrict: 'ตำบลศรีภูมิ',
    comments: []
  },
  {
    id: '5', title: 'แว่นตา Ray-Ban', category: 'เสื้อผ้า/เครื่องประดับ',
    description: 'แว่นตากันแดง Ray-Ban รุ่น Aviator สีทอง',
    location: 'สวนลุมพินี', gpsCoords: '13.7308,100.5417',
    images: [postRayban], lostDate: '08/03/2026',
    createdAt: '08/03/2026', postedTime: '08:00', daysLeft: 2, status: 'searching', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงลุมพินี',
    comments: []
  },
  {
    id: '6', title: 'พบสมุดบันทึกสีม่วง', category: 'อื่นๆ',
    description: 'สมุดบันทึกปกหนังสีม่วง มีชื่อ "น้องแนน" เขียนไว้',
    location: 'ห้องสมุดมหาวิทยาลัยธรรมศาสตร์', gpsCoords: '14.0723,100.6071',
    images: [postNotebook], lostDate: '07/03/2026',
    createdAt: '07/03/2026', postedTime: '13:10', daysLeft: 21, status: 'searching', type: 'found',
    authorId: 'u5', authorName: 'แนน',
    province: 'ปทุมธานี', district: 'อำเภอคลองหลวง', subdistrict: 'ตำบลคลองหนึ่ง',
    comments: []
  },
  {
    id: '7', title: 'หูฟัง AirPods Pro', category: 'อิเล็กทรอนิกส์',
    description: 'หูฟัง AirPods Pro รุ่น 2 สีขาว เคสมีรอยขีดข่วนเล็กน้อย ลืมไว้ในร้านอาหาร',
    location: 'ร้านอาหารครัวคุณแม่ ซอยอารีย์', gpsCoords: '13.7780,100.5450',
    images: [postAirpods], lostDate: '12/03/2026',
    createdAt: '12/03/2026', postedTime: '19:30', daysLeft: 28, status: 'searching', type: 'lost',
    authorId: 'u2', authorName: 'สมหญิง',
    province: 'กรุงเทพมหานคร', district: 'เขตพญาไท', subdistrict: 'แขวงสามเสนใน',
    comments: []
  },
  {
    id: '8', title: 'พบแหวนทองคำ', category: 'เสื้อผ้า/เครื่องประดับ',
    description: 'พบแหวนทองคำสลักชื่อ มีเพชรเม็ดเล็ก ในห้องน้ำชั้น 2',
    location: 'ห้างเซ็นทรัลเวิลด์ ชั้น 2', gpsCoords: '13.7466,100.5391',
    images: [postRing], lostDate: '14/03/2026',
    createdAt: '14/03/2026', postedTime: '10:45', daysLeft: 30, status: 'searching', type: 'found',
    authorId: 'u3', authorName: 'พิมพ์',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: []
  },
  {
    id: '9', title: 'กระเป๋าเป้สีดำ Nike', category: 'กระเป๋า/ของมีค่า',
    description: 'กระเป๋าเป้สีดำ Nike มีโน้ตบุ๊คและสมุดเรียนอยู่ข้างใน',
    location: 'มหาวิทยาลัยเกษตรศาสตร์ บางเขน', gpsCoords: '13.8476,100.5696',
    images: [postBackpack], lostDate: '13/03/2026',
    createdAt: '13/03/2026', postedTime: '16:20', daysLeft: 27, status: 'searching', type: 'lost',
    authorId: 'u4', authorName: 'วิชัย',
    province: 'กรุงเทพมหานคร', district: 'เขตบางเขน', subdistrict: 'แขวงอนุสาวรีย์',
    comments: []
  },
  {
    id: '10', title: 'บัตรประชาชน', category: 'เอกสารสำคัญ',
    description: 'บัตรประชาชนชื่อ นายสมศักดิ์ ใจดี หายระหว่างเดินทาง',
    location: 'สถานีรถไฟหัวลำโพง', gpsCoords: '13.7380,100.5173',
    images: [postIdcard], lostDate: '15/03/2026',
    createdAt: '15/03/2026', postedTime: '07:00', daysLeft: 22, status: 'searching', type: 'lost',
    authorId: 'u5', authorName: 'แนน',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงรองเมือง',
    comments: []
  },
  {
    id: '11', title: 'พบนาฬิกา Casio', category: 'เสื้อผ้า/เครื่องประดับ',
    description: 'นาฬิกา Casio G-Shock สีน้ำเงิน พบที่สนามกีฬาในมหาวิทยาลัย',
    location: 'สนามกีฬาจุฬาลงกรณ์มหาวิทยาลัย', gpsCoords: '13.7380,100.5327',
    images: [postWatch], lostDate: '11/03/2026',
    createdAt: '11/03/2026', postedTime: '15:00', daysLeft: 18, status: 'searching', type: 'found',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงวังใหม่',
    comments: []
  },
  {
    id: '12', title: 'สุนัขพันธุ์ปอม หายจากบ้าน', category: 'สัตว์เลี้ยง',
    description: 'สุนัขพันธุ์ปอมเมอเรเนียน สีส้ม ชื่อ "มะนาว" หายจากบ้านตั้งแต่เช้า ใส่ปลอกคอสีแดง',
    location: 'ซอยสุขุมวิท 39', gpsCoords: '13.7360,100.5680',
    images: [postPomeranian], lostDate: '16/03/2026',
    createdAt: '16/03/2026', postedTime: '06:30', daysLeft: 29, status: 'searching', type: 'lost',
    authorId: 'u2', authorName: 'สมหญิง',
    province: 'กรุงเทพมหานคร', district: 'เขตวัฒนา', subdistrict: 'แขวงคลองตันเหนือ',
    comments: []
  },
  {
    id: '13', title: 'พบพาสปอร์ตต่างชาติ', category: 'เอกสารสำคัญ',
    description: 'พบพาสปอร์ตชาวญี่ปุ่น ชื่อ Tanaka Yuki ที่เคาน์เตอร์สนามบิน',
    location: 'สนามบินสุวรรณภูมิ', gpsCoords: '13.6900,100.7501',
    images: [postPassport], lostDate: '17/03/2026',
    createdAt: '17/03/2026', postedTime: '12:00', daysLeft: 15, status: 'searching', type: 'found',
    authorId: 'u3', authorName: 'พิมพ์',
    province: 'กรุงเทพมหานคร', district: 'เขตลาดกระบัง', subdistrict: 'แขวงลาดกระบัง',
    comments: []
  },
  {
    id: '14', title: 'Laptop Dell Inspiron', category: 'อิเล็กทรอนิกส์',
    description: 'โน้ตบุ๊ค Dell Inspiron 15 สีเงิน มีสติ๊กเกอร์ติดฝาหลัง ลืมไว้ที่ร้านกาแฟ',
    location: 'Starbucks สาขาสีลม', gpsCoords: '13.7280,100.5340',
    images: [postLaptop], lostDate: '14/03/2026',
    createdAt: '14/03/2026', postedTime: '20:15', daysLeft: 10, status: 'searching', type: 'lost',
    authorId: 'u4', authorName: 'วิชัย',
    province: 'กรุงเทพมหานคร', district: 'เขตบางรัก', subdistrict: 'แขวงสีลม',
    comments: []
  },
  {
    id: '15', title: 'พบกระเป๋าเงินสีชมพู', category: 'กระเป๋า/ของมีค่า',
    description: 'กระเป๋าเงินสีชมพู มีบัตรนักศึกษาและเงินสด พบที่ป้ายรถเมล์',
    location: 'ป้ายรถเมล์หน้า MBK Center', gpsCoords: '13.7447,100.5300',
    images: [postPinkwallet], lostDate: '16/03/2026',
    createdAt: '16/03/2026', postedTime: '18:00', daysLeft: 24, status: 'searching', type: 'found',
    authorId: 'u5', authorName: 'แนน',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: []
  },
  // Post with multi-location GPS (user doesn't know where they lost it)
  {
    id: '25', title: 'ร่มพับสีแดง', category: 'อื่นๆ',
    description: 'ร่มพับสีแดง หายระหว่างเดินทางไปหลายสถานที่ ไม่แน่ใจว่าลืมไว้ที่ไหน เดินทางไป 4 สถานที่ในวันเดียว',
    location: 'ไม่ทราบแน่ชัด (เดินทางหลายที่)',
    gpsCoords: '13.7461,100.5347',
    gpsPoints: ['13.7461,100.5347', '13.7444,100.5300', '13.7466,100.5391', '13.7380,100.5327'],
    images: [postUmbrellaMulti], lostDate: '20/03/2026',
    createdAt: '20/03/2026', postedTime: '21:00', daysLeft: 28, status: 'searching', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: []
  },
  // --- Returned posts (3) ---
  {
    id: '16', title: 'กระเป๋าเอกสารหนังสีดำ', category: 'กระเป๋า/ของมีค่า',
    description: 'กระเป๋าเอกสารหนังสีดำ มีเอกสารสำคัญและแท็บเล็ตอยู่ข้างใน ได้รับคืนจากศูนย์ของหาย',
    location: 'ห้างเซ็นทรัลลาดพร้าว ชั้น B1', gpsCoords: '13.8161,100.5617',
    images: [postBriefcase], lostDate: '01/03/2026',
    createdAt: '01/03/2026', postedTime: '10:00', daysLeft: 0, status: 'returned', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตจตุจักร', subdistrict: 'แขวงจอมพล',
    comments: [
      { id: 'c16a', authorId: 'u3', authorName: 'พิมพ์', text: 'เก็บได้ที่ชั้น B1 ตรงลิฟต์ฝั่งซ้าย ชั้น B1 ห้างเซ็นทรัลลาดพร้าว', createdAt: '02/03/2026' }
    ],
    returnImage: returnPhoto1,
    returnDate: '05/03/2026',
    returnTime: '14:30',
  },
  {
    id: '17', title: 'พบกุญแจบ้าน', category: 'กุญแจ',
    description: 'พบกุญแจบ้านพวง 3 ดอก มีพวงกุญแจตุ๊กตาหมี ได้ส่งคืนเจ้าของแล้ว',
    location: 'ตลาดนัดจตุจักร โซน 2', gpsCoords: '13.7999,100.5533',
    images: [postCarkey], lostDate: '25/02/2026',
    createdAt: '25/02/2026', postedTime: '14:30', daysLeft: 0, status: 'returned', type: 'found',
    authorId: 'u2', authorName: 'สมหญิง',
    province: 'กรุงเทพมหานคร', district: 'เขตจตุจักร', subdistrict: 'แขวงจตุจักร',
    comments: [],
    returnImage: returnPhoto2,
    returnDate: '28/02/2026',
    returnTime: '16:00',
    receiverName: 'นายประสิทธิ์ จันทร์แก้ว',
    receiverContact: '089-123-4567',
  },
  {
    id: '18', title: 'แว่นสายตา Rayban', category: 'เสื้อผ้า/เครื่องประดับ',
    description: 'แว่นสายตา Rayban กรอบสีดำ ได้รับคืนจากผู้เก็บได้ที่แจ้งผ่านระบบ',
    location: 'คณะวิศวกรรมศาสตร์ จุฬาฯ', gpsCoords: '13.7372,100.5327',
    images: [postRayban], lostDate: '20/02/2026',
    createdAt: '20/02/2026', postedTime: '09:45', daysLeft: 0, status: 'returned', type: 'lost',
    authorId: 'u4', authorName: 'วิชัย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงวังใหม่',
    comments: [
      { id: 'c18a', authorId: 'u5', authorName: 'แนน', text: 'เก็บได้ตรงม้านั่งหน้าตึก 3 ชั้น 1 คณะวิศวกรรมศาสตร์', createdAt: '21/02/2026' }
    ],
    returnImage: returnPhoto3,
    returnDate: '22/02/2026',
    returnTime: '11:00',
  },
  // --- Expired (not returned) posts (3) ---
  {
    id: '19', title: 'โทรศัพท์ Samsung Galaxy', category: 'อิเล็กทรอนิกส์',
    description: 'โทรศัพท์ Samsung Galaxy S24 สีม่วง ทำหายที่ห้างฯ ไม่ได้รับคืนภายในกำหนด',
    location: 'ห้างสยามเซ็นเตอร์ ชั้น 4', gpsCoords: '13.7459,100.5322',
    images: [postIphone], lostDate: '10/02/2026',
    createdAt: '10/02/2026', postedTime: '16:00', daysLeft: 0, status: 'expired', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตปทุมวัน', subdistrict: 'แขวงปทุมวัน',
    comments: [],
  },
  {
    id: '20', title: 'พบสร้อยคอทอง', category: 'เสื้อผ้า/เครื่องประดับ',
    description: 'พบสร้อยคอทองคำลายบรรจง ไม่มีเจ้าของมาติดต่อรับคืนภายใน 30 วัน',
    location: 'ท่าเรือสาทร', gpsCoords: '13.7215,100.5136',
    images: [postRing], lostDate: '05/02/2026',
    createdAt: '05/02/2026', postedTime: '07:30', daysLeft: 0, status: 'expired', type: 'found',
    authorId: 'u3', authorName: 'พิมพ์',
    province: 'กรุงเทพมหานคร', district: 'เขตสาทร', subdistrict: 'แขวงยานนาวา',
    comments: [],
  },
  {
    id: '21', title: 'กระเป๋าถือ Louis Vuitton', category: 'กระเป๋า/ของมีค่า',
    description: 'กระเป๋าถือ LV ลาย Monogram ทำหายที่สนามบิน ไม่ได้รับคืนภายในกำหนด',
    location: 'สนามบินดอนเมือง', gpsCoords: '13.9126,100.6067',
    images: [postPinkwallet], lostDate: '01/02/2026',
    createdAt: '01/02/2026', postedTime: '22:15', daysLeft: 0, status: 'expired', type: 'lost',
    authorId: 'u5', authorName: 'แนน',
    province: 'กรุงเทพมหานคร', district: 'เขตดินแดง', subdistrict: 'แขวงดินแดง',
    comments: [],
  },
  // --- Suspended posts (3) ---
  {
    id: '22', title: 'iPhone 16 Pro Max', category: 'อิเล็กทรอนิกส์',
    description: 'โพสต์ถูกระงับเนื่องจากมีเนื้อหาไม่เหมาะสม',
    location: 'ห้างไอคอนสยาม ชั้น 5', gpsCoords: '13.7268,100.5100',
    images: [postIphone], lostDate: '18/03/2026',
    createdAt: '18/03/2026', postedTime: '11:00', daysLeft: 0, status: 'suspended', type: 'lost',
    authorId: 'u2', authorName: 'สมหญิง',
    province: 'กรุงเทพมหานคร', district: 'เขตคลองเตย', subdistrict: 'แขวงคลองเตย',
    comments: [],
  },
  {
    id: '23', title: 'พบเครื่องคิดเลข', category: 'อิเล็กทรอนิกส์',
    description: 'โพสต์ถูกระงับเนื่องจากเป็นสแปม',
    location: 'ม.ธรรมศาสตร์ ท่าพระจันทร์', gpsCoords: '13.7594,100.4920',
    images: [postLaptop], lostDate: '19/03/2026',
    createdAt: '19/03/2026', postedTime: '08:45', daysLeft: 0, status: 'suspended', type: 'found',
    authorId: 'u4', authorName: 'วิชัย',
    province: 'กรุงเทพมหานคร', district: 'เขตพระนคร', subdistrict: 'แขวงพระบรมมหาราชวัง',
    comments: [],
  },
  {
    id: '24', title: 'กระเป๋าเดินทาง Rimowa', category: 'กระเป๋า/ของมีค่า',
    description: 'โพสต์ถูกระงับเนื่องจากมีข้อมูลเท็จ',
    location: 'สถานีขนส่งหมอชิต 2', gpsCoords: '13.8030,100.5510',
    images: [postSuitcase], lostDate: '20/03/2026',
    createdAt: '20/03/2026', postedTime: '15:30', daysLeft: 0, status: 'suspended', type: 'lost',
    authorId: 'u1', authorName: 'สมชาย',
    province: 'กรุงเทพมหานคร', district: 'เขตจตุจักร', subdistrict: 'แขวงจตุจักร',
    comments: [],
  },
];

export const mockReports: Report[] = [
  {
    id: 'r1', postId: '3', postTitle: 'ร่มสีชมพูลายดอกไม้',
    reporterId: 'u2', reporterName: 'สมหญิง',
    reason: 'สแปมและการหลอกลวง', detail: 'โพสต์ซ้ำหลายครั้ง',
    createdAt: '12/03/2026', status: 'pending'
  },
  {
    id: 'r2', postId: '22', postTitle: 'iPhone 16 Pro Max',
    reporterId: 'u3', reporterName: 'พิมพ์',
    reason: 'เนื้อหาไม่เหมาะสม', detail: 'มีคำหยาบคายในรายละเอียด',
    createdAt: '18/03/2026', status: 'suspended'
  },
  {
    id: 'r3', postId: '23', postTitle: 'พบเครื่องคิดเลข',
    reporterId: 'u1', reporterName: 'สมชาย',
    reason: 'สแปมและการหลอกลวง', detail: 'โพสต์ซ้ำหลายรอบ ข้อมูลไม่ตรง',
    createdAt: '19/03/2026', status: 'suspended'
  },
];

export const mockMembers: Member[] = [
  { id: 'u1', name: 'สมชาย มีนา', email: 'somchai@gmail.com', gender: 'ชาย', joinedAt: '15/01/2026', status: 'active', postCount: 5, province: 'กรุงเทพมหานคร' },
  { id: 'u2', name: 'สมหญิง ใจดี', email: 'somying@gmail.com', gender: 'หญิง', joinedAt: '01/02/2026', status: 'active', postCount: 3, province: 'กรุงเทพมหานคร' },
  { id: 'u3', name: 'พิมพ์ชนก แสงทอง', email: 'pim@gmail.com', gender: 'หญิง', joinedAt: '20/02/2026', status: 'active', postCount: 1, province: 'เชียงใหม่' },
  { id: 'u4', name: 'วิชัย รักษ์ดี', email: 'wichai@gmail.com', gender: 'ชาย', joinedAt: '01/03/2026', status: 'active', postCount: 2, province: 'เชียงใหม่' },
  { id: 'u5', name: 'นันทนา ศรีสุข', email: 'nan@gmail.com', gender: 'หญิง', joinedAt: '05/03/2026', status: 'suspended', postCount: 1, province: 'ปทุมธานี' },
];

export const adminCredentials = {
  username: 'admin',
  password: 'admin123',
};