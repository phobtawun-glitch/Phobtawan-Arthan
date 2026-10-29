export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  imageUrl?: string;
  gpsCoords?: string;
  createdAt: string;
}

export interface Post {
  Post_ID: number;
  Posting_Name: string;
  Post_Detail: string;
  Place_Name: string;

  Category_ID: number;
  Category_Name: string;

  Post_Type_ID: number;
  Post_Type_Name: string;

  Post_State: string;

  About_Thing_Date: string;
  Posting_Report_Date: string;
  Posting_Report_Time: string;

  Post_Image: string;

  Member_ID: number;

  Province_Name?: string;
  District_Name?: string;
  Subdistrict_Name?: string;

  Receiver_Name?: string;
  Receiver_Contact?: string;
  Receiver_Image?: string;
}