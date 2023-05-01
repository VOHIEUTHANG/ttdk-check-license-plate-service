/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
const CustomerReviewResourceAccess = require('../resourceAccess/CustomerReviewResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { POPULAR_ERROR } = require('../../Common/CommonConstant');
const { CUSTOMER_REVIEW_ERRORS } = require('../CustomerReviewConstants');

async function userAddReview(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let reviewData = req.payload;
      if (!req.currentUser.appUserId) {
        return reject('INVALID REQUEST');
      }
      reviewData.appUserId = req.currentUser.appUserId;

      // attach stationsId from scheduleData
      const scheduleData = await CustomerScheduleResourceAccess.findById(reviewData.customerScheduleId);
      if (scheduleData && scheduleData.stationsId > 0) {
        reviewData.stationsId = scheduleData.stationsId;
      } else {
        return reject(CUSTOMER_REVIEW_ERRORS.INVALID_SCHEDULE);
      }

      // check duplicate review
      const existedReview = await CustomerReviewResourceAccess.find(
        { appUserId: reviewData.appUserId, customerScheduleId: reviewData.customerScheduleId },
        0,
        1,
      );
      if (existedReview && existedReview.length > 0) {
        return reject(CUSTOMER_REVIEW_ERRORS.DUPLICATE_REVIEW);
      }

      const result = await CustomerReviewResourceAccess.insert(reviewData);
      if (result) {
        await CustomerScheduleResourceAccess.updateById(reviewData.customerScheduleId, { customerReviewId: result[0] });
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const filter = req.payload.filter;
      const skip = req.payload.skip;
      const limit = req.payload.limit;
      const order = req.payload.order;
      const startDate = req.payload.startDate;
      const endDate = req.payload.endDate;
      const searchText = req.payload.searchText;

      let reviewList = await CustomerReviewResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (reviewList && reviewList.length > 0) {
        let reviewCount = await CustomerReviewResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        if (reviewCount > 0) {
          return resolve({ data: reviewList, total: reviewCount });
        }
      }
      return resolve({ data: [], total: 0 });
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const reviewId = req.payload.id;
      const data = req.payload.data;

      let updateResult = await CustomerReviewResourceAccess.updateById(reviewId, data);
      if (updateResult) {
        return resolve(updateResult);
      } else {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const reviewId = req.payload.id;

      let userReview = await CustomerReviewResourceAccess.findById(reviewId);

      if (userReview) {
        return resolve(userReview);
      } else {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
    } catch (e) {
      console.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let reviewId = req.payload.id;

      let result = await CustomerReviewResourceAccess.deleteById(reviewId);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  find,
  updateById,
  findById,
  deleteById,
  userAddReview,
};
