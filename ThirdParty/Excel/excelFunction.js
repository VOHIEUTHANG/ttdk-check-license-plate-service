/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
const xlsx = require('xlsx');
const path = require('path');
const moment = require('moment');
const { APP_USER_LEVEL } = require('../../API/AppUserWorkInfo/AppUserWorkInfoConstants');

const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) => {
  const workBook = xlsx.utils.book_new();
  const workSheetData = [workSheetColumnNames, ...data];
  const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
  xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
  xlsx.writeFile(workBook, path.resolve(filePath));
};

async function importExcel(filePath) {
  var workBook = xlsx.readFile(filePath);
  var workSheet = workBook.Sheets[workBook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(workSheet);
  var name;
  var bxs;
  var sdt;
  var email;
  var fullData = [];
  for (let index = 2; index < data.length + 2; index++) {
    if (workSheet[`B${index}`] === undefined || workSheet[`C${index}`] === undefined || workSheet[`D${index}`] === undefined) {
      continue; //neu row bi loi thi bo qua, khong can import
    } else {
      bxs = workSheet[`B${index}`].v;
      sdt = workSheet[`C${index}`].v;
      customerRecordCheckExpiredDate = workSheet[`D${index}`].v;
    }
    if (workSheet[`E${index}`] === undefined) {
      name = '';
    } else {
      name = workSheet[`E${index}`].v;
    }
    if (workSheet[`F${index}`] === undefined) {
      email = '';
    } else {
      email = workSheet[`F${index}`].v;
    }
    fullData.push({
      customerRecordFullName: name,
      customerRecordPlatenumber: bxs,
      customerRecordPhone: sdt.toString(),
      customerRecordEmail: email,
      customerRecordCheckExpiredDate: customerRecordCheckExpiredDate,
    });
  }
  return fullData;
}

const exportExcelOldFormat = (dataRows, workSheetName, filePath) => {
  const workBook = xlsx.utils.book_new();
  const workSheetData = dataRows;
  const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
  xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
  xlsx.writeFile(workBook, path.resolve(filePath));
};

async function importExcelOldformat(filePath) {
  console.info(`importExcelOldformat: ${filePath}`);
  var workBook = xlsx.readFile(filePath);
  var workSheet = workBook.Sheets[workBook.SheetNames[0]];
  var data = xlsx.utils.sheet_to_json(workSheet);
  var name;
  var bxs;
  var sdt;
  var email;
  var fullData = [];
  let isUnicodeEncoding = false;
  //có 2 dạng file template
  //1 dạng là file template cũ từ trạm, encoding VNI
  //1 dạng là file template do mình export ra
  if (workSheet[`E4`].v === 'Số điện thoại') {
    isUnicodeEncoding = true;
  }
  for (let index = 5; index < data.length + 5; index++) {
    //Cột B: Biển số , cột F: Ngày hết hạn
    if (workSheet[`B${index}`] === undefined || workSheet[`F${index}`] === undefined) {
      continue; //neu row bi loi thi bo qua, khong can import
    } else {
      bxs = workSheet[`B${index}`].v;
      sdt = workSheet[`E${index}`].v;

      let _checkDate = moment(workSheet[`F${index}`].v, 'DD/MM/YYYY').format('DD/MM/YYYY');
      if (_checkDate === 'Invalid date') {
        _checkDate = moment(workSheet[`F${index}`].w, 'DD/MM/YYYY').format('DD/MM/YYYY');
        if (_checkDate === 'Invalid date') {
          console.info(`importExcelOldformat Invalid date ` + workSheet[`F${index}`]);
          _checkDate = '';
        }
      }
      customerRecordCheckExpiredDate = _checkDate;
    }

    if (isUnicodeEncoding) {
      if (workSheet[`C${index}`] === undefined) {
        name = '';
      } else {
        name = workSheet[`C${index}`].v;
      }
      if (workSheet[`G${index}`] === undefined) {
        email = '';
      } else {
        email = workSheet[`G${index}`].v;
      }
    }

    fullData.push({
      customerRecordFullName: name,
      customerRecordPlatenumber: bxs.toString(),
      customerRecordPhone: sdt.toString(),
      customerRecordEmail: email,
      customerRecordCheckExpiredDate: customerRecordCheckExpiredDate,
    });
  }
  return fullData;
}

async function importAppUserList(filePath) {
  console.info(`import app user list: ${filePath}`);
  const workBook = xlsx.readFile(filePath);
  const workSheet = workBook.Sheets[workBook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(workSheet);

  const fullData = [];

  for (let index = 2; index < data.length + 2; index++) {
    const stationCode = workSheet[`C${index}`] ? workSheet[`C${index}`].v : '';
    const fullName = workSheet[`E${index}`] ? workSheet[`E${index}`].v : '';
    const employeeCode = workSheet[`F${index}`] ? workSheet[`F${index}`].v : '';
    const employeeLevel = workSheet[`G${index}`] ? workSheet[`G${index}`].v : '';
    const birthDay = _getValidDate(workSheet[`H${index}`]);
    const userHomeAddress = workSheet[`I${index}`] ? workSheet[`I${index}`].v : '';
    const appUserIdentity = workSheet[`J${index}`] ? workSheet[`J${index}`].w : '';
    const licenseDateFrom = _getValidDate(workSheet[`K${index}`]);
    const licenseDateEnd = _getValidDate(workSheet[`L${index}`]);

    const licenseDecisionDate = _getValidDate(workSheet[`M${index}`]);
    const licenseNumber = workSheet[`N${index}`] ? workSheet[`N${index}`].v : '';
    const licenseCommitmentYear = workSheet[`O${index}`] ? workSheet[`O${index}`].v : '';

    let appUserLevel = APP_USER_LEVEL.NORMAL;
    if (employeeLevel && employeeLevel.includes('bậc cao')) {
      appUserLevel = APP_USER_LEVEL.HIGH_LEVEL;
    }

    if (!employeeCode || !appUserIdentity) {
      continue; // ignore if missing important value
    }

    fullData.push({
      stationCode: stationCode,
      firstName: fullName,
      employeeCode: employeeCode,
      appUserLevel: appUserLevel,
      appUserIdentity: appUserIdentity && String(appUserIdentity).split('.').join(''), // remove dot characters
      birthDay: birthDay,
      userHomeAddress: userHomeAddress,
      licenseDateFrom: licenseDateFrom,
      licenseDateEnd: licenseDateEnd,
      licenseDecisionDate: licenseDecisionDate,
      licenseNumber: licenseNumber,
      licenseCommitmentYear: licenseCommitmentYear,
    });
  }

  return fullData;
}

function _getValidDate(excelObject, format = 'DD/MM/YYYY') {
  if (!excelObject) return '';
  let dateValue = moment(excelObject.v, format).format(format);

  if (dateValue === 'Invalid date') {
    dateValue = moment(excelObject.w, format).format(format);
    if (dateValue === 'Invalid date') {
      dateValue = '';
    }
  }

  return dateValue;
}

module.exports = {
  exportExcel,
  importExcel,
  importExcelOldformat,
  exportExcelOldFormat,
  importAppUserList,
};
