/* Copyright (c) 2022 TORITI LIMITED 2022 */

module.exports = {
  subject: '[TTDK] Báo cáo tình hình chung các trạm đăng kiểm ngày {{today}}',
  htmlBody: `<div class="container">
  <div class="row">
     <div class="col-md-12">
        <p>Xin chào</p>
        <p>Đây là báo cáo tình hình chung của các trạm đăng kiểm  ngày {{today}}</p>
        <p></br></p>
        <p></p>
        <h3>* Trung tâm đăng kiểm</h3>
        <ul>
        <li>Tổng số: {{total}} (Danh sách xem thêm file đính kèm)</li>
        <li>Đang hoạt động: {{activeStation}} (Danh sách xem thêm file đính kèm)</li>
        <li>Đóng cửa: {{inactiveStation}} (Danh sách xem thêm file đính kèm)</li>
        <li>Kích hoạt: {{deployedStation}} (Danh sách xem thêm file đính kèm)</li>
        <li>Chưa kích hoạt: {{blockStation}} (Danh sách xem thêm file đính kèm)</li>
        </ul>
        <h3>* Dây chuyền</h3>
        <ul>
        <li>Dự kiến: {{inspectionLineExpect}}</li>
        <li>Hoạt động: {{inspectionLineActual}}</li>
        </ul>
        <h3>* Đăng kiểm viên</h3>
        <ul>
        <li>Dự kiến: {{stationUserExpect}} (Danh sách xem thêm file đính kèm)</li>
        <li>Hoạt động: {{stationUserActual}} (Danh sách xem thêm file đính kèm)</li>
        </ul>
        <h3>* Năng lực đăng kiểm</h3>
        <ul>
        <li>Dự kiến: {{inspectionExpect}} phương tiện / ngày</li>
        <li>Thực tế: {{inspectionActual}}  phương tiện / ngày</li>
        <li>Năng suất online: {{inspectionOnline.inspectionCarCount}} ô tô / ngày , {{inspectionOnline.inspectionOtherVehicleCount}} phương tiện khác / ngày</li>
        </ul>
     </div>
  </div>`,
  body: '',
};
