/* Copyright (c) 2022 TORITI LIMITED 2022 */

module.exports = {
  subject: '[KiemDinhOto.vn] XÁC NHẬN LỊCH HẸN',
  htmlBody: `<div class="container">
  <div class="row">
     <div class="col-md-12">
        <p>Xin chào {{fullnameSchedule}},</p>
        <p></br></p>
        <p>{{stationsName}} xác nhận lịch hẹn kiểm định của khách hàng có ô tô BKS {{licensePlates}} vào lúc {{time}} {{dateSchedule}} tại {{stationsAddress}}. </p>
        <p></br></p>
        <p>Quý khách lưu ý mang đủ các giấy tờ phương tiện bao gồm: </p>
        <ul>
          <li> Giấy đăng ký xe</li>
          <li> Bảo hiểm trách nhiệm bắt buộc</li>
          <li> Giấy chứng nhận đăng kiểm cũ</li>
        </ul>
        <p>Trước khi đi kiểm định, quý khách có thể kiểm tra thông tin phạt nguội</p>
        <p></br></p>
        <p>*** LƯU Ý: Mọi thông tin cần hỗ trợ qua số hotline {{stationsHotline}} </p>
        <p></br></p>
        <p></br></p>
        <p>Trân thành cảm ơn quý khách</p>
     </div>
  </div>`,
  body: '',
};
