UPDATE settings SET value=JSON_SET(value, '$.websiteLoadingBar', 'on'), version=version+1 WHERE id='appearance' AND JSON_CONTAINS_PATH(value, 'one', '$.websiteLoadingBar')=0;
