UPDATE settings SET value = JSON_SET(value,
 '$.galleryTitle', 'Events & Activities', '$.galleryDescription', '',
 '$.sections', CONCAT_WS(',', NULLIF(JSON_UNQUOTE(JSON_EXTRACT(value, '$.sections')), ''), 'gallery,closingCta,blog,navigation,footer,floatingActions')),
 version = version + 1
WHERE id = 'homepage' AND JSON_CONTAINS_PATH(value, 'one', '$.galleryTitle') = 0;
