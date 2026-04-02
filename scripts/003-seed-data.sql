-- Football Tournament Platform — Seed Data (Giải HUGO / Đà Nẵng)
-- Execute AFTER 002-trigger-standings.sql
-- Liên minh: name = 'Liên minh …', short_name = dạng gọn (vd. 51K14+51K21)
-- Đơn: short_name = name

TRUNCATE match_events, matches, standings, venues, teams CASCADE;

-- Sân bóng Đà Nẵng
INSERT INTO venues (name, address, lat, lng) VALUES
(
  'Sân Lê Quý Đôn',
  '364M+CM3, An Trung 3, An Hải, Đà Nẵng, Việt Nam',
  16.0555624,
  108.2340864
),
(
  'Sân Trường ĐH Kinh Tế',
  '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn, Đà Nẵng, Việt Nam',
  16.0473508,
  108.2394421
);

INSERT INTO teams (name, short_name, logo_url, group_name) VALUES
-- Bảng A
(
  'Liên minh 51K14 + 51K21',
  '51K14+51K21',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140654/Li%C3%AAn_minh_51K14_51K21_xnhta5.png',
  'A'
),
(
  'Liên minh 48K21.2 + 48K05',
  '48K21.2+48K05',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140649/Li%C3%AAn_minh_48k21.2-48k05_uamt7p.png',
  'A'
),
(
  '48K14.2',
  '48K14.2',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140642/48K14.2_m0sgaj.png',
  'A'
),
-- Bảng B
(
  'Liên minh 51K36 + 51K36P',
  '51K36+51K36P',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140648/51K36_51K36-P_hnvl3k.png',
  'B'
),
(
  'Liên minh 49K05 + 51K05',
  '49K05+51K05',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140642/Li%C3%AAn_minh_49K05_51K05_rplzas.png',
  'B'
),
(
  'Liên minh 50K21.2 + 50K05',
  '50K21.2+50K05',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140652/Li%C3%AAn_minh_50K21.2_50K05_pyebii.png',
  'B'
),
-- Bảng C
(
  '48K14.1',
  '48K14.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140647/48K14.1_sljzjq.png',
  'C'
),
(
  '48K21.1',
  '48K21.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140644/48K21.1_d3xde3.png',
  'C'
),
(
  '50K14.1',
  '50K14.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140643/50K14.1_jn5udg.png',
  'C'
),
-- Bảng D
(
  'Liên minh 49K14.2 + 49K21.1',
  '49K14.2+49K21.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140652/Li%C3%AAn_minh_49K14.2_49K21.1_y1c5u5.png',
  'D'
),
(
  '49K14.1',
  '49K14.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140644/49K14.1_eslexj.png',
  'D'
),
(
  '50K21.1',
  '50K21.1',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140644/50K21.1_ad43jh.png',
  'D'
),
(
  '50K14.2',
  '50K14.2',
  'https://res.cloudinary.com/din9j0vkz/image/upload/v1775140643/50K14.2_dcsat2.png',
  'D'
);

SELECT create_initial_standings();
