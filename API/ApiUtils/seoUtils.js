/* Copyright (c) 2022 TORITI LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const SEO_SHORT_DESC_LENGTH = 170;
const SEO_TITLE_LENGTH = 65;
const SITE_NAME = `https://${process.env.PROJECT_NAME}`;
const SITE_KEYWORD = [
  'Action',
  'Drama',
  'Fantasy',
  'Manhua',
  'Truyện Màu',
  'Comedy',
  'Manhwa',
  'Adventure',
  'Supernatural',
  'Mystery',
  'Xuyên Không',
  'Historical',
  'Romance',
  'Shoujo',
  'Đam Mỹ',
  'Manga',
  'School Life',
  'Seinen',
  'Slice Of Life',
  'Chuyển Sinh',
  'Shounen',
  'Gender Bender',
  'Cổ Đại',
  'Martial Arts',
  'Harem',
  'Horror',
  'Comic',
  'Soft Yaoi',
  'Yaoi',
  'Sci-Fi',
  'Webtoon',
  'Mature',
  'Josei',
  'Psychological',
  'Tragedy',
  'Sports',
  'Shoujo Ai',
  'Trinh Thám',
  'Soft Yuri',
  'Yuri',
  'Doujinshi',
  'Mecha',
  'Anime',
  'Tạp Chí Truyện Tranh',
  'One Shot',
  'Thiếu Nhi',
  'Cooking',
  'Live Action',
  'Việt Nam',
  'Shounen Ai',
  'Truyện Scan',
];
const SITE_TITLE = 'Trang web đọc truyện miễn phí, cập nhật nhanh nhất';
const SITE_DESCRIPTION = `❶❤️ Bất cứ truyện bạn thích đều có và miễn phí tại ${SITE_NAME}, ❤️ Web đọc truyện tranh online, không quảng cáo và cập nhật nhanh nhất Việt Nam`;
const SITE_IMAGE_URL = `${SITE_NAME}/media/images/Logo.jpg`;

function _getStaticMetatags() {
  let metatags = [];
  metatags.push({
    type: 'meta',
    'http-equiv': 'Content-Type',
    content: 'text/html; charset=utf-8',
  });
  metatags.push({ type: 'meta', 'http-equiv': 'REFRESH', content: '14400' });
  metatags.push({ type: 'meta', name: 'googlebot', content: 'noarchive' });
  metatags.push({ type: 'meta', name: 'robots', content: 'noarchive' });

  //link to Google Webmaster tool

  // metatags.push({
  //   type: "meta",
  //   name: "google-site-verification",
  //   content: "dOtfBRGThzUG9sgr1NI3UNsPQ2FKwL7oaODR9o6lCeI"
  // });

  // FACEBOOK OPEN GRAPH
  // metatags.push({ type:"meta",property:"fb:app_id" ,content:"2034212100232051"});
  metatags.push({
    type: 'meta',
    property: 'og:site_name',
    content: SITE_NAME,
  });
  metatags.push({
    type: 'meta',
    property: 'og:rich_attachment',
    content: 'true',
  });

  // iOS Web App Tags
  metatags.push({
    type: 'meta',
    name: 'viewport',
    content: 'width=device-width,initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  });

  metatags.push({
    type: 'meta',
    name: 'apple-mobile-web-app-capable',
    content: 'yes',
  });
  metatags.push({
    type: 'meta',
    name: 'apple-mobile-web-app-status-bar-style',
    content: 'black',
  });
  return metatags;
}

function _getFacebookMetadata(title, description, url, imageUrl, keywords, createdAt, updatedAt) {
  let metatags = [];
  /* Optimize for Facebook */
  metatags.push({
    type: 'meta',
    property: 'article:publisher',
    content: SITE_NAME,
  });
  metatags.push({ type: 'meta', property: 'og:type', content: 'article' });
  metatags.push({
    type: 'meta',
    property: 'og:image',
    content: imageUrl,
  });
  // metatags.push({ type: "meta", property: "og:image:width", content: "720" });
  // metatags.push({ type: "meta", property: "og:image:height", content: "330" });

  // FACEBOOK OPEN GRAPH
  metatags.push({
    type: 'meta',
    property: 'article:published_time',
    content: createdAt ? createdAt : new Date().toISOString(),
  });

  metatags.push({
    type: 'meta',
    property: 'article:modified_time',
    content: updatedAt ? updatedAt : new Date().toISOString(),
  });

  metatags.push({
    type: 'meta',
    property: 'og:url',
    content: url,
  });
  metatags.push({
    type: 'meta',
    property: 'og:title',
    content: title,
  });
  metatags.push({
    type: 'meta',
    property: 'og:type',
    content: 'artical',
  });
  metatags.push({
    type: 'meta',
    property: 'og:description',
    content: description.substring(0, SEO_SHORT_DESC_LENGTH),
  });

  metatags.push({ property: 'article:tag', content: 'Website đọc truyện tranh' });
  metatags.push({ property: 'article:tag', content: SITE_NAME });

  for (let i = 0; i < keywords.length; i++) {
    const tag = keywords[i];
    metatags.push({ property: 'article:tag', content: tag });
  }

  return metatags;
}

function _getGoogleSEOMetadata(title, description, keywords, url) {
  let metatags = [];
  metatags.push({
    type: 'title',
    content: title.substring(0, SEO_TITLE_LENGTH),
  });

  metatags.push({
    type: 'meta',
    name: 'description',
    content: description.substring(0, SEO_SHORT_DESC_LENGTH),
  });

  metatags.push({
    type: 'meta',
    name: 'keywords',
    content: keywords.join(','),
  });

  //this must be unique
  metatags.push({
    type: 'link',
    rel: 'canonical',
    href: url,
  });
  return metatags;
}

function getMetatagsForBooks(booksData) {
  let metatags = [];
  let keywords = [];
  if (booksData.booksTagCloud !== null && booksData.booksTagCloud.length > 0) {
    keywords = booksData.booksTagCloud.split(';');
  }
  /* Optimize for Facebook */
  let facebookMetadata = _getFacebookMetadata(
    booksData.booksName,
    booksData.booksName,
    SITE_NAME + booksData.booksUrl,
    booksData.booksAvatar,
    keywords,
    booksData.createdAt,
    booksData.updatedAt,
  );
  metatags = metatags.concat(facebookMetadata);

  /* Optimize for Google Search */
  let googleMetadata = _getGoogleSEOMetadata(booksData.booksName, booksData.booksName, keywords, SITE_NAME + booksData.booksUrl);
  metatags = metatags.concat(googleMetadata);

  let staticMetadata = _getStaticMetatags();
  metatags = metatags.concat(staticMetadata);

  return metatags;
}

function getMetatagsForPages() {
  let metatags = [];

  // /* Optimize for Facebook */
  let facebookMetadata = _getFacebookMetadata(SITE_TITLE, SITE_DESCRIPTION, SITE_NAME, SITE_IMAGE_URL, SITE_KEYWORD);
  metatags = metatags.concat(facebookMetadata);

  /* Optimize for Google Search */
  let googleMetadata = _getGoogleSEOMetadata(SITE_TITLE, SITE_DESCRIPTION, SITE_KEYWORD, SITE_NAME);
  metatags = metatags.concat(googleMetadata);

  let staticMetadata = _getStaticMetatags();
  metatags = metatags.concat(staticMetadata);

  return metatags;
}

module.exports = {
  getMetatagsForBooks,
  getMetatagsForPages,
};
