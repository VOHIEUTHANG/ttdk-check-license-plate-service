const chai = require('chai');
const expect = chai.expect;
const AppUserVehicleFunctions = require('../AppUserVehicleFunctions');
const { VEHICLE_PLATE_TYPE, VEHICLE_TYPE } = require('../AppUserVehicleConstant');

const vehiclePlateNumberList = [
  {
    plate: '12839452',
    result: false,
    type: VEHICLE_TYPE.CAR,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '00F12345',
    result: false,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.BLUE,
  },
  {
    plate: '037A53824',
    result: true,
    type: VEHICLE_TYPE.CAR,
    color: VEHICLE_PLATE_TYPE.YELLOW,
  },
  {
    plate: '11A04603',
    result: true,
    type: VEHICLE_TYPE.RO_MOOC,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '12A00486',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '12323S123',
    result: false,
    type: VEHICLE_TYPE.RO_MOOC,
    color: VEHICLE_PLATE_TYPE.RED,
  },
  {
    plate: '12A05609',
    result: true,
    type: VEHICLE_TYPE.CAR,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '12A12345',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.RED,
  },
  {
    plate: '77C04165',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '299HK123142',
    result: false,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '12K0736',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '14A12950',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '14C03514',
    result: false,
    type: VEHICLE_TYPE.RO_MOOC,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: 'MĐ1232HC',
    result: false,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '123D',
    result: false,
    type: VEHICLE_TYPE.RO_MOOC,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
  {
    plate: '61N6548',
    result: true,
    type: VEHICLE_TYPE.OTHER,
    color: VEHICLE_PLATE_TYPE.WHITE,
  },
];

describe(`Tests Check vehicle`, function () {
  it(`get list permission`, done => {
    vehiclePlateNumberList.forEach((plate, index) => {
      const isValid = AppUserVehicleFunctions.checkValidVehicleIdentity(plate.plate, plate.type, plate.color);
      expect(isValid === plate.result).equal(true);
      console.log(`Test ${index} - biển số xe: ${plate.plate} -> kết quả ${isValid}`);
    });
    done();
  });
});
