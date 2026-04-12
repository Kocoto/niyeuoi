# UI/UX Improvement Plan

## Muc tieu

App can tro nen ro rang hon, de dung hon tren dien thoai, va tao cam giac day la khong gian rieng cua hai nguoi thay vi mot bo suu tap tinh nang.

## Nguyen tac uu tien

1. Mobile-first truoc desktop.
2. Giao dien phai the hien ro ai dang dung app: GF hay BF.
3. Giam cam giac dan trai, tang cam giac than mat va co chu dich.
4. Uu tien trai nghiem hang ngay, thao tac nhanh, de quay lai.
5. Toan bo ngon ngu giao dien su dung tieng Viet nhat quan.

## Uu tien 1: Lam ro 2 che do su dung

### Muc tieu

Nguoi dung mo app len phai cam nhan ngay duoc day la goc nhin cua ai, khong chi la mot role ky thuat.

### Viec can lam

- Tach ro giao dien theo che do GF va BF.
- Dung mau nhan, nhan xung, thong diep va trang thai rieng cho tung role.
- Hien thi ro nguoi dang dung app trong header va cac khu vuc quan trong.
- An hoac bien doi cac thao tac chi danh cho BF/GF theo cach co chu dich.

### Ket qua mong muon

- Nhin vao app la biet ngay dang o che do cua ai.
- Giam nham lan khi chuyen nguoi dung.
- Cam giac san pham ca nhan hon.

## Uu tien 2: Giam cam giac dan trai tinh nang

### Muc tieu

App nhieu tinh nang nhung khong duoc tao cam giac roi hoac khong biet bat dau tu dau.

### Viec can lam

- Giu 3-4 muc cot loi o bottom navigation.
- Gom cac tinh nang con lai thanh nhom hop ly trong khu vuc "Them".
- Bien trang chu thanh dashboard dieu huong, khong chi la trang lien ket.
- Moi man hinh chinh chi nen co 1 hanh dong chinh de nhan biet.

### Ket qua mong muon

- Nguoi dung de tim tinh nang can dung.
- App it bi cam giac "day nhieu thu" tren mobile.
- Luong su dung ngay thuong tro nen tu nhien hon.

## Uu tien 3: Tang chieu sau cam xuc

### Muc tieu

Khong chi luu du lieu, ma tao duoc trai nghiem tinh cam, gan ky niem va su ket noi.

### Viec can lam

- Trang Timeline can co cam giac ke chuyen, khong chi la list + card.
- Trang Places nen gan ky niem voi dia diem, khong chi la danh sach quan.
- Trang Mood va Deep Talk nen co nhip cham hon, rieng tu hon, it "quan tri".
- Cac empty state nen mang tinh cam xuc, khong qua ky thuat.

### Ket qua mong muon

- App tao duoc ban sac rieng.
- Noi dung cam thay "co hon" thay vi chi la du lieu.
- Nguoi dung co ly do quay lai de ghi lai ky niem.

## Uu tien 4: Chuan hoa mobile-first

### Muc tieu

Toan bo trai nghiem tren dien thoai phai gon, de cham, khong bi tran layout, khong bi che boi bottom bar hay safe area.

### Viec can lam

- Chuan hoa chieu cao an toan cho cac page co noi dung full-height nhu map, modal, sheet.
- Dung safe-area inset cho top/bottom tren mobile.
- Header mobile gon hon, uu tien 1 dong chinh va 1 trang thai phu.
- Tat ca modal/sheet dung cung mot he thong spacing, radius, shadow va vung cuon.
- Dat cac CTA chinh vao vung ngon tay cai, tranh xa tam voi.

### Ket qua mong muon

- App de dung bang mot tay.
- Giam cac loi layout tren mobile.
- Trai nghiem nhat quan hon giua cac man.

## Uu tien 5: Thong nhat ngon ngu giao dien

### Muc tieu

Toan bo he thong su dung cung mot giong dieu, cung mot ngon ngu, tranh pha tron tieng Anh, tieng Viet co dau va khong dau.

### Viec can lam

- Chot toan bo UI la tieng Viet.
- Chon mot giong dieu than mat, nhe nhang, gan gui.
- Dung tu ngan, ro, co tinh huong su dung cu the.
- Chuan hoa ten nut, nhan trang thai, tieu de va empty state.

### Ket qua mong muon

- Giao dien dong nhat.
- De doc, de hieu, it "thoat mood".
- Tang cam giac day la mot san pham duoc cham chut.

## 3 hang muc nen lam ngay

1. Thiet ke lai trang Home thanh dashboard theo role.
2. To chuc lai mobile navigation va nhom tinh nang.
3. Chuan hoa UI pattern cho list, card, modal va bottom sheet.

## Ke hoach theo tung man hinh

### Home

- Bien thanh dashboard chinh.
- Hien thong tin va loi nhac khac nhau cho GF/BF.
- Dua cac muc "hom nay", "gan day", "goi y hanh dong tiep theo" len dau.

### Map

- Uu tien mobile viewport an toan.
- Nho gon cac control phu.
- Hien thong tin vi tri theo cach don gian, khong che noi dung chinh.

### Places

- Chuyen tu list tinh nang sang trai nghiem dia diem + ky niem.
- Hien ro "da di", "muon di", "goi y lan toi".

### Timeline

- Tang tinh ke chuyen.
- Nhom moc thoi gian ro hon.
- Uu tien anh, cam xuc va ky niem thay vi metadata.

### Deep Talk

- Tao khong khi rieng tu hon.
- Giam cam giac form/quan tri.
- Tang gia tri cua moi cau hoi va cau tra loi.

## Tieu chi danh gia thanh cong

- Nguoi dung nhin giao dien biet ngay dang o che do GF hay BF.
- Mobile khong con cac loi tran layout, che bottom bar, kho cham.
- Trang chu tro thanh noi bat dau hop ly cho moi phien su dung.
- Cac tinh nang co ban sac ro hon, bot giong nhau.
- Giao dien dong nhat ve ngon ngu, mau sac va cach dieu huong.

## Thu tu trien khai de xuat

1. Chuan hoa navigation, safe area va mobile layout.
2. Thiet ke lai Home.
3. Chuan hoa modal, sheet, card, form.
4. Nang cap Timeline, Places, Deep Talk theo huong cam xuc hon.
5. Ra soat va dong bo toan bo copywriting tieng Viet.
